-- Migration: Add geometry column to routes table
ALTER TABLE routes ADD COLUMN geometry JSONB;
