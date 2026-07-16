# Polaris — Route Optimization & Dispatch Platform

Multi-driver delivery dispatch system. CVRPTW solver (OR-Tools) + real road
network drive times (self-hosted OSRM) + live dispatcher dashboard (React/Leaflet).

## Repo layout

```
polaris/
├── apps/
│   ├── api/          Node/Express — orders, drivers, jobs, auth, websockets
│   ├── solver/        FastAPI + OR-Tools — stateless route-solving microservice
│   ├── web/            React + Leaflet — dispatcher dashboard, driver view
│   └── marketing/     React — landing page, login/signup, logo animation
├── db/
│   └── migrations/     SQL migration files, run in numeric order
├── infra/
│   └── osrm/           Docker setup for self-hosted OSRM + OSM extract
└── docs/
    ├── API_CONTRACT.md      Source of truth for every endpoint — locked, versioned
    └── DB_SCHEMA.md         Table reference + relationships
```

## Getting started

1. `cd infra/osrm && ./setup.sh` — downloads OSM extract, builds OSRM data, starts the routing server
2. `cd db && psql -f migrations/001_create_drivers.sql ...` (or run via your preferred migration tool)
3. `cd apps/api && npm install && npm run dev`
4. `cd apps/solver && pip install -r requirements.txt --break-system-packages && uvicorn app.main:app --reload`
5. `cd apps/web && npm install && npm run dev`
6. `cd apps/marketing && npm install && npm run dev`

## Rule #1

`docs/API_CONTRACT.md` and `db/migrations/` are locked once Week 1 is done.
Nobody changes either without flagging it to the whole team first.
