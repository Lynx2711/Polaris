/**
 * Places Service — Geocoding & Reverse Geocoding
 * Features:
 *   - Exponential Backoff Retry logic for temporary HTTP 429 rate limits or transient errors.
 *   - AbortController cancellation support for rapid user typing signals.
 */

/**
 * Fetch helper with Exponential Backoff Retry logic
 */
async function fetchWithRetry(url, options = {}, retries = 3, backoffMs = 500) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If rate-limited (HTTP 429) or server error (503/504), wait and retry with exponential backoff
      if ((response.status === 429 || response.status >= 500) && attempt < retries - 1) {
        const delay = backoffMs * Math.pow(2, attempt);
        console.warn(`[Places API] Rate limited / Server error (${response.status}). Retrying in ${delay}ms... (Attempt ${attempt + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (err) {
      if (err.name === 'AbortError') throw err; // Do not retry if request was intentionally cancelled by user
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
 * Supports signal parameter for AbortController cancellation.
 */
export async function geocodeAddress(query, { signal, limit = 5 } = {}) {
  const q = query.trim();
  if (!q) return [];

  const params = new URLSearchParams({
    q,
    format: 'json',
    countrycodes: 'in',
    limit: limit.toString(),
    addressdetails: '1',
  });

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const response = await fetchWithRetry(url, {
    signal,
    headers: { 'Accept-Language': 'en' },
  });

  if (!response.ok) {
    throw new Error(`Geocoding HTTP error ${response.status}`);
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
 * Supports signal parameter for AbortController cancellation.
 */
export async function reverseGeocode(lat, lng, { signal } = {}) {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    format: 'json',
    addressdetails: '1',
  });

  const url = `https://nominatim.openstreetmap.org/reverse?${params.toString()}`;
  const response = await fetchWithRetry(url, {
    signal,
    headers: { 'Accept-Language': 'en' },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoding HTTP error ${response.status}`);
  }

  const data = await response.json();
  return data.display_name || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
}
