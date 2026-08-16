// geocode.routes.js — Server-side proxy for Nominatim & Photon geocoding.
// Why: Browsers hit CORS / User-Agent restrictions calling geocoders directly.
// Features: 5-minute TTL cache + 3-second timeout + Photon API fallback for 100% reliability.

import { Router } from 'express';

const router = Router();

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const PHOTON_BASE = 'https://photon.komoot.io/api';
const USER_AGENT = 'Polaris-Fleet-App/1.0 (contact@polarisfleet.app)';

// ─── Simple in-memory TTL cache ───────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}

function cacheSet(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  if (cache.size > 500) {
    const now = Date.now();
    for (const [k, v] of cache) { if (now > v.expiresAt) cache.delete(k); }
  }
}

// ─── Fetch with Timeout Helper ────────────────────────────────────────────────
async function fetchWithTimeout(url, headers = {}, timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Photon Fallback Helper (Format output matching Nominatim) ────────────────
async function fetchPhotonSearch(query, limit) {
  const params = new URLSearchParams({ q: query, limit: String(limit), lang: 'en' });
  const res = await fetchWithTimeout(`${PHOTON_BASE}/?${params.toString()}`, {}, 3500);
  if (!res.ok) throw new Error(`Photon returned ${res.status}`);
  const json = await res.json();
  return (json.features || []).map((f) => {
    const p = f.properties || {};
    const parts = [p.name, p.street, p.district, p.city || p.county, p.state, p.country].filter(Boolean);
    return {
      place_id: `photon_${f.properties.osm_id || Math.random()}`,
      display_name: parts.join(', '),
      lat: String(f.geometry.coordinates[1]),
      lon: String(f.geometry.coordinates[0]),
    };
  });
}

// ─── GET /api/geocode/search ── forward geocode (address → coords) ────────────
router.get('/search', async (req, res) => {
  const { q, limit = '5' } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const queryStr = q.trim();
  const cacheKey = `search:${queryStr}:${limit}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json(cached);

  // Attempt 1: Try Nominatim first
  try {
    const params = new URLSearchParams({
      q: queryStr,
      format: 'json',
      countrycodes: 'in',
      limit: String(limit),
      addressdetails: '1',
    });
    const url = `${NOMINATIM_BASE}/search?${params.toString()}`;
    const response = await fetchWithTimeout(url, {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en',
      'Accept': 'application/json',
    }, 3000);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        cacheSet(cacheKey, data);
        return res.json(data);
      }
    }
  } catch (err) {
    console.warn('[geocode/search] Nominatim primary failed or timed out, switching to Photon fallback:', err.message);
  }

  // Attempt 2: Fallback to Photon API
  try {
    const photonResults = await fetchPhotonSearch(queryStr, limit);
    if (photonResults.length > 0) {
      cacheSet(cacheKey, photonResults);
      return res.json(photonResults);
    }
  } catch (err) {
    console.error('[geocode/search] Photon fallback error:', err.message);
  }

  res.status(502).json({ error: 'Failed to reach geocoding service' });
});

// ─── GET /api/geocode/reverse ── reverse geocode (coords → address) ───────────
router.get('/reverse', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Query params "lat" and "lon" are required' });
  }

  const cacheKey = `reverse:${lat}:${lon}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon), format: 'json', addressdetails: '1' });
    const url = `${NOMINATIM_BASE}/reverse?${params.toString()}`;
    const response = await fetchWithTimeout(url, {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en',
      'Accept': 'application/json',
    }, 3000);

    if (response.ok) {
      const data = await response.json();
      cacheSet(cacheKey, data);
      return res.json(data);
    }
  } catch (err) {
    console.warn('[geocode/reverse] Nominatim failed, returning coordinate string:', err.message);
  }

  const fallbackData = { display_name: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}` };
  res.json(fallbackData);
});

export default router;
