import json
import datetime
from pathlib import Path

# We want to output two fixtures: drivers.json and orders.json
# Using realistic Jalandhar and Phagwara locations

DRIVERS = [
    {
        "name": "Rajesh Kumar",
        "phone": "+91-9876543210",
        "vehicle_capacity_kg": 500.0,
        "home_lat": 31.3175,
        "home_lng": 75.5866,
        "address": "Jalandhar Bus Stand Area"
    },
    {
        "name": "Gurpreet Singh",
        "phone": "+91-9988776655",
        "vehicle_capacity_kg": 750.0,
        "home_lat": 31.2223,
        "home_lng": 75.7725,
        "address": "Phagwara Bus Stand Area"
    }
]

# Set a deadline window starting tomorrow
now = datetime.datetime.now(datetime.timezone.utc)
tomorrow = now + datetime.timedelta(days=1)
deadline_start = tomorrow.replace(hour=8, minute=0, second=0, microsecond=0).isoformat()
deadline_end = tomorrow.replace(hour=18, minute=0, second=0, microsecond=0).isoformat()

ORDERS = [
    {
        "address": "Model Town, Jalandhar",
        "lat": 31.3090,
        "lng": 75.5900,
        "weight_kg": 15.5,
        "deadline_start": deadline_start,
        "deadline_end": deadline_end
    },
    {
        "address": "Jalandhar Cantt Railway Station",
        "lat": 31.2863,
        "lng": 75.6322,
        "weight_kg": 25.0,
        "deadline_start": deadline_start,
        "deadline_end": deadline_end
    },
    {
        "address": "DAV College, Jalandhar",
        "lat": 31.3344,
        "lng": 75.5683,
        "weight_kg": 10.0,
        "deadline_start": deadline_start,
        "deadline_end": deadline_end
    },
    {
        "address": "LPU Campus (Law Gate), Phagwara",
        "lat": 31.2536,
        "lng": 75.7037,
        "weight_kg": 50.0,
        "deadline_start": deadline_start,
        "deadline_end": deadline_end
    },
    {
        "address": "Phagwara Railway Station",
        "lat": 31.2255,
        "lng": 75.7727,
        "weight_kg": 12.5,
        "deadline_start": deadline_start,
        "deadline_end": deadline_end
    }
]

def generate_fixtures():
    output_dir = Path(__file__).parent.parent / "fixtures"
    output_dir.mkdir(exist_ok=True)
    
    drivers_path = output_dir / "drivers.json"
    with open(drivers_path, "w") as f:
        json.dump(DRIVERS, f, indent=2)
        
    orders_path = output_dir / "orders.json"
    with open(orders_path, "w") as f:
        json.dump(ORDERS, f, indent=2)
        
    print(f"Generated {len(DRIVERS)} realistic drivers at {drivers_path}")
    print(f"Generated {len(ORDERS)} realistic orders at {orders_path}")

if __name__ == "__main__":
    generate_fixtures()
