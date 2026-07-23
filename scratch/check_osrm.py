import requests
import json

OSRM_BASE_URL = "http://localhost:5000"

drivers = [
    {"name": "Rajesh Kumar", "lat": 31.3175, "lng": 75.5866},
    {"name": "Gurpreet Singh", "lat": 31.2223, "lng": 75.7725}
]

orders = [
    {"address": "Model Town, Jalandhar", "lat": 31.309, "lng": 75.59},
    {"address": "Jalandhar Cantt Railway Station", "lat": 31.2863, "lng": 75.6322},
    {"address": "DAV College, Jalandhar", "lat": 31.3344, "lng": 75.5683},
    {"address": "LPU Campus (Law Gate), Phagwara", "lat": 31.2536, "lng": 75.7037},
    {"address": "Phagwara Railway Station", "lat": 31.2255, "lng": 75.7727}
]

coordinates = []
for o in orders:
    coordinates.append((o["lat"], o["lng"]))
for d in drivers:
    coordinates.append((d["lat"], d["lng"]))

coords_string = ";".join([f"{lng},{lat}" for lat, lng in coordinates])
url = f"{OSRM_BASE_URL}/table/v1/driving/{coords_string}"

try:
    res = requests.get(url)
    res.raise_for_status()
    data = res.json()
    print("Durations Matrix (in seconds):")
    print(json.dumps(data.get("durations"), indent=2))
except Exception as e:
    print("Error:", e)
