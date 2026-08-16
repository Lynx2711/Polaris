# pyrefly: ignore [missing-import]
# Import FastAPI framework for building high-performance REST APIs
from fastapi import FastAPI, HTTPException
# Import Pydantic for data validation and schema definitions
from pydantic import BaseModel
# Import typing helpers for type hinting
from typing import List
# Import requests for making HTTP requests to external OSRM service
import requests
# Import JSON parser/encoder
import json
# Import OR-Tools solver wrapper functions from local module tsp.py
from tsp import solve_tsp, solve_cvrptw

# Initialize FastAPI application instance with metadata
app = FastAPI(title="Polaris Solver API", description="Route optimization service")

# -------------------------------------------------------------
# Pydantic Schemas for Request & Response Data Validation
# -------------------------------------------------------------

class Coordinate(BaseModel):
    """Geographic coordinate representation with latitude and longitude."""
    lat: float  # Latitude coordinate
    lng: float  # Longitude coordinate

class TableRequest(BaseModel):
    """Payload schema for raw travel matrix requests."""
    coordinates: List[Coordinate]  # List of coordinates to construct matrix for

class SolveTSPRequest(BaseModel):
    """Payload schema for single-depot Traveling Salesperson Problem."""
    coordinates: List[Coordinate]  # Coordinates of all stops
    vehicle_capacities: List[int]   # Capacity limit per vehicle
    demands: List[int]              # Demand payload at each stop

class OrderInput(BaseModel):
    """Input payload for a delivery order stop."""
    id: int           # Database primary key ID of order
    lat: float        # Order delivery latitude
    lng: float        # Order delivery longitude
    demand_kg: float  # Package weight in kilograms
    window_start: int # Delivery window start time (seconds from midnight)
    window_end: int   # Delivery window end time (seconds from midnight)

class DriverInput(BaseModel):
    """Input payload for a vehicle driver."""
    id: int            # Database primary key ID of driver
    lat: float         # Driver starting/ending home base latitude
    lng: float         # Driver starting/ending home base longitude
    capacity_kg: float # Driver vehicle load capacity limit in kilograms

class SolveCVRPTWRequest(BaseModel):
    """Payload schema for Capacitated Vehicle Routing Problem with Time Windows."""
    orders: List[OrderInput]   # List of pending orders to be routed
    drivers: List[DriverInput] # List of active drivers available

# Base URL for local Open Source Routing Machine (OSRM) server
OSRM_BASE_URL = "http://localhost:5000"

# -------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------

@app.get("/health")
def health_check():
    """Health check endpoint to verify solver service availability."""
    return {"status": "ok", "service": "solver"}

@app.post("/table")
def get_drive_time_matrix(request: TableRequest):
    """
    Takes a list of coordinates and returns the raw drive-time matrix from OSRM.
    This proves the plumbing works before adding OR-Tools.
    """
    # Validation: at least 2 coordinates needed to calculate a distance/time matrix
    if len(request.coordinates) < 2:
        raise HTTPException(status_code=400, detail="At least 2 coordinates are required")
    
    # OSRM expects coordinates in lng,lat format joined by semicolons
    coords_string = ";".join([f"{c.lng},{c.lat}" for c in request.coordinates])
    
    # Construct URL for OSRM table service
    osrm_url = f"{OSRM_BASE_URL}/table/v1/driving/{coords_string}"
    
    try:
        # Send GET request to OSRM engine
        response = requests.get(osrm_url)
        # Raise exception if OSRM returned non-200 HTTP status code
        response.raise_for_status()
        # Return parsed JSON matrix response
        return response.json()
    except requests.exceptions.RequestException as e:
        # Return 502 Bad Gateway if OSRM container or service is unreachable
        raise HTTPException(status_code=502, detail=f"Failed to communicate with OSRM: {str(e)}")

@app.post("/solve/tsp")
def solve_tsp_endpoint(request: SolveTSPRequest):
    """
    Solves classic TSP / VRP problem given coordinates, vehicle capacities, and demands.
    """
    # Ensure minimum 2 coordinates provided
    if len(request.coordinates) < 2:
        raise HTTPException(status_code=400, detail="At least 2 coordinates required")
    # Verify demands list matches coordinates list length
    if len(request.demands) != len(request.coordinates):
        raise HTTPException(status_code=400, detail="Demands list length must match coordinates list length")

    # Format coordinates string for OSRM query
    coords_string = ";".join([f"{c.lng},{c.lat}" for c in request.coordinates])
    osrm_url = f"{OSRM_BASE_URL}/table/v1/driving/{coords_string}"

    try:
        # Fetch drive time matrix from OSRM
        response = requests.get(osrm_url)
        response.raise_for_status()
        matrix_data = response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"OSRM failed: {str(e)}")

    # Extract durations matrix (seconds between stops)
    duration_matrix = matrix_data["durations"]
    # Solve TSP via OR-Tools wrapper
    routes = solve_tsp(duration_matrix, request.vehicle_capacities, request.demands)

    # Check if solver returned valid routes
    if routes is None:
        raise HTTPException(status_code=500, detail="Solver found no solution")

    # Accumulate total trip duration across all routes
    total_duration = 0
    for route in routes:
        total_duration += sum(
            duration_matrix[route[i]][route[i+1]] for i in range(len(route)-1)
        )

    # Return routes and total duration
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
    N = len(request.orders)   # Total order count
    M = len(request.drivers)  # Total driver count

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

    # Quick edge case returns if no orders or drivers provided
    if N == 0:
        return {"routes": [], "unassigned_order_ids": []}
    if M == 0:
        return {"routes": [], "unassigned_order_ids": [o.id for o in request.orders]}

    # 1. Combine coordinates: N orders followed by M driver start bases
    coordinates = []
    for o in request.orders:
        coordinates.append(Coordinate(lat=o.lat, lng=o.lng))  # Node indices 0 .. N-1 are orders
    for d in request.drivers:
        coordinates.append(Coordinate(lat=d.lat, lng=d.lng))  # Node indices N .. N+M-1 are drivers

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
        # Query OSRM with 2.5s timeout
        response = requests.get(osrm_url, timeout=2.5)
        response.raise_for_status()
        matrix_data = response.json()
        # Round drive duration seconds to integers
        duration_matrix = [[round(val) for val in row] for row in matrix_data["durations"]]
        print("\nDIAGNOSTIC: OSRM table query SUCCEEDED")
    except Exception as e:
        osrm_used = False
        print(f"\nDIAGNOSTIC: OSRM table query FAILED ({e}), using Haversine fallback")
        # Fallback to Haversine straight-line distance matrix at ~30 km/h avg urban speed if OSRM is unreachable
        import math
        duration_matrix = []
        for c1 in coordinates:
            row = []
            for c2 in coordinates:
                # Convert degrees to radians for spherical geometry calculations
                lat1, lng1 = math.radians(c1.lat), math.radians(c1.lng)
                lat2, lng2 = math.radians(c2.lat), math.radians(c2.lng)
                dlat, dlng = lat2 - lat1, lng2 - lng1
                # Haversine formula calculation
                a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
                dist_km = 6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                # Calculate duration assuming 30 km/h speed
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
    # Driver starting and ending nodes correspond to indices N to N+M-1
    starts = [N + j for j in range(M)]
    ends = [N + j for j in range(M)]
    
    # Cast vehicle capacities to integer list
    vehicle_capacities = [int(d.capacity_kg) for d in request.drivers]
    
    # Demands array: N order demands followed by M zeros for driver home depots
    demands = [int(o.demand_kg) for o in request.orders] + [0] * M
    
    # Process order delivery time windows (handles midnight crossing)
    order_time_windows = []
    for o in request.orders:
        ws, we = int(o.window_start), int(o.window_end)
        if we < ws:
            # Midnight crossing: e.g. 8:14 PM (72859s) -> 12:44 AM (2659s)
            # Add 24h (86400s) to the end time to make it continuous (89059s)
            we += 86400
            print(f"  FIX: order {o.id} midnight-crossing window ({ws}, {o.window_end}) -> ({ws}, {we})")
        order_time_windows.append((ws, we))
    
    # Compute max_time ceiling for OR-Tools solver to avoid window overflow
    max_window_end = max(we for _, we in order_time_windows) if order_time_windows else 86400
    max_time = max(max_window_end + 3600, 86400)  # Add 1-hour buffer after latest delivery window
    
    # Driver home depot time windows span the full max horizon (0, max_time)
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
                if travel <= tw[1]:  # check if driver can reach order before window closes
                    feasible_drivers.append(f"d{di}({travel}s)")
        print(f"    node {ti:>2}: ({tw[0]:>6}, {tw[1]:>6})  span={tw[1]-tw[0]:>6}s  {label}"
              + (f"  reachable_by: {', '.join(feasible_drivers) if feasible_drivers else 'NONE'}" if ti < N else ""))
    
    # Print capacity feasibility check per order
    print("\n  -- Capacity feasibility per order --")
    for oi in range(N):
        d_kg = demands[oi]
        fits_in = [f"driver[{di}]({vehicle_capacities[di]}kg)" for di in range(M) if vehicle_capacities[di] >= d_kg]
        print(f"    order idx={oi} (id={request.orders[oi].id}): {d_kg}kg -> fits in: {', '.join(fits_in) if fits_in else 'NO VEHICLE (will be dropped)'}")
    print("-"*70)

    # 4. Run the OR-Tools CVRPTW solver
    try:
        routes, unassigned, durations = solve_cvrptw(
            duration_matrix, vehicle_capacities, demands, starts, ends, time_windows, max_time=max_time
        )
    except Exception as e:
        print(f"\nDIAGNOSTIC: solve_cvrptw THREW EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        # Fallback safeguard: return all orders as unassigned to prevent server crash
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

    # 5. Format routes and unassigned order lists back to database IDs and GeoJSON polylines
    formatted_routes = []
    for vehicle_id, route in enumerate(routes):
        # Filter route node indices to retain only order stops (nodes < N)
        order_stops = [request.orders[node].id for node in route if node < N]
        
        # If driver has no assigned stops, return empty route with null geometry
        if len(order_stops) == 0:
            formatted_routes.append({
                "driver_id": request.drivers[vehicle_id].id,
                "stop_order": [],
                "total_duration_seconds": 0.0,
                "total_distance_km": 0.0,
                "geometry": None
            })
            continue

        # Map route node indices back to geographic coordinates
        route_coords = [coordinates[node] for node in route]
        coords_string = ";".join([f"{c.lng},{c.lat}" for c in route_coords])
        # Request full GeoJSON route geometry from OSRM
        osrm_route_url = f"{OSRM_BASE_URL}/route/v1/driving/{coords_string}?geometries=geojson"

        try:
            route_res = requests.get(osrm_route_url)
            route_res.raise_for_status()
            route_data = route_res.json()
            osrm_route = route_data["routes"][0]
            # Extract coordinates path and flip from GeoJSON [lng, lat] to Leaflet/Mapbox standard [lat, lng]
            geometry_coords = osrm_route["geometry"]["coordinates"]
            flipped_geometry = [[pt[1], pt[0]] for pt in geometry_coords]
            # Convert meters to kilometers
            total_distance_km = osrm_route["distance"] / 1000.0
            # Get actual road driving time in seconds from OSRM
            total_duration_seconds = osrm_route["duration"]
        except Exception as e:
            # Fallback values if OSRM detailed route request fails
            flipped_geometry = []
            total_distance_km = 0.0
            total_duration_seconds = 0.0

        # Construct final formatted route object for this driver
        formatted_routes.append({
            "driver_id": request.drivers[vehicle_id].id,
            "stop_order": order_stops,
            "total_duration_seconds": total_duration_seconds,
            "total_distance_km": total_distance_km,
            "geometry": flipped_geometry
        })

    # Map unassigned solver node indices back to database order IDs
    unassigned_order_ids = [request.orders[node].id for node in unassigned if node < N]

    # Return final output containing formatted routes and unassigned order IDs
    return {
        "routes": formatted_routes,
        "unassigned_order_ids": unassigned_order_ids
    }

# Entrypoint for running FastAPI app directly using uvicorn server
if __name__ == "__main__":
    import uvicorn
    import sys
    import os
    # Ensure current file's directory is present in Python search path for module reloader
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    # Launch uvicorn web server listening on 127.0.0.1:8001 with hot reload enabled
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)

