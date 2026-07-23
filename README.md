# Polaris — Route Optimization & Dispatch Platform

Multi-driver delivery dispatch system. CVRPTW solver (OR-Tools) + real road
network drive times (self-hosted OSRM) + live dispatcher dashboard (React/Leaflet).

## Repo layout

```
polaris/
├── apps/
│   ├── api/          Node/Express — backend server (orders, drivers, jobs, auth, websockets)
│   ├── solver/       FastAPI + OR-Tools — route-solving microservice
│   ├── web/          React + Leaflet — dispatcher dashboard, driver view
│   └── marketing/    React — landing page, login/signup (currently empty skeleton)
├── osrm/
│   └── data/         OSRM raw maps and routing files (.osm.pbf, .osrm, etc.)
└── docs/
    └── db-schema.sql  SQL script containing table schema and index definitions
```

## Getting started

### Prerequisites
Make sure you have the following installed on your machine:
- Node.js (v18+) & npm
- Python (v3.10+)
- PostgreSQL (v15+)
- Docker Desktop

---

### Step 1: Database Setup

1. Make sure your PostgreSQL server is running.
2. Create a new database named `polaris`.
3. Apply the base schema and additional tables by running:
   ```bash
   psql -h localhost -U postgres -d polaris -f docs/db-schema.sql
   psql -h localhost -U postgres -d polaris -f add_users_table.sql
   ```

---

### Step 2: OSRM Routing Engine Setup

The Punjab road network map (`punjab-latest.osm.pbf`) is large (~222 MB raw).
> [!IMPORTANT]
> **Docker Memory Requirement:** You must configure Docker Desktop to allocate at least **6 GB - 8 GB of RAM** (Settings -> Resources -> Memory), and use `--threads 1` during the extraction step. Otherwise, Docker may experience OOM crashes during build.

1. **Extract map features:**
   ```bash
   docker run --rm -v "${PWD}/osrm/data:/data" osrm/osrm-backend osrm-extract --threads 1 -p /opt/car.lua /data/punjab-latest.osm.pbf
   ```
2. **Partition cells (MLD mode):**
   ```bash
   docker run --rm -v "${PWD}/osrm/data:/data" osrm/osrm-backend osrm-partition /data/punjab-latest.osrm
   ```
3. **Customize speeds:**
   ```bash
   docker run --rm -v "${PWD}/osrm/data:/data" osrm/osrm-backend osrm-customize /data/punjab-latest.osrm
   ```
4. **Start the routing server:**
   ```bash
   docker run -d -p 5000:5000 --name osrm-backend -v "${PWD}/osrm/data:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/punjab-latest.osrm
   ```

*(Alternative for low-memory machines: You can run step 4 using the pre-processed smaller `/data/jal-phag.osrm` instead).*

---

### Step 3: API Backend (`apps/api`)

1. Navigate to the api directory:
   ```bash
   cd apps/api
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:devpassword@localhost:5432/polaris
   PORT=4000
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

---

### Step 4: Solver Service (`apps/solver`)

1. Navigate to the solver directory:
   ```bash
   cd apps/solver
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv env
   # Windows:
   .\env\Scripts\activate
   # macOS/Linux:
   source env/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the microservice (once entrypoint is implemented):
   ```bash
   uvicorn app.main:app --reload
   ```

---

### Step 5: Web UI (`apps/web`)

1. Navigate to the web directory:
   ```bash
   cd apps/web
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Start React frontend:
   ```bash
   npm run dev
   ```

---

## Solver Optimization & Technical Honesty

The routing solver (`apps/solver`) uses **Google OR-Tools** to solve the Capacitated Vehicle Routing Problem with Time Windows (CVRPTW).

Because VRP is an NP-hard problem, finding the absolute global optimal solution for large fleets can be computationally prohibitive. To address this:
1. We construct a valid initial solution using the `PATH_CHEAPEST_ARC` greedy heuristic.
2. We then run a metaheuristic search (**Guided Local Search**) to continuously improve the routes.
3. This search operates within a **bounded time budget** (`time_limit_seconds`). 

### Bounded Time Budget Benchmark
Increasing the search time budget allows OR-Tools to explore a wider search space, yielding better (shorter/faster) routes, but does not guarantee the absolute global optimum. For example, in a 35-stop vehicle routing simulation:
* **1-Second Search Budget:** Total fleet transit duration = **8,521 seconds**
* **10-Second Search Budget:** Total fleet transit duration = **7,322 seconds** (a **14% / 1,199-second improvement**)

This illustrates the "more time = closer to global optimal" trade-off. We use a default bounded budget (e.g., 3-5 seconds) to return near-optimal routing results in a responsive web experience.

## Rule #1

`docs/` and `add_users_table.sql` are locked once Week 1 is done.
Nobody changes either without flagging it to the whole team first.

