/**
 * Two-Tier Geolocation Helper
 *
 * 1. Tries high-accuracy (GPS) first with a short timeout (4 seconds).
 * 2. If it times out or fails (e.g. indoor / desktop), automatically falls back
 *    to low-accuracy (Wi-Fi / IP triangulation) with a 10-second timeout.
 */
export function captureUserLocation(onSuccess, onError) {
  if (!navigator.geolocation) {
    if (onError) onError(new Error('Geolocation is not supported by your browser'));
    return;
  }

  // Tier 1: High Accuracy (GPS) with 4-second timeout
  navigator.geolocation.getCurrentPosition(
    onSuccess,
    (firstErr) => {
      console.warn('GPS high-accuracy failed or timed out. Falling back to low-accuracy (Wi-Fi/IP)...', firstErr);
      // Tier 2: Fast Low Accuracy (Wi-Fi/IP) with 10-second timeout
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    },
    { enableHighAccuracy: true, timeout: 4000, maximumAge: 30000 }
  );
}
