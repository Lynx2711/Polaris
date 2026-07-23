"""
Verify the solver's reported duration against the actual OSRM duration matrix.
Also query the OSRM /route endpoint for the actual road distance/duration for the route.
"""
import requests
import json

# Duration matrix from the solver log (raw OSRM values)
duration_matrix = [
  [0, 677, 1293, 1188, 1170, 1220, 257],
  [662, 0, 966, 861, 843, 893, 678],
  [1187, 1218, 0, 726, 313, 184, 1203],
  [1157, 1188, 792, 0, 669, 720, 1173],
  [1120, 1152, 317, 658, 0, 232, 1136],
  [1025, 1057, 289, 565, 151, 0, 1041],
  [336, 612, 1227, 1122, 1104, 1155, 0]
]

# The solver's Route for Vehicle 2: [6, 4, 3, 2, 1, 0, 6]
route = [6, 4, 3, 2, 1, 0, 6]

print("=== Manual duration matrix calculation ===")
total_travel = 0
for i in range(len(route) - 1):
    fr = route[i]
    to = route[i+1]
    t = duration_matrix[fr][to]
    print(f"  {fr} -> {to}: {t}s ({t/60:.1f} min)")
    total_travel += t

print(f"\nTotal travel time from matrix: {total_travel}s = {total_travel/60:.1f} min")
print(f"Solver reported duration:      1800s = 30.0 min")
print(f"Discrepancy:                   {total_travel - 1800}s = {(total_travel-1800)/60:.1f} min\n")

# Now query OSRM /route for the actual road distance and duration
# Node coordinates (same order as solver: orders first, then drivers)
coords = [
    (31.2255, 75.7727),  # 0: Order 6  - Phagwara Railway Station
    (31.2536, 75.7037),  # 1: Order 7  - LPU Campus
    (31.3344, 75.5683),  # 2: Order 8  - DAV College
    (31.2863, 75.6322),  # 3: Order 9  - Jalandhar Cantt
    (31.309,  75.59),    # 4: Order 10 - Model Town
    (31.3175, 75.5866),  # 5: Driver 1 - Rajesh (Jalandhar)
    (31.2223, 75.7725),  # 6: Driver 2 - Gurpreet (Phagwara)
]

# Build OSRM /route query for route [6, 4, 3, 2, 1, 0, 6]
route_coords = [coords[n] for n in route]
coords_string = ";".join([f"{lng},{lat}" for lat, lng in route_coords])
osrm_url = f"http://localhost:5000/route/v1/driving/{coords_string}?geometries=geojson"

print("=== OSRM /route query ===")
print(f"URL: {osrm_url}\n")

res = requests.get(osrm_url)
data = res.json()
osrm_route = data["routes"][0]

print(f"OSRM distance: {osrm_route['distance']:.1f}m = {osrm_route['distance']/1000:.2f} km")
print(f"OSRM duration: {osrm_route['duration']:.1f}s = {osrm_route['duration']/60:.1f} min")
print(f"Implied speed: {(osrm_route['distance']/1000) / (osrm_route['duration']/3600):.1f} km/h")
print(f"\nGeometry coordinate count: {len(osrm_route['geometry']['coordinates'])}")
print(f"First coord (lng,lat): {osrm_route['geometry']['coordinates'][0]}")
print(f"Last coord  (lng,lat): {osrm_route['geometry']['coordinates'][-1]}")

# Check what the code currently stores
stored_distance = osrm_route['distance'] / 1000.0
stored_duration_from_solver = 1800  # from OR-Tools
stored_duration_from_osrm = osrm_route['duration']

print(f"\n=== What gets stored in DB ===")
print(f"total_distance_km (from OSRM /route):    {stored_distance:.2f} km")
print(f"total_duration_min (from OR-Tools solver): {stored_duration_from_solver/60:.2f} min  <-- THIS IS USED")
print(f"total_duration_min (from OSRM /route):     {stored_duration_from_osrm/60:.2f} min  <-- THIS SHOULD BE USED")
print(f"\nSpeed with OR-Tools duration: {stored_distance / (stored_duration_from_solver/3600):.1f} km/h  <-- UNREALISTIC")
print(f"Speed with OSRM duration:     {stored_distance / (stored_duration_from_osrm/3600):.1f} km/h  <-- REALISTIC")
