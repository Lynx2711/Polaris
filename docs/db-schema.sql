-- POLARIS — Locked DB Schema v2 (Multi-Tenant)
-- Do not modify without notifying the whole team.

-- ============================================================
-- ORGANIZATIONS — tenant isolation root
-- ============================================================
CREATE TABLE organizations (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,  -- url-safe identifier, e.g. 'fastcouriers-jal'
    plan            VARCHAR(20) NOT NULL DEFAULT 'free',
    -- plan: 'free' | 'pro' | 'enterprise'
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS — login accounts (org-scoped except superadmins)
-- ============================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    org_id          INTEGER REFERENCES organizations(id),
    -- NULL for superadmins (platform-level users with no org)
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    name            VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'dispatcher',
    -- role: 'superadmin' | 'admin' | 'dispatcher' | 'driver'
    --   superadmin  — platform-wide, manages all orgs (org_id is NULL)
    --   admin       — org owner, manages their company's drivers & dispatchers
    --   dispatcher  — plans routes, assigns orders within their org
    --   driver      — sees only their own assigned stops
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DRIVERS — fleet members belonging to an organization
-- ============================================================
CREATE TABLE drivers (
    id              SERIAL PRIMARY KEY,
    org_id          INTEGER NOT NULL REFERENCES organizations(id),
    user_id         INTEGER REFERENCES users(id),
    -- links driver record to a login account (NULL if driver has no app access yet)
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    vehicle_capacity_kg NUMERIC(6,2) NOT NULL,
    home_lat        DOUBLE PRECISION NOT NULL,
    home_lng        DOUBLE PRECISION NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDERS — delivery tasks belonging to an organization
-- ============================================================
CREATE TABLE orders (
    id              SERIAL PRIMARY KEY,
    org_id          INTEGER NOT NULL REFERENCES organizations(id),
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

-- ============================================================
-- SOLVE_JOBS — optimization run requests per organization
-- ============================================================
CREATE TABLE solve_jobs (
    id              SERIAL PRIMARY KEY,
    org_id          INTEGER NOT NULL REFERENCES organizations(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'queued',
    -- status: queued | running | done | failed
    requested_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMP,
    error_message   TEXT
);

-- ============================================================
-- ROUTES — solver output, one row per driver per solve job
-- ============================================================
CREATE TABLE routes (
    id              SERIAL PRIMARY KEY,
    org_id          INTEGER NOT NULL REFERENCES organizations(id),
    solve_job_id    INTEGER NOT NULL REFERENCES solve_jobs(id),
    driver_id       INTEGER NOT NULL REFERENCES drivers(id),
    total_distance_km NUMERIC(8,2),
    total_duration_min NUMERIC(8,2),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROUTE_STOPS — individual stops within a route
-- (no org_id — always accessed via parent route)
-- ============================================================
CREATE TABLE route_stops (
    id              SERIAL PRIMARY KEY,
    route_id        INTEGER NOT NULL REFERENCES routes(id),
    order_id        INTEGER NOT NULL REFERENCES orders(id),
    sequence_no     INTEGER NOT NULL,
    eta             TIMESTAMP,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
    -- status: pending | arrived | delivered
);

-- ============================================================
-- LOCATION_PINGS — driver GPS breadcrumbs
-- (no org_id — always accessed via parent driver)
-- ============================================================
CREATE TABLE location_pings (
    id              SERIAL PRIMARY KEY,
    driver_id       INTEGER NOT NULL REFERENCES drivers(id),
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    recorded_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Tenant isolation lookups (every org-scoped query filters on these)
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_drivers_org_id ON drivers(org_id);
CREATE INDEX idx_orders_org_id ON orders(org_id);
CREATE INDEX idx_solve_jobs_org_id ON solve_jobs(org_id);
CREATE INDEX idx_routes_org_id ON routes(org_id);

-- Existing functional indexes
CREATE INDEX idx_orders_status ON orders(org_id, status);
CREATE INDEX idx_route_stops_route_id ON route_stops(route_id);
CREATE INDEX idx_routes_solve_job_id ON routes(solve_job_id);
CREATE INDEX idx_location_pings_driver_id ON location_pings(driver_id, recorded_at DESC);
