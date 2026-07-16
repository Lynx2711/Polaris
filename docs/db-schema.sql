-- POLARIS — Locked DB Schema v1
-- Do not modify without notifying the whole team.
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    name            VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'dispatcher',
    -- role: 'dispatcher' | 'admin'
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE drivers (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    vehicle_capacity_kg NUMERIC(6,2) NOT NULL,
    home_lat        DOUBLE PRECISION NOT NULL,
    home_lng        DOUBLE PRECISION NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
    id              SERIAL PRIMARY KEY,
    address         TEXT NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    weight_kg       NUMERIC(6,2) NOT NULL,
    deadline_start  TIMESTAMP NOT NULL,
    deadline_end    TIMESTAMP NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- status: pending | assigned | in_transit | delivered | failed
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE solve_jobs (
    id              SERIAL PRIMARY KEY,
    status          VARCHAR(20) NOT NULL DEFAULT 'queued',
    -- status: queued | running | done | failed
    requested_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMP,
    error_message   TEXT
);

CREATE TABLE routes (
    id              SERIAL PRIMARY KEY,
    solve_job_id    INTEGER NOT NULL REFERENCES solve_jobs(id),
    driver_id       INTEGER NOT NULL REFERENCES drivers(id),
    total_distance_km NUMERIC(8,2),
    total_duration_min NUMERIC(8,2),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE route_stops (
    id              SERIAL PRIMARY KEY,
    route_id        INTEGER NOT NULL REFERENCES routes(id),
    order_id        INTEGER NOT NULL REFERENCES orders(id),
    sequence_no     INTEGER NOT NULL,
    eta             TIMESTAMP,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
    -- status: pending | arrived | delivered
);

CREATE TABLE location_pings (
    id              SERIAL PRIMARY KEY,
    driver_id       INTEGER NOT NULL REFERENCES drivers(id),
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    recorded_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for common lookups
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_route_stops_route_id ON route_stops(route_id);
CREATE INDEX idx_routes_solve_job_id ON routes(solve_job_id);
CREATE INDEX idx_location_pings_driver_id ON location_pings(driver_id, recorded_at DESC);
