import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { getMyCurrentRoute, patchStop, getOrders } from '../services/api';
import { io } from 'socket.io-client';

import DashboardTopbar from '../components/DashboardTopbar';
import DriverSidebar from '../components/DriverSidebar';
import DriverRouteMap from '../components/DriverRouteMap';
import DriverNotificationsModal from '../components/DriverNotificationsModal';
import DriverDailySummaryModal from '../components/DriverDailySummaryModal';
import DriverOrderDetailModal from '../components/DriverOrderDetailModal';

const SHIFT_START_HOUR = 8;  // 08:00 AM
const SHIFT_END_HOUR = 18;  // 06:00 PM (18:00)

// Animation Variants for Slow Staggered Entry
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.25 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function DriverDashboard() {
  const { user, updateProfile, changePassword } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Active Driver Tab State: 'dashboard' | 'route' | 'orders' | 'schedule' | 'profile'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Live Time & Duty State
  const [currentTime, setCurrentTime] = useState(new Date());

  const checkIsShiftActive = (date) => {
    const hours = date.getHours() + date.getMinutes() / 60;
    return hours >= SHIFT_START_HOUR && hours < SHIFT_END_HOUR;
  };

  const isShiftActive = checkIsShiftActive(currentTime);
  const [isOnDuty, setIsOnDuty] = useState(isShiftActive);
  const [lastSyncSec, setLastSyncSec] = useState(null);

  // Live GPS & Socket State
  const [gpsStatus, setGpsStatus] = useState('waiting'); // 'waiting' | 'connected' | 'denied' | 'error'
  const [driverLocation, setDriverLocation] = useState(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastGpsTimeRef = useRef(null);

  // Orders & Route State
  const [orders, setOrders] = useState([]);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all');

  // Map state
  const [mapCenterPos, setMapCenterPos] = useState(null);

  // Modals state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDailySummaryOpen, setIsDailySummaryOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isEditPhoneOpen, setIsEditPhoneOpen] = useState(false);

  // Profile Form State
  const [driverPhone, setDriverPhone] = useState(user?.phone || '+91 98765 43210');
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Fetch Driver Route Data from Backend API
  const loadDriverRoute = async () => {
    try {
      const routeData = await getMyCurrentRoute();
      if (routeData && routeData.stops) {
        setActiveRouteId(routeData.route_id);
        const mappedStops = routeData.stops.map((s) => ({
          id: s.order_id,
          stop_id: s.stop_id,
          customerName: `Customer #${s.order_id}`,
          phone: '+91 98765 43210',
          address: s.address,
          weight_kg: parseFloat(s.weight_kg || 5),
          window: s.deadline_end ? new Date(s.deadline_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ASAP',
          instructions: 'Deliver to specified address.',
          status: s.status || 'assigned',
          lat: parseFloat(s.lat),
          lng: parseFloat(s.lng),
        }));
        setOrders(mappedStops);
      }
    } catch (err) {
      // If no active route generated yet, load org orders or fallback demo orders
      try {
        const fetchedOrders = await getOrders();
        if (fetchedOrders && fetchedOrders.length > 0) {
          setOrders(fetchedOrders.map(o => ({
            id: o.id,
            customerName: `Customer #${o.id}`,
            phone: '+91 98765 43210',
            address: o.address,
            weight_kg: parseFloat(o.weight_kg || 5),
            window: o.deadline_end ? new Date(o.deadline_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ASAP',
            status: o.status || 'assigned',
            lat: parseFloat(o.lat),
            lng: parseFloat(o.lng),
          })));
        }
      } catch (e) {
        console.warn('Driver route load fallback warning:', e.message);
      }
    }
  };

  useEffect(() => {
    loadDriverRoute();
  }, []);

  // Live time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      // Update lastSyncSec based on actual GPS time
      if (lastGpsTimeRef.current) {
        setLastSyncSec(Math.round((Date.now() - lastGpsTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // GPS Geolocation + Socket.IO emission
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      console.warn('[GPS] Geolocation not supported by this browser');
      return;
    }

    // Connect socket with JWT auth
    const token = localStorage.getItem('token') || localStorage.getItem('polaris_token');
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    const socket = io(backendUrl, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Driver Socket] Connected:', socket.id);
      socket.emit('join-org');
    });

    socket.on('connect_error', (err) => {
      console.warn('[Driver Socket] Connection error:', err.message);
    });

    // Start watching GPS position
    setGpsStatus('waiting');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setDriverLocation({ lat: latitude, lng: longitude });
        setGpsStatus('connected');
        lastGpsTimeRef.current = Date.now();
        setLastSyncSec(0);

        // Emit to server — server handles throttled DB writes
        if (socket.connected) {
          socket.emit('driver-location', {
            latitude,
            longitude,
          });
        }
      },
      (error) => {
        console.error('[GPS] Error:', error.message);
        if (error.code === 1) {
          setGpsStatus('denied');
        } else {
          setGpsStatus('error');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      socket.disconnect();
    };
  }, []);

  // Update duty status when shift window changes
  useEffect(() => {
    setIsOnDuty(checkIsShiftActive(currentTime));
  }, [currentTime.getHours()]);

  // Driver metrics
  const totalAssigned = orders.length;
  const completedCount = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
  const remainingCount = totalAssigned - completedCount;
  const nextStopOrder = orders.find(o => o.status !== 'delivered' && o.status !== 'completed') || orders[0];

  const handleUpdateOrderStatus = async (orderId, newStatus, podData) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: newStatus, ...podData } : o))
    );
    if (activeRouteId) {
      try {
        await patchStop(activeRouteId, orderId, newStatus);
      } catch (err) {
        console.warn('patchStop error:', err.message);
      }
    }
  };

  const handleNavigateToStop = (stop) => {
    setMapCenterPos([stop.lat, stop.lng]);
    setActiveTab('route');
  };

  const handleSavePhone = (e) => {
    e.preventDefault();
    setIsEditPhoneOpen(false);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordForm.next && passwordForm.next === passwordForm.confirm) {
      setPasswordSuccess(true);
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPasswordSuccess(false);
        setPasswordForm({ current: '', next: '', confirm: '' });
      }, 1200);
    }
  };

  const driverName = user?.name || user?.fullName || 'Ashi Sharma';

  return (
    <div className="bg-surface font-body-sm text-on-surface antialiased min-h-screen flex flex-col">
      {/* ── Navbar matching company dashboard ── */}
      <DashboardTopbar
        riskCount={2}
        onTabChange={(tab) => {
          if (tab === 'settings' || tab === 'profile') {
            setActiveTab('profile');
          }
        }}
      />

      {/* ── Main Driver Body ── */}
      <main style={{ paddingTop: 64, minHeight: '100vh', display: 'flex', flexDirection: 'row', flex: 1 }}>
        {/* Fixed Driver Sidebar Rail */}
        <DriverSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isExpanded={isSidebarExpanded}
          setIsExpanded={setIsSidebarExpanded}
        />

        {/* Dynamic Main Workspace Area */}
        <div
          style={{
            flex: 1,
            padding: '24px 28px 32px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            marginLeft: isSidebarExpanded ? 220 : 84,
            transition: 'margin-left 0.25s cubic-bezier(0.16,1,0.3,1)',
            minWidth: 0,
          }}
        >
          {/* ── Top Floating Live Status Bar (Slow Motion Entry) ── */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, padding: '12px 18px', borderRadius: 16,
              background: 'var(--surface-raised)', border: '1px solid var(--border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              color: 'var(--ink)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: gpsStatus === 'connected' ? '#059669' : gpsStatus === 'waiting' ? '#f59e0b' : '#ef4444', display: 'inline-block' }} />
                <span>GPS: {gpsStatus === 'connected' ? 'Connected' : gpsStatus === 'waiting' ? 'Waiting...' : gpsStatus === 'denied' ? 'Denied' : 'Error'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: socketRef.current?.connected ? '#059669' : '#f59e0b', display: 'inline-block' }} />
                <span>Sync: {socketRef.current?.connected ? 'Live' : 'Connecting...'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--ink-muted)' }}>schedule</span>
                <span>Time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>sync</span>
                <span>Last Sync: {lastSyncSec !== null ? `${lastSyncSec} sec ago` : 'N/A'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
              {/* Shift Schedule Badge */}
              <div style={{
                fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)',
                padding: '5px 10px', borderRadius: 8, background: 'var(--surface)',
                border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>work_history</span>
                <span>Shift: 08:00 AM – 06:00 PM</span>
              </div>

              {/* Duty Toggle Pill */}
              <button
                onClick={() => setIsOnDuty(!isOnDuty)}
                title={isShiftActive ? 'Within shift hours' : 'Outside shift hours'}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: isOnDuty ? (isShiftActive ? 'rgba(5, 150, 105, 0.15)' : 'rgba(217, 119, 6, 0.15)') : 'rgba(239, 68, 68, 0.15)',
                  color: isOnDuty ? (isShiftActive ? '#059669' : '#D97706') : '#EF4444',
                  border: isOnDuty ? (isShiftActive ? '1px solid #059669' : '1px solid #D97706') : '1px solid #EF4444',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isOnDuty ? (isShiftActive ? '#059669' : '#D97706') : '#EF4444' }} />
                {isOnDuty ? (isShiftActive ? 'On Duty' : 'On Duty (Overtime)') : (isShiftActive ? 'Off Duty (Break)' : 'Off Duty (Shift Ended)')}
              </button>

              {/* Operational Notifications Trigger */}
              <button
                onClick={() => setIsNotificationsOpen(true)}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--surface)', color: 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative',
                }}
                title="Operational Notifications"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink)' }}>notifications</span>
                <span style={{
                  position: 'absolute', top: 6, right: 6, width: 7, height: 7,
                  borderRadius: '50%', background: '#EF4444', border: '1.5px solid var(--surface)',
                }} />
              </button>

              {/* End Shift / Daily Summary Trigger */}
              <button
                onClick={() => setIsDailySummaryOpen(true)}
                style={{
                  padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: 'var(--ink)', color: 'var(--surface)', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>assessment</span>
                Shift Summary
              </button>
            </div>
          </motion.div>

          {/* ── Animated Tab Content Containers ── */}
          <AnimatePresence mode="wait">
            {/* ─────────────────────────────────────────────────────────────
               TAB 1: DASHBOARD (HOME)
               ───────────────────────────────────────────────────────────── */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="tab-dashboard"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* Hero Welcome Card */}
                <motion.div
                  variants={itemVariants}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
                    padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
                  }}
                >
                  <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif' }}>
                      Good Morning, {driverName.split(' ')[0]} 👋
                    </h1>
                    <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginTop: 4 }}>
                      What do I need to do today? View your assigned route and deliveries below.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveTab('route')}
                      style={{
                        padding: '10px 20px', borderRadius: 12, background: 'var(--ink)', color: 'var(--surface)',
                        fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_arrow</span>
                      {completedCount > 0 ? 'Continue Route' : 'Start Route'}
                    </motion.button>
                  </div>
                </motion.div>

                {/* Stat Cards Grid (Staggered Animations) */}
                <motion.div
                  variants={containerVariants}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}
                >
                  {/* Card 1: Today's Route */}
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Today's Route
                    </span>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginTop: 6 }}>
                      #RT-24
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4, display: 'block' }}>
                      Jalandhar Sector
                    </span>
                  </motion.div>

                  {/* Card 2: Orders Assigned */}
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Orders Assigned
                    </span>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 6 }}>
                      {totalAssigned}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4, display: 'block' }}>
                      Total packages
                    </span>
                  </motion.div>

                  {/* Card 3: Completed */}
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Completed
                    </span>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#059669', marginTop: 6 }}>
                      {completedCount}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4, display: 'block' }}>
                      Verified deliveries
                    </span>
                  </motion.div>

                  {/* Card 4: Remaining */}
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Remaining
                    </span>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 6 }}>
                      {remainingCount}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4, display: 'block' }}>
                      Pending stops
                    </span>
                  </motion.div>

                  {/* Card 5: Shift */}
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Shift Window
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginTop: 6 }}>
                      08:00 AM – 06:00 PM
                    </div>
                    <span style={{ fontSize: 11, color: isShiftActive ? '#059669' : '#EF4444', marginTop: 4, fontWeight: 600, display: 'block' }}>
                      {isShiftActive ? '● Shift Active Now' : '○ Shift Ended / Off Duty'}
                    </span>
                  </motion.div>
                </motion.div>

                {/* Next Stop Spotlight Card */}
                <motion.div
                  variants={itemVariants}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
                    padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    display: 'flex', flexDirection: 'column', gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ color: '#2563EB', fontSize: 20 }}>flag</span>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Next Stop Spotlight</h3>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                      background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', textTransform: 'uppercase',
                    }}>
                      ETA {nextStopOrder?.window ? nextStopOrder.window.split(' - ')[0] : '09:30 AM'}
                    </span>
                  </div>

                  {nextStopOrder ? (
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center',
                      background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 14, padding: 18,
                    }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                          Customer Name
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>
                          {nextStopOrder.customerName}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#EF4444' }}>location_on</span>
                          {nextStopOrder.address}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleNavigateToStop(nextStopOrder)}
                        style={{
                          padding: '10px 18px', borderRadius: 12, background: 'var(--ink)', color: 'var(--surface)',
                          fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>near_me</span>
                        Navigate
                      </motion.button>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>All stops completed for today!</p>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
               TAB 2: MY ROUTE
               ───────────────────────────────────────────────────────────── */}
            {activeTab === 'route' && (
              <motion.div
                key="tab-route"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 600 }}
              >
                <motion.div variants={itemVariants} style={{ flex: 1, minHeight: 520, borderRadius: 20, overflow: 'hidden' }}>
                  <DriverRouteMap
                    driverLocation={driverLocation || { lat: 31.298, lng: 75.647 }}
                    depotLocation={{ lat: 31.298, lng: 75.647 }}
                    stops={orders}
                    nextStop={nextStopOrder}
                    centerPosition={mapCenterPos}
                  />
                </motion.div>

                {/* Bottom Next Stop Floating Card */}
                {nextStopOrder && (
                  <motion.div
                    variants={itemVariants}
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
                      padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.06)', flexWrap: 'wrap', gap: 12,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: '#2563EB', textTransform: 'uppercase' }}>
                        Next Destination • Order #{nextStopOrder.id}
                      </span>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>
                        {nextStopOrder.customerName} ({nextStopOrder.phone})
                      </h4>
                      <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
                        {nextStopOrder.address} • ETA {nextStopOrder.window ? nextStopOrder.window.split(' - ')[0] : '09:30 AM'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMapCenterPos([nextStopOrder.lat, nextStopOrder.lng])}
                        style={{
                          padding: '10px 18px', borderRadius: 10, background: 'var(--surface-raised)',
                          border: '1px solid var(--border)', color: 'var(--ink)', fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>center_focus_strong</span>
                        Center Map
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedOrder(nextStopOrder)}
                        style={{
                          padding: '10px 18px', borderRadius: 10, background: 'var(--ink)',
                          color: 'var(--surface)', fontSize: 13, fontWeight: 700, border: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                        Deliver Stop
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
               TAB 3: MY ORDERS
               ───────────────────────────────────────────────────────────── */}
            {activeTab === 'orders' && (
              <motion.div
                key="tab-orders"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {/* Header & Filter Row */}
                <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif' }}>
                      Today's Assigned Deliveries
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                      {orders.length} orders assigned to your shift
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: 6, background: 'var(--surface-raised)', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
                    {['all', 'assigned', 'pending', 'delivered'].map(f => (
                      <button
                        key={f}
                        onClick={() => setOrderFilter(f)}
                        style={{
                          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: orderFilter === f ? 700 : 500,
                          background: orderFilter === f ? 'var(--surface)' : 'transparent',
                          color: orderFilter === f ? 'var(--ink)' : 'var(--ink-muted)',
                          border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                          boxShadow: orderFilter === f ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Order Cards List */}
                <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {orders
                    .filter(o => (orderFilter === 'all' ? true : o.status === orderFilter))
                    .map(order => (
                      <motion.div
                        key={order.id}
                        variants={itemVariants}
                        whileHover={{ x: 4, transition: { duration: 0.15 } }}
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
                          padding: 18, cursor: 'pointer', transition: 'all 0.15s',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: 12,
                            background: 'var(--surface-raised)', border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 800, color: 'var(--ink)',
                          }}>
                            #{order.id}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{order.customerName}</h4>
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                                background: order.status === 'delivered' ? 'rgba(5, 150, 105, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                                color: order.status === 'delivered' ? '#059669' : '#2563EB',
                                textTransform: 'uppercase',
                              }}>
                                {order.status}
                              </span>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
                              {order.address}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 11, color: 'var(--ink-muted)', display: 'block' }}>
                              Weight: {order.weight_kg} kg
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)' }}>
                              Window: {order.window || '09:00 - 11:30 AM'}
                            </span>
                          </div>
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--ink-muted)' }}>chevron_right</span>
                        </div>
                      </motion.div>
                    ))}
                </motion.div>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
               TAB 4: SCHEDULE
               ───────────────────────────────────────────────────────────── */}
            {activeTab === 'schedule' && (
              <motion.div
                key="tab-schedule"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <motion.div variants={itemVariants}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif' }}>
                    Today's Shift Schedule
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                    Shift window: 08:00 AM – 06:00 PM (10 Hours)
                  </p>
                </motion.div>

                {/* Metrics Summary Row */}
                <motion.div
                  variants={containerVariants}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}
                >
                  <motion.div variants={itemVariants} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Working Hours</span>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>8h 00m</div>
                  </motion.div>

                  <motion.div variants={itemVariants} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Break Time</span>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>40 min</div>
                  </motion.div>

                  <motion.div variants={itemVariants} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Shift Status</span>
                    <div style={{ fontSize: 16, fontWeight: 800, color: isShiftActive ? '#059669' : '#EF4444', marginTop: 4 }}>
                      {isShiftActive ? 'Shift Active' : 'Outside Shift'}
                    </div>
                  </motion.div>
                </motion.div>

                {/* Timeline list */}
                <motion.div variants={itemVariants} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 20 }}>Timeline</h3>

                  <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'relative', paddingLeft: 12 }}>
                    {[
                      { time: '08:00 AM', title: 'Start Shift', desc: 'Depot Central (Check-in & Vehicle Inspection)' },
                      { time: '09:30 AM', title: 'Stop 1: LPU Campus', desc: 'Order #231 • Anita Sharma' },
                      { time: '10:15 AM', title: 'Stop 2: Model Town', desc: 'Order #232 • Rahul Verma' },
                      { time: '11:05 AM', title: 'Lunch Break', desc: '40 Min Break' },
                      { time: '11:45 AM', title: 'Stop 3: Urban Estate Phase II', desc: 'Order #233 • Simran Kaur' },
                      { time: '02:30 PM', title: 'Stop 4: GT Road Logistics Park', desc: 'Order #234 • Deepak Kumar' },
                      { time: '05:40 PM', title: 'Return Depot', desc: 'Debrief & Vehicle Parking' },
                      { time: '06:00 PM', title: 'End Shift', desc: 'Shift Clock-out' },
                    ].map((item, idx) => (
                      <motion.div key={idx} variants={itemVariants} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                        <div style={{ minWidth: 80, fontSize: 12, fontWeight: 700, color: 'var(--ink)', textAlign: 'right' }}>
                          {item.time}
                        </div>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--ink)', marginTop: 4, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{item.desc}</div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
               TAB 5: PROFILE
               ───────────────────────────────────────────────────────────── */}
            {activeTab === 'profile' && (
              <motion.div
                key="tab-profile"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}
              >
                <motion.div variants={itemVariants}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif' }}>
                    Driver Profile
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                    Personal information & credentials
                  </p>
                </motion.div>

                {/* Profile Card */}
                <motion.div variants={itemVariants} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', background: 'var(--ink)', color: 'var(--surface)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700,
                    }}>
                      {driverName.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{driverName}</h3>
                      <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Employee ID: DRV-8824 • Senior Driver</p>
                    </div>
                  </div>

                  <motion.div variants={containerVariants} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <motion.div variants={itemVariants} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Phone Number</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{driverPhone}</span>
                        <button onClick={() => setIsEditPhoneOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: 11, fontWeight: 700 }}>Edit</button>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Email</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>{user?.email || 'ashi.driver@polarislogistics.com'}</div>
                    </motion.div>

                    <motion.div variants={itemVariants} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Assigned Vehicle</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>Electric Van (PB 08 CX 4092)</div>
                    </motion.div>

                    <motion.div variants={itemVariants} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Vehicle Capacity</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>500 kg / 3.5 m³</div>
                    </motion.div>

                    <motion.div variants={itemVariants} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>License Number</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>DL-142021009876</div>
                    </motion.div>

                    <motion.div variants={itemVariants} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Company</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>Polaris Logistics Pvt. Ltd.</div>
                    </motion.div>

                    <motion.div variants={itemVariants} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, gridColumn: 'span 2' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Emergency Contact</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>Rajat Sharma (+91 98123 45678)</div>
                    </motion.div>
                  </motion.div>

                  {/* Actions */}
                  <motion.div variants={itemVariants} style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => setIsChangePasswordOpen(true)}
                      style={{
                        flex: 1, height: 42, borderRadius: 10, background: 'var(--surface-raised)',
                        border: '1px solid var(--border)', color: 'var(--ink)', fontWeight: 600,
                        fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      Change Password
                    </button>
                    <button
                      onClick={logout}
                      style={{
                        flex: 1, height: 42, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontWeight: 700,
                        fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      Logout
                    </button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Modals ── */}
      <DriverNotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <DriverDailySummaryModal
        isOpen={isDailySummaryOpen}
        onClose={() => setIsDailySummaryOpen(false)}
        summaryData={{
          ordersDelivered: completedCount,
          distance: '74 km',
          workingTime: '8h 12m',
          avgStopTime: '9 min',
          completionRate: `${Math.round((completedCount / (totalAssigned || 1)) * 100)}%`,
        }}
      />

      <DriverOrderDetailModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateOrderStatus}
      />

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setIsChangePasswordOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 400, background: 'var(--surface)',
            borderRadius: 16, border: '1px solid var(--border)', padding: 24,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>Change Password</h3>
            {passwordSuccess ? (
              <p style={{ color: '#059669', fontSize: 13, fontWeight: 600 }}>Password changed successfully!</p>
            ) : (
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="password"
                  placeholder="Current Password"
                  required
                  value={passwordForm.current}
                  onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--ink)' }}
                />
                <input
                  type="password"
                  placeholder="New Password"
                  required
                  value={passwordForm.next}
                  onChange={e => setPasswordForm({ ...passwordForm, next: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--ink)' }}
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  required
                  value={passwordForm.confirm}
                  onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--ink)' }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button type="button" onClick={() => setIsChangePasswordOpen(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: 'var(--ink)', color: 'var(--surface)', fontWeight: 700 }}>Update</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Phone Modal */}
      {isEditPhoneOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setIsEditPhoneOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 360, background: 'var(--surface)',
            borderRadius: 16, border: '1px solid var(--border)', padding: 24,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>Update Phone Number</h3>
            <form onSubmit={handleSavePhone} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={driverPhone}
                onChange={e => setDriverPhone(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--ink)' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => setIsEditPhoneOpen(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: 'var(--ink)', color: 'var(--surface)', fontWeight: 700 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
