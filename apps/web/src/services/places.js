/**
 * Places Service — Geocoding & Reverse Geocoding
 * Calls are proxied through the Polaris API server (/api/geocode/*) so that:
 *   1. The browser never calls Nominatim directly (avoids CORS issues).
 *   2. The server can set the required User-Agent header (Nominatim usage policy).
 *   3. Exponential back-off retry is kept for transient 429/5xx errors.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4001';

/**
 * Fetch helper with Exponential Backoff Retry logic
 */
async function fetchWithRetry(url, options = {}, retries = 3, backoffMs = 500) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Retry on rate-limit (429) or transient server errors (5xx)
      if ((response.status === 429 || response.status >= 500) && attempt < retries - 1) {
        const delay = backoffMs * Math.pow(2, attempt);
        console.warn(`[Places API] Rate limited / Server error (${response.status}). Retrying in ${delay}ms... (Attempt ${attempt + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (err) {
      if (err.name === 'AbortError') throw err; // Do not retry cancelled requests
      if (attempt < retries - 1) {
        const delay = backoffMs * Math.pow(2, attempt);
        console.warn(`[Places API] Network failure. Retrying in ${delay}ms...`, err);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Forward Geocoding: Search address string -> coordinates & display name
 * Proxied through /api/geocode/search on the Polaris API server.
 * Supports signal parameter for AbortController cancellation.
 */
export async function geocodeAddress(query, { signal, limit = 5 } = {}) {
  const q = query.trim();
  if (!q) return [];

  const params = new URLSearchParams({
    q,
    limit: limit.toString(),
    countrycodes: 'in',
  });

  const url = `${API_BASE}/api/geocode/search?${params.toString()}`;
  const response = await fetchWithRetry(url, { signal });

  if (!response.ok) {
    throw new Error(`Geocoding proxy error ${response.status}`);
  }

  const data = await response.json();
  return data.map((item) => ({
    place_id: item.place_id,
    display_name: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}

/**
 * Reverse Geocoding: (lat, lng) -> Human readable street address string
 * Proxied through /api/geocode/reverse on the Polaris API server.
 * Supports signal parameter for AbortController cancellation.
 */
export async function reverseGeocode(lat, lng, { signal } = {}) {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
  });

  const url = `${API_BASE}/api/geocode/reverse?${params.toString()}`;
  const response = await fetchWithRetry(url, { signal });

  if (!response.ok) {
    throw new Error(`Reverse geocoding proxy error ${response.status}`);
  }

  const data = await response.json();
  return data.display_name || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
}
