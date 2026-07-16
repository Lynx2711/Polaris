CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    name            VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'dispatcher',
    -- role: 'dispatcher' | 'admin'
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
