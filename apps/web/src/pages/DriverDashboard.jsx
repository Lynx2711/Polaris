import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  Navigation, MapPin, CheckCircle2, Clock, Package,
  Wifi, WifiOff, AlertCircle, ChevronDown, ChevronUp,
  Locate, LocateFixed, ArrowRight, Truck, List, Home, LogOut
} from 'lucide-react';
import { getMyCurrentRoute, patchStop } from '../services/api';
import useAuth from '../hooks/useAuth';

// ─── Status pill styles ────────────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:    { bg: 'bg-[#2B3642]',  text: 'text-[#94A3B8]', label: 'Pending' },
  arrived:    { bg: 'bg-[#1C3A2E]',  text: 'text-[#4ADE80]', label: 'Arrived' },
  delivered:  { bg: 'bg-[#1E3A1E]',  text: 'text-[#22C55E]', label: 'Delivered ✓' },
  failed:     { bg: 'bg-[#3A1C1C]',  text: 'text-[#F87171]', label: 'Failed' },
};

// ─── GPS permission states ─────────────────────────────────────────────────────
const GEO_STATE = {
  IDLE:       'idle',
  REQUESTING: 'requesting',
  ACTIVE:     'active',
  DENIED:     'denied',
  UNSUPPORTED:'unsupported',
};

function formatETA(eta) {
  if (!eta) return '–';
  const d = new Date(eta);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDeadline(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Stop Card ─────────────────────────────────────────────────────────────────
function StopCard({ stop, routeId, isNext, onMarkStatus, loadingStopId }) {
  const [expanded, setExpanded] = useState(isNext);
  const style = STATUS_STYLES[stop.status] || STATUS_STYLES.pending;
  const isDelivered = stop.status === 'delivered';
  const isFailed = stop.status === 'failed';
  const isDone = isDelivered || isFailed;
  const isLoading = loadingStopId === stop.order_id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl border transition-all ${
        isNext
          ? 'border-[#2B5D4F] bg-[#0F1F19] shadow-lg shadow-[#2B5D4F]/10'
          : isDone
          ? 'border-[#1E293B] bg-[#0D1117] opacity-60'
          : 'border-[#1E293B] bg-[#0D1117]'
      }`}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-start gap-3 p-4 text-left"
        aria-expanded={expanded}
      >
        {/* Sequence badge */}
        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isNext ? 'bg-[#2B5D4F] text-white' : isDone ? 'bg-[#1E293B] text-[#475569]' : 'bg-[#1E293B] text-[#94A3B8]'
        }`}>
          {isDelivered ? <CheckCircle2 size={14} /> : stop.sequence_no}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isNext && (
              <span className="shrink-0 rounded-full bg-[#2B5D4F] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#4ADE80]">
                Next Stop
              </span>
            )}
            <span className={`text-xs font-semibold uppercase tracking-wider ${style.text} ${style.bg} px-2 py-0.5 rounded-full`}>
              {style.label}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-white leading-snug truncate pr-2">{stop.address}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-[#64748B]">
            <span className="flex items-center gap-1">
              <Clock size={10} /> ETA {formatETA(stop.eta)}
            </span>
            <span className="flex items-center gap-1">
              <Package size={10} /> {stop.weight_kg} kg
            </span>
          </div>
        </div>

        <div className="shrink-0 text-[#475569]">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#1E293B] px-4 pb-4 pt-3">
              {/* Full address */}
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(stop.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 rounded-xl bg-[#0A0F14] p-3 text-sm text-[#94A3B8] hover:text-[#2B5D4F] transition-colors group"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-[#2B5D4F]" />
                <span className="leading-relaxed">{stop.address}</span>
                <ArrowRight size={12} className="ml-auto mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              {stop.deadline_end && (
                <p className="mt-2 text-xs text-[#64748B]">
                  Deadline: <span className="text-[#94A3B8] font-medium">{formatDeadline(stop.deadline_end)}</span>
                </p>
              )}

              {/* Action buttons */}
              {!isDone && (
                <div className="mt-3 flex gap-2">
                  {stop.status === 'pending' && (
                    <button
                      disabled={isLoading}
                      onClick={() => onMarkStatus(stop.order_id, 'arrived')}
                      className="flex-1 rounded-xl border border-[#2B5D4F] py-2 text-xs font-bold text-[#4ADE80] transition hover:bg-[#1C3A2E] disabled:opacity-40"
                    >
                      {isLoading ? 'Updating…' : 'Mark Arrived'}
                    </button>
                  )}
                  <button
                    disabled={isLoading}
                    onClick={() => onMarkStatus(stop.order_id, 'delivered')}
                    className="flex-1 rounded-xl bg-[#2B5D4F] py-2 text-xs font-bold text-white transition hover:bg-[#234D41] disabled:opacity-40"
                  >
                    {isLoading ? 'Updating…' : '✓ Mark Delivered'}
                  </button>
                  <button
                    disabled={isLoading}
                    onClick={() => onMarkStatus(stop.order_id, 'failed')}
                    className="rounded-xl border border-[#3A1C1C] px-3 py-2 text-xs font-bold text-[#F87171] transition hover:bg-[#3A1C1C] disabled:opacity-40"
                    title="Mark as failed"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── GPS Permission Banner ─────────────────────────────────────────────────────
function GpsBanner({ geoState, accuracy, onRequest }) {
  if (geoState === GEO_STATE.ACTIVE) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-[#0F1F19] border border-[#2B5D4F]/50 px-4 py-3 text-sm">
        <LocateFixed size={15} className="text-[#4ADE80] shrink-0" />
        <span className="text-[#4ADE80] font-semibold">GPS Active</span>
        {accuracy && (
          <span className="ml-auto text-xs text-[#64748B]">±{Math.round(accuracy)}m</span>
        )}
        <span className="relative ml-1 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ADE80] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ADE80]" />
        </span>
      </div>
    );
  }

  if (geoState === GEO_STATE.DENIED) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-[#3A1C1C]/40 border border-[#F87171]/20 px-4 py-3 text-sm">
        <AlertCircle size={15} className="text-[#F87171] shrink-0" />
        <span className="text-[#F87171] font-semibold">Location denied</span>
        <span className="text-[#94A3B8] text-xs ml-1">Enable in browser settings to share location</span>
      </div>
    );
  }

  if (geoState === GEO_STATE.UNSUPPORTED) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-[#2B3642] border border-[#475569]/30 px-4 py-3 text-sm">
        <WifiOff size={15} className="text-[#94A3B8] shrink-0" />
        <span className="text-[#94A3B8]">Geolocation not supported on this device</span>
      </div>
    );
  }

  return (
    <button
      onClick={onRequest}
      disabled={geoState === GEO_STATE.REQUESTING}
      className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#2B5D4F]/60 bg-[#0A1A14] px-4 py-3 text-sm transition hover:border-[#2B5D4F] hover:bg-[#0F1F19] disabled:opacity-50"
    >
      <Locate size={15} className="text-[#2B5D4F] shrink-0" />
      <span className="font-semibold text-[#94A3B8]">
        {geoState === GEO_STATE.REQUESTING ? 'Requesting permission…' : 'Enable GPS Tracking'}
      </span>
      <span className="ml-auto text-xs text-[#475569]">Tap to allow</span>
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const token = localStorage.getItem('token') || localStorage.getItem('polaris_token');

  const [route, setRoute] = useState(null);
  const [pageState, setPageState] = useState('loading'); // loading | error | ready
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingStopId, setLoadingStopId] = useState(null);

  // GPS state
  const [geoState, setGeoState] = useState(GEO_STATE.IDLE);
  const [coords, setCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const watchIdRef = useRef(null);

  // Socket
  const socketRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // ── Fetch current route ──────────────────────────────────────────────────────
  useEffect(() => {
    getMyCurrentRoute()
      .then(data => {
        setRoute(data);
        setPageState('ready');
      })
      .catch(err => {
        const msg = err?.response?.data?.message || 'Failed to load route';
        setErrorMsg(msg);
        setPageState('error');
      });
  }, []);

  // ── Socket.io — connect and emit location ────────────────────────────────────
  useEffect(() => {
    if (!token) return;
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
      setSocketConnected(true);
      socket.emit('join-org');
      console.log('[Driver Socket] connected');
    });
    socket.on('disconnect', () => setSocketConnected(false));
    return () => socket.disconnect();
  }, [token]);

  // ── Emit GPS position whenever it changes ────────────────────────────────────
  useEffect(() => {
    if (!coords || !socketRef.current?.connected) return;
    socketRef.current.emit('driver-location', {
      latitude: coords.lat,
      longitude: coords.lng,
      // driverId is auto-resolved on the server from the JWT — no need to send it
    });
  }, [coords]);

  // ── Start GPS watch ──────────────────────────────────────────────────────────
  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoState(GEO_STATE.UNSUPPORTED);
      return;
    }
    setGeoState(GEO_STATE.REQUESTING);

    // Request permission by getting position once, then start watching
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState(GEO_STATE.ACTIVE);
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);

        // Start continuous watch
        watchIdRef.current = navigator.geolocation.watchPosition(
          (p) => {
            setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
            setAccuracy(p.coords.accuracy);
          },
          (err) => {
            console.warn('[GPS watch error]', err.message);
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
      },
      (err) => {
        console.warn('[GPS permission denied]', err.message);
        setGeoState(err.code === 1 ? GEO_STATE.DENIED : GEO_STATE.UNSUPPORTED);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Cleanup GPS watch on unmount
  useEffect(() => () => {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  // ── Mark a stop ──────────────────────────────────────────────────────────────
  const handleMarkStatus = async (orderId, status) => {
    if (!route) return;
    setLoadingStopId(orderId);
    try {
      const updated = await patchStop(route.route_id, orderId, status);
      setRoute(prev => ({
        ...prev,
        stops: prev.stops.map(s =>
          s.order_id === orderId ? { ...s, status: updated.status, eta: updated.eta } : s
        ),
      }));
    } catch (err) {
      console.error('Failed to update stop:', err);
    } finally {
      setLoadingStopId(null);
    }
  };

  // ── Computed values ──────────────────────────────────────────────────────────
  const stops = route?.stops || [];
  const delivered = stops.filter(s => s.status === 'delivered').length;
  const total = stops.length;
  const progressPct = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const nextStop = stops.find(s => s.status !== 'delivered' && s.status !== 'failed');

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060A0E] text-white">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-20 border-b border-[#1E293B] bg-[#060A0E]/90 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Truck size={20} className="text-[#2B5D4F]" />
            <div>
              <p className="text-xs text-[#64748B] font-medium">Driver View</p>
              <p className="text-sm font-bold leading-none text-white">{user?.name || 'Driver'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Socket status dot */}
            <span className={`flex items-center gap-1.5 text-xs font-medium ${socketConnected ? 'text-[#4ADE80]' : 'text-[#475569]'}`}>
              {socketConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {socketConnected ? 'Live' : 'Offline'}
            </span>
            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-[#475569] hover:text-white transition"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-lg px-4 pb-24 pt-4">

        {/* Loading skeleton */}
        {pageState === 'loading' && (
          <div className="space-y-3 pt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#0D1117]" />
            ))}
          </div>
        )}

        {/* Error state */}
        {pageState === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 flex flex-col items-center gap-4 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1C3A2E]">
              <Home size={28} className="text-[#2B5D4F]" />
            </div>
            <h2 className="text-lg font-bold text-white">No Route Yet</h2>
            <p className="text-sm text-[#64748B] leading-relaxed max-w-[280px]">{errorMsg}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 rounded-xl bg-[#2B5D4F] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#234D41] transition"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Ready */}
        {pageState === 'ready' && route && (
          <div className="space-y-4">
            {/* GPS banner */}
            <GpsBanner
              geoState={geoState}
              accuracy={accuracy}
              onRequest={startGPS}
            />

            {/* Today's route summary card */}
            <div className="rounded-2xl border border-[#1E293B] bg-[#0D1117] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List size={14} className="text-[#2B5D4F]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Today's Route</span>
                </div>
                <span className="text-xs font-bold text-[#94A3B8]">{delivered}/{total} stops</span>
              </div>

              {/* Progress bar */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#1E293B]">
                <motion.div
                  className="absolute left-0 top-0 h-full rounded-full bg-[#2B5D4F]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>

              {/* Stats row */}
              <div className="mt-3 grid grid-cols-3 divide-x divide-[#1E293B]">
                <div className="pr-4">
                  <p className="text-lg font-bold text-white">{progressPct}%</p>
                  <p className="text-[11px] text-[#64748B]">Complete</p>
                </div>
                <div className="px-4">
                  <p className="text-lg font-bold text-white">{route.total_distance_km?.toFixed(1) ?? '–'}</p>
                  <p className="text-[11px] text-[#64748B]">km total</p>
                </div>
                <div className="pl-4">
                  <p className="text-lg font-bold text-white">{route.total_duration_min ? Math.round(route.total_duration_min) : '–'}</p>
                  <p className="text-[11px] text-[#64748B]">min est.</p>
                </div>
              </div>
            </div>

            {/* Coords debug badge (dev only) */}
            {coords && (
              <div className="rounded-xl bg-[#0A1A14] border border-[#1C3A2E] px-3 py-2 font-mono text-[11px] text-[#4ADE80]">
                📍 {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)} · ±{Math.round(accuracy)}m
              </div>
            )}

            {/* Stops list */}
            <div className="space-y-2">
              {stops.map((stop) => (
                <StopCard
                  key={stop.stop_id ?? stop.order_id}
                  stop={stop}
                  routeId={route.route_id}
                  isNext={nextStop?.order_id === stop.order_id}
                  onMarkStatus={handleMarkStatus}
                  loadingStopId={loadingStopId}
                />
              ))}
            </div>

            {/* All done */}
            {stops.length > 0 && stops.every(s => s.status === 'delivered' || s.status === 'failed') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 rounded-2xl border border-[#2B5D4F]/40 bg-[#0F1F19] p-6 text-center"
              >
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#2B5D4F]">
                  <CheckCircle2 size={28} className="text-white" />
                </div>
                <h3 className="text-base font-bold text-white">All stops complete!</h3>
                <p className="mt-1 text-sm text-[#64748B]">Great work today. Your route is finished.</p>
              </motion.div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
