# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import requests
from tsp import solve_tsp, solve_cvrptw

app = FastAPI(title="Polaris Solver API", description="Route optimization service")

class Coordinate(BaseModel):
    lat: float
    lng: float

class TableRequest(BaseModel):
    coordinates: List[Coordinate]

class SolveTSPRequest(BaseModel):
    coordinates: List[Coordinate]
    vehicle_capacities: List[int]
    demands: List[int]

class OrderInput(BaseModel):
    id: int
    lat: float
    lng: float
    demand_kg: float
    window_start: int
    window_end: int

class DriverInput(BaseModel):
    id: int
    lat: float
    lng: float
    capacity_kg: float

class SolveCVRPTWRequest(BaseModel):
    orders: List[OrderInput]
    drivers: List[DriverInput]

OSRM_BASE_URL = "http://localhost:5000"

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "solver"}

@app.post("/table")
def get_drive_time_matrix(request: TableRequest):
    """
    Takes a list of coordinates and returns the raw drive-time matrix from OSRM.
    This proves the plumbing works before adding OR-Tools.
    """
    if len(request.coordinates) < 2:
        raise HTTPException(status_code=400, detail="At least 2 coordinates are required")
    
    # OSRM expects coordinates in lng,lat format joined by semicolons
    coords_string = ";".join([f"{c.lng},{c.lat}" for c in request.coordinates])
    
    osrm_url = f"{OSRM_BASE_URL}/table/v1/driving/{coords_string}"
    
    try:
        response = requests.get(osrm_url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Failed to communicate with OSRM: {str(e)}")

@app.post("/solve/tsp")
def solve_tsp_endpoint(request: SolveTSPRequest):
    if len(request.coordinates) < 2:
        raise HTTPException(status_code=400, detail="At least 2 coordinates required")
    if len(request.demands) != len(request.coordinates):
        raise HTTPException(status_code=400, detail="Demands list length must match coordinates list length")

    coords_string = ";".join([f"{c.lng},{c.lat}" for c in request.coordinates])
    osrm_url = f"{OSRM_BASE_URL}/table/v1/driving/{coords_string}"

    try:
        response = requests.get(osrm_url)
        response.raise_for_status()
        matrix_data = response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"OSRM failed: {str(e)}")

    duration_matrix = matrix_data["durations"]
    routes = solve_tsp(duration_matrix, request.vehicle_capacities, request.demands)

    if routes is None:
        raise HTTPException(status_code=500, detail="Solver found no solution")

    total_duration = 0
    for route in routes:
        total_duration += sum(
            duration_matrix[route[i]][route[i+1]] for i in range(len(route)-1)
        )

    return {
        "routes": routes,
        "total_duration_seconds": total_duration
    }

@app.post("/solve/cvrptw")
def solve_cvrptw_endpoint(request: SolveCVRPTWRequest):
    """
    Accepts orders and drivers, solves the CVRPTW problem using OSRM travel durations
    and Google OR-Tools. Handles multi-vehicle starts and ends at driver homes.
    """
    N = len(request.orders)
    M = len(request.drivers)

    if N == 0:
        return {"routes": [], "unassigned_order_ids": []}
    if M == 0:
        return {"routes": [], "unassigned_order_ids": [o.id for o in request.orders]}

    # 1. Combine coordinates: N orders followed by M driver start bases
    coordinates = []
    for o in request.orders:
        coordinates.append(Coordinate(lat=o.lat, lng=o.lng))
    for d in request.drivers:
        coordinates.append(Coordinate(lat=d.lat, lng=d.lng))

    # 2. Query OSRM to get the combined duration matrix
    coords_string = ";".join([f"{c.lng},{c.lat}" for c in coordinates])
    osrm_url = f"{OSRM_BASE_URL}/table/v1/driving/{coords_string}"

    try:
        response = requests.get(osrm_url)
        response.raise_for_status()
        matrix_data = response.json()
        # OR-Tools requires integer values from transit callbacks;
        # OSRM returns floats (e.g. 677.7s), so round them.
        duration_matrix = [[round(val) for val in row] for row in matrix_data["durations"]]
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"OSRM table query failed: {str(e)}")

    # 3. Build demands, vehicle capacities, starts/ends, and time windows
    # Starts and ends are the driver nodes (indices N to N+M-1)
    starts = [N + j for j in range(M)]
    ends = [N + j for j in range(M)]
    
    vehicle_capacities = [int(d.capacity_kg) for d in request.drivers]
    
    # Demands: order demands followed by 0 for driver home bases
    demands = [int(o.demand_kg) for o in request.orders] + [0] * M
    
    # Time windows: order windows followed by wide-open windows for driver bases
    time_windows = [(int(o.window_start), int(o.window_end)) for o in request.orders] + [(0, 24 * 3600)] * M

    # 4. Run the solver
    try:
        routes, unassigned, durations = solve_cvrptw(
            duration_matrix, vehicle_capacities, demands, starts, ends, time_windows
        )
    except Exception as e:

        # Prevent crash by returning all orders as unassigned
        return {
            "routes": [],
            "unassigned_order_ids": [o.id for o in request.orders]
        }

    if routes is None:
        return {
            "routes": [],
            "unassigned_order_ids": [o.id for o in request.orders]
        }

    # 5. Format the routes and unassigned lists back to database IDs
    formatted_routes = []
    for vehicle_id, route in enumerate(routes):
        # Filter route stops to only include actual orders (nodes < N)
        order_stops = [request.orders[node].id for node in route if node < N]
        
        # Skip OSRM route query if the driver has no assigned stops, returning empty/null geometry
        if len(order_stops) == 0:
            formatted_routes.append({
                "driver_id": request.drivers[vehicle_id].id,
                "stop_order": [],
                "total_duration_seconds": 0.0,
                "total_distance_km": 0.0,
                "geometry": None
            })
            continue

        # Get sequence of coordinates: start base, order coordinates, end base
        route_coords = [coordinates[node] for node in route]
        coords_string = ";".join([f"{c.lng},{c.lat}" for c in route_coords])
        osrm_route_url = f"{OSRM_BASE_URL}/route/v1/driving/{coords_string}?geometries=geojson"

        try:
            route_res = requests.get(osrm_route_url)
            route_res.raise_for_status()
            route_data = route_res.json()
            osrm_route = route_data["routes"][0]
            # Extract coordinates path and flip from [lng, lat] to [lat, lng]
            geometry_coords = osrm_route["geometry"]["coordinates"]
            flipped_geometry = [[pt[1], pt[0]] for pt in geometry_coords]
            total_distance_km = osrm_route["distance"] / 1000.0
            # Use OSRM's actual road duration (not OR-Tools CumulVar which
            # only tracks solver-internal scheduling time, not real drive time)
            total_duration_seconds = osrm_route["duration"]
        except Exception as e:
            # Graceful fallback values on OSRM query failure
            flipped_geometry = []
            total_distance_km = 0.0
            total_duration_seconds = 0.0

        formatted_routes.append({
            "driver_id": request.drivers[vehicle_id].id,
            "stop_order": order_stops,
            "total_duration_seconds": total_duration_seconds,
            "total_distance_km": total_distance_km,
            "geometry": flipped_geometry
        })

    unassigned_order_ids = [request.orders[node].id for node in unassigned if node < N]

    return {
        "routes": formatted_routes,
        "unassigned_order_ids": unassigned_order_ids
    }

if __name__ == "__main__":
    import uvicorn
    import sys
    import os
    # Ensure current file's directory is in python path for uvicorn reloader
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
