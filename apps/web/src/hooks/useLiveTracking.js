import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook to handle real-time driver location updates via Socket.io.
 * - Connects with JWT token in auth header
 * - Emits 'join-org' on connection
 * - Listens for 'live-location-update' events
 * - Tracks connection status and staleness
 */
export function useLiveTracking(token) {
  const [liveLocations, setLiveLocations] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setSocketConnected(false);
      return;
    }

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    const socket = io(backendUrl, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected, ID:', socket.id);
      setSocketConnected(true);
      setConnectionError(null);
      // Emit join-org as specified in contract
      socket.emit('join-org');
    });

    socket.on('live-location-update', (data) => {
      // data shape: { driverId, latitude, longitude, updatedAt }
      if (!data || !data.driverId) return;

      setLiveLocations((prev) => ({
        ...prev,
        [data.driverId]: {
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        },
      }));
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      setSocketConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection Error:', err.message);
      setSocketConnected(false);
      setConnectionError(err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return {
    liveLocations,
    socketConnected,
    connectionError,
    socket: socketRef.current,
  };
}

export default useLiveTracking;
