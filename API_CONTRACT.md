# Polaris API Contract Specification

This document details the interface schemas and endpoint request/response payloads for the Polaris dispatch platform.

---

## 1. Solver Routes API

### `POST /api/solve`
Triggers a Capacitated Vehicle Routing Problem with Time Windows (CVRPTW) optimization run using OSRM travel durations and Google OR-Tools.

* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Request Body:**
  ```json
  {
    "order_ids": [101, 102, 103],
    "driver_ids": [1, 2]
  }
  ```
* **Response Body (201 Created):**
  ```json
  {
    "job_id": 42,
    "status": "done",
    "route_ids": [1, 2],
    "unassigned_order_ids": [103]
  }
  ```

---

## 2. Dispatch Routes API

### `GET /api/routes/:id`
Retrieves detailed information, sequential stop orders, and the calculated route geometry path for a specific route.

* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Response Body (200 OK):**
  ```json
  {
    "id": 1,
    "driver_id": 1,
    "total_distance_km": 15.42,
    "total_duration_min": 30.0,
    "stops": [
      {
        "order_id": 102,
        "sequence_no": 1,
        "eta": "2026-07-20T10:30:00Z",
        "status": "pending",
        "lat": 31.325,
        "lng": 75.577,
        "address": "Phagwara Bypass, Jalandhar"
      }
    ],
    "geometry": [
      [31.298, 75.647],
      [31.305, 75.612],
      [31.325, 75.577]
    ]
  }
  ```
  *(Note: Coordinates in the `geometry` array are returned as `[lat, lng]` to map seamlessly with Leaflet).*
