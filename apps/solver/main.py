from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import requests

app = FastAPI(title="Polaris Solver API", description="Route optimization service")

class Coordinate(BaseModel):
    lat: float
    lng: float

class TableRequest(BaseModel):
    coordinates: List[Coordinate]

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
