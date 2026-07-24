import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import useLiveTracking from '../hooks/useLiveTracking';
import { useTheme } from '../context/ThemeContext';
import {
  getOrders, getDrivers, submitSolve, getJobStatus,
  getRoute, createOrder, createDriver, seedDemoData,
} from '../services/api';
import { buildDriverColorMap } from '../utils/driverPalette';

import Sidebar               from '../components/Sidebar';
import DashboardTopbar       from '../components/DashboardTopbar';
import DashboardBottomStrip  from '../components/DashboardBottomStrip';
import DispatchMap           from '../components/DispatchMap';
import SolveStatusBanner     from '../components/SolveStatusBanner';
import SolveFailedModal      from '../components/SolveFailedModal';
import NewOrderModal         from '../components/NewOrderModal';
import NewDriverModal        from '../components/NewDriverModal';
import EmptyState            from '../components/EmptyState';
import Loader                from '../components/Loader';
import { isTimeWindowAtRisk } from '../components/OrderQueue';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const token = localStorage.getItem('token') || localStorage.getItem('polaris_token') || user?.token;

  // ── Resizable layout dimensions ──
  const [sidebarWidth, setSidebarWidth] = useState(240); // min 180, max 380
  const [bottomHeight, setBottomHeight] = useState(220); // min 120, max 450
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingBottom, setIsResizingBottom]   = useState(false);

  // ── Data ──
  const [orders,   setOrders]   = useState([]);
  const [drivers,  setDrivers]  = useState([]);
  const [routes,   setRoutes]   = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // ── UI ──
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [selectedOrderId,  setSelectedOrderId]  = useState(null);
  const [activeTab,        setActiveTab]        = useState('drivers');

  // ── Solver ──
  const [isSolving,          setIsSolving]          = useState(false);
  const [currentJobId,       setCurrentJobId]       = useState(null);
  const [solveStatus,        setSolveStatus]        = useState('');
  const [solveError,         setSolveError]         = useState(null);
  const [unassignedOrderIds, setUnassignedOrderIds] = useState([]);
  const [isFailedModalOpen,  setIsFailedModalOpen]  = useState(false);

  // ── Modals ──
  const [isOrderModalOpen,  setIsOrderModalOpen]  = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  const { liveLocations, socketConnected } = useLiveTracking(token);
  const driverColorMap = useMemo(() => buildDriverColorMap(drivers), [drivers]);

  // ── Load data ──
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedOrders, fetchedDrivers] = await Promise.all([
        getOrders().catch(() => []),
        getDrivers().catch(() => []),
      ]);
      setOrders(fetchedOrders   || []);
      setDrivers(fetchedDrivers || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try { await seedDemoData(); await loadInitialData(); }
    catch (err) { console.error('Seed error:', err); }
    finally { setIsSeeding(false); }
  };

  const handleCreateOrder  = async (d) => { const c = await createOrder(d);  setOrders(p => [c, ...p]); };
  const handleCreateDriver = async (d) => { const c = await createDriver(d); setDrivers(p => [c, ...p]); };

  // ── Optimize ──
  const handleOptimize = async () => {
    const activeDriverIds = drivers.filter((d) => d.is_active !== false).map((d) => d.id);
    const pendingOrderIds = orders.map((o) => o.id);
    if (!activeDriverIds.length || !pendingOrderIds.length) {
      alert('You need at least 1 active driver and 1 order to run optimization.');
      return;
    }
    setIsSolving(true); setSolveStatus('queued'); setSolveError(null); setUnassignedOrderIds([]);
    try {
      const { job_id: jobId } = await submitSolve(pendingOrderIds, activeDriverIds);
      setCurrentJobId(jobId);
      const poll = setInterval(async () => {
        try {
          const job = await getJobStatus(jobId);
          setSolveStatus(job.status);
          if (job.status === 'done') {
            clearInterval(poll); setIsSolving(false);
            if (job.route_ids?.length) {
              const fetched = await Promise.all(job.route_ids.map((id) => getRoute(id).catch(() => null)));
              setRoutes(fetched.filter(Boolean));
            }
            setOrders(await getOrders().catch(() => orders));
          } else if (job.status === 'failed') {
            clearInterval(poll); setIsSolving(false);
            setSolveError(job.error_message || 'Optimization failed');
            setUnassignedOrderIds(job.unassigned_order_ids || []);
            setIsFailedModalOpen(true);
          }
        } catch (e) { console.error('Poll error:', e); }
      }, 1500);
    } catch (err) {
      setIsSolving(false); setSolveStatus('failed');
      setSolveError(err.message || 'Failed to submit solve job');
      setIsFailedModalOpen(true);
    }
  };

  // ── Sidebar Drag Resizing ──
  const startSidebarResize = (e) => {
    e.preventDefault();
    setIsResizingSidebar(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + deltaX, 180), 380);
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsResizingSidebar(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // ── Bottom Panel Drag Resizing ──
  const startBottomResize = (e) => {
    e.preventDefault();
    setIsResizingBottom(true);
    const startY = e.clientY;
    const startHeight = bottomHeight;

    const onMouseMove = (moveEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newHeight = Math.min(Math.max(startHeight + deltaY, 120), 450);
      setBottomHeight(newHeight);
    };

    const onMouseUp = () => {
      setIsResizingBottom(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // ── Derived counts ──
  const unassigned = orders.filter((o) => !o.status || o.status === 'pending' || o.status === 'unassigned');
  const riskCount  = orders.filter((o) => isTimeWindowAtRisk(o.deadline_end)).length;
  const deliveredToday = orders.filter((o) => o.status === 'delivered').length;
  const inTransitToday = orders.filter((o) => o.status === 'in_transit' || o.status === 'assigned').length;

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center polaris-transition" style={{ background: 'var(--bg)' }}>
        <Loader />
        <p className="mt-4 text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--ink-dim)' }}>
          Loading Polaris…
        </p>
      </div>
    );
  }

  const isEmpty = drivers.length === 0 && orders.length === 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden polaris-transition" style={{ background: 'var(--bg)' }}>

      {/* ── Left Sidebar (Resizable width) ── */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} width={sidebarWidth} />

      {/* ── Drag handle between Sidebar & Map ── */}
      <div
        onMouseDown={startSidebarResize}
        className={`resizer-horizontal ${isResizingSidebar ? 'is-dragging' : ''}`}
        title="Drag to resize sidebar width"
      />

      {/* ── Main Right Column ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <DashboardTopbar
          onLogout={logout}
          onOptimize={handleOptimize}
          isSolving={isSolving}
          solveStatus={solveStatus}
          socketConnected={socketConnected}
          orderCount={orders.length}
          driverCount={drivers.length}
          unassignedCount={unassigned.length}
          riskCount={riskCount}
          onOpenOrderModal={() => setIsOrderModalOpen(true)}
          onOpenDriverModal={() => setIsDriverModalOpen(true)}
          onSeedData={handleSeedData}
          isSeeding={isSeeding}
        />

        {isEmpty ? (
          <EmptyState
            onSeedData={handleSeedData}
            isSeeding={isSeeding}
            onOpenOrderModal={() => setIsOrderModalOpen(true)}
            onOpenDriverModal={() => setIsDriverModalOpen(true)}
          />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* ── Map area (takes remaining height flex) ── */}
            <div className="relative overflow-hidden flex-1 min-h-[150px]">

              {/* Solve status banner */}
              <SolveStatusBanner
                jobId={currentJobId}
                status={solveStatus}
                error={solveError}
                onClose={() => { setSolveStatus(''); setCurrentJobId(null); }}
              />

              {/* Leaflet map with natural colors */}
              <DispatchMap
                theme={theme}
                drivers={drivers}
                orders={orders}
                routes={routes}
                driverColorMap={driverColorMap}
                selectedDriverId={selectedDriverId}
                onSelectDriver={setSelectedDriverId}
                liveLocations={liveLocations}
                socketConnected={socketConnected}
                selectedOrderId={selectedOrderId}
              />

              {/* ── Floating Stats Overlay — soft rounded badge ── */}
              <div
                className="absolute bottom-4 left-4 z-[500] rounded-2xl px-4 py-3 text-sm polaris-transition shadow-lg"
                style={{
                  background: 'var(--map-stats-bg)',
                  border: '1px solid var(--map-stats-border)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                <p style={{ color: 'var(--ink-muted)' }}>
                  Delivered Today:{' '}
                  <strong style={{ color: 'var(--accent-green)' }}>{deliveredToday}</strong>
                </p>
                <p className="mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                  In Transit Today:{' '}
                  <strong style={{ color: 'var(--accent-blue)' }}>{inTransitToday}</strong>
                </p>
                <p className="mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                  On-Time Rate Today (%):{' '}
                  <strong style={{ color: 'var(--ink)' }}>—</strong>
                </p>
              </div>

              {/* Live socket status badge — top right overlay */}
              <div
                className="absolute top-3 right-12 z-[500] flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full shadow-md polaris-transition"
                style={{
                  background: 'var(--map-stats-bg)',
                  border: '1px solid var(--map-stats-border)',
                  backdropFilter: 'blur(8px)',
                  color: socketConnected ? 'var(--accent-green)' : 'var(--accent-amber)',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: socketConnected ? 'var(--accent-green)' : 'var(--accent-amber)',
                    boxShadow: socketConnected ? '0 0 0 3px color-mix(in srgb, #34D399 30%, transparent)' : 'none',
                  }}
                />
                {socketConnected ? 'Live tracking' : 'Offline'}
              </div>
            </div>

            {/* ── Drag handle between Map & Bottom Strip ── */}
            <div
              onMouseDown={startBottomResize}
              className={`resizer-vertical ${isResizingBottom ? 'is-dragging' : ''}`}
              title="Drag up or down to resize bottom panel height"
            />

            {/* ── Bottom Strip Panel (Resizable height) ── */}
            <div style={{ height: `${bottomHeight}px`, flexShrink: 0 }}>
              <DashboardBottomStrip
                orders={orders}
                drivers={drivers}
                routes={routes}
                selectedOrderId={selectedOrderId}
                onSelectOrder={setSelectedOrderId}
              />
            </div>

          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <SolveFailedModal
        isOpen={isFailedModalOpen}
        onClose={() => setIsFailedModalOpen(false)}
        errorMessage={solveError}
        unassignedOrderIds={unassignedOrderIds}
        orders={orders}
      />
      <NewOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSubmit={handleCreateOrder}
      />
      <NewDriverModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        onSubmit={handleCreateDriver}
      />
    </div>
  );
}
