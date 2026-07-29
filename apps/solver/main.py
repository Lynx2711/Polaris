# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import requests
import json
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

    # ------------ DIAGNOSTIC LOG 1: Raw input ------------
    print("\n" + "="*70)
    print("DIAGNOSTIC: /solve/cvrptw called")
    print(f"  Orders count: {N}, Drivers count: {M}")
    print("\n  -- Orders as received --")
    for i, o in enumerate(request.orders):
        print(f"    idx={i}  order_id={o.id}  lat={o.lat}  lng={o.lng}  "
              f"demand_kg={o.demand_kg}  window=({o.window_start}, {o.window_end})  "
              f"window_span={o.window_end - o.window_start}s")
    print("\n  -- Drivers as received --")
    for j, d in enumerate(request.drivers):
        print(f"    idx={j}  driver_id={d.id}  lat={d.lat}  lng={d.lng}  "
              f"capacity_kg={d.capacity_kg}")
    print("="*70)

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

    # ------------ DIAGNOSTIC LOG 2: Combined coordinate list with index mapping ------------
    print("\n" + "-"*70)
    print("DIAGNOSTIC: Combined coordinate list (sent to OSRM)")
    print(f"  Total nodes: {len(coordinates)} ({N} orders + {M} drivers)")
    for ci, c in enumerate(coordinates):
        if ci < N:
            label = f"ORDER  (order_id={request.orders[ci].id})"
        else:
            di = ci - N
            label = f"DRIVER (driver_id={request.drivers[di].id})"
        print(f"    coord_idx={ci}  lat={c.lat:>10.6f}  lng={c.lng:>10.6f}  -> {label}")
    print("-"*70)

    # 2. Query OSRM to get the combined duration matrix
    coords_string = ";".join([f"{c.lng},{c.lat}" for c in coordinates])
    osrm_url = f"{OSRM_BASE_URL}/table/v1/driving/{coords_string}"

    osrm_used = True
    try:
        response = requests.get(osrm_url, timeout=2.5)
        response.raise_for_status()
        matrix_data = response.json()
        duration_matrix = [[round(val) for val in row] for row in matrix_data["durations"]]
        print("\nDIAGNOSTIC: OSRM table query SUCCEEDED")
    except Exception as e:
        osrm_used = False
        print(f"\nDIAGNOSTIC: OSRM table query FAILED ({e}), using Haversine fallback")
        # Fallback to Haversine distance matrix at ~30 km/h avg urban speed if OSRM is not running
        import math
        duration_matrix = []
        for c1 in coordinates:
            row = []
            for c2 in coordinates:
                lat1, lng1 = math.radians(c1.lat), math.radians(c1.lng)
                lat2, lng2 = math.radians(c2.lat), math.radians(c2.lng)
                dlat, dlng = lat2 - lat1, lng2 - lng1
                a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
                dist_km = 6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                secs = round((dist_km / 30.0) * 3600.0)
                row.append(secs)
            duration_matrix.append(row)

    # ------------ DIAGNOSTIC LOG 3: Duration matrix summary ------------
    print(f"\nDIAGNOSTIC: Duration matrix ({len(duration_matrix)}x{len(duration_matrix[0])})")
    print("  Sample travel times (seconds) from each driver to each order:")
    for di in range(M):
        driver_node = N + di
        times_to_orders = [f"  ->order[{oi}]={duration_matrix[driver_node][oi]}s" for oi in range(N)]
        print(f"    driver[{di}] (node {driver_node}):{' '.join(times_to_orders)}")

    # 3. Build demands, vehicle capacities, starts/ends, and time windows
    # Starts and ends are the driver nodes (indices N to N+M-1)
    starts = [N + j for j in range(M)]
    ends = [N + j for j in range(M)]
    
    vehicle_capacities = [int(d.capacity_kg) for d in request.drivers]
    
    # Demands: order demands followed by 0 for driver home bases
    demands = [int(o.demand_kg) for o in request.orders] + [0] * M
    
    # Time windows for orders — fix midnight-crossing windows where end < start
    order_time_windows = []
    for o in request.orders:
        ws, we = int(o.window_start), int(o.window_end)
        if we < ws:
            # Midnight crossing: e.g. 8:14 PM (72859) -> 12:44 AM (2659)
            # Add 24h to the end so it becomes 89059 (next-day continuous timeline)
            we += 86400
            print(f"  FIX: order {o.id} midnight-crossing window ({ws}, {o.window_end}) -> ({ws}, {we})")
        order_time_windows.append((ws, we))
    
    # Compute max_time from actual window values — the solver's time dimension
    # ceiling must accommodate the largest window_end across all nodes
    max_window_end = max(we for _, we in order_time_windows) if order_time_windows else 86400
    max_time = max(max_window_end + 3600, 86400)  # +1h buffer for travel after last window
    
    # Driver depot windows span the full time horizon
    time_windows = order_time_windows + [(0, max_time)] * M
    print(f"  max_time for solver: {max_time}s (max window_end={max_window_end}s)")

    # ------------ DIAGNOSTIC LOG 4: Solver input summary ------------
    print("\n" + "-"*70)
    print("DIAGNOSTIC: Solver input (passed to solve_cvrptw)")
    print(f"  starts (driver start nodes): {starts}")
    print(f"  ends   (driver end nodes):   {ends}")
    print(f"  vehicle_capacities: {vehicle_capacities}")
    print(f"  demands:           {demands}")
    print("  time_windows:")
    for ti, tw in enumerate(time_windows):
        if ti < N:
            label = f"order_id={request.orders[ti].id}"
        else:
            label = f"driver_id={request.drivers[ti - N].id} (depot)"
        feasible_drivers = []
        if ti < N:
            for di in range(M):
                travel = duration_matrix[N + di][ti]
                if travel <= tw[1]:  # can reach before window closes
                    feasible_drivers.append(f"d{di}({travel}s)")
        print(f"    node {ti:>2}: ({tw[0]:>6}, {tw[1]:>6})  span={tw[1]-tw[0]:>6}s  {label}"
              + (f"  reachable_by: {', '.join(feasible_drivers) if feasible_drivers else 'NONE'}" if ti < N else ""))
    
    # Capacity feasibility check
    print("\n  -- Capacity feasibility per order --")
    for oi in range(N):
        d_kg = demands[oi]
        fits_in = [f"driver[{di}]({vehicle_capacities[di]}kg)" for di in range(M) if vehicle_capacities[di] >= d_kg]
        print(f"    order idx={oi} (id={request.orders[oi].id}): {d_kg}kg -> fits in: {', '.join(fits_in) if fits_in else 'NO VEHICLE (will be dropped)'}")
    print("-"*70)

    # 4. Run the solver
    try:
        routes, unassigned, durations = solve_cvrptw(
            duration_matrix, vehicle_capacities, demands, starts, ends, time_windows, max_time=max_time
        )
    except Exception as e:
        print(f"\nDIAGNOSTIC: solve_cvrptw THREW EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        # Prevent crash by returning all orders as unassigned
        return {
            "routes": [],
            "unassigned_order_ids": [o.id for o in request.orders]
        }

    # ------------ DIAGNOSTIC LOG 5: Solver result ------------
    print("\n" + "="*70)
    print("DIAGNOSTIC: Solver result")
    if routes is None:
        print("  solution = None (no feasible solution found at all)")
        print("="*70 + "\n")
        return {
            "routes": [],
            "unassigned_order_ids": [o.id for o in request.orders]
        }
    
    print(f"  solution found! routes={len(routes)}, unassigned_nodes={unassigned}")
    for vi, route in enumerate(routes):
        order_nodes = [n for n in route if n < N]
        driver_nodes = [n for n in route if n >= N]
        order_ids_in_route = [request.orders[n].id for n in order_nodes]
        print(f"  vehicle {vi}: raw_route={route}  order_nodes={order_nodes}  "
              f"order_ids={order_ids_in_route}  driver_nodes={driver_nodes}  "
              f"duration={durations[vi]}s")
    unassigned_ids = [request.orders[n].id for n in unassigned if n < N]
    print(f"  unassigned nodes: {unassigned} -> order_ids: {unassigned_ids}")
    print("="*70 + "\n")

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
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
