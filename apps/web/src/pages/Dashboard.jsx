import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import DispatchMap           from '../components/DispatchMap';
import MetricCardsRail       from '../components/MetricCardsRail';
import OrdersAndControlGrid  from '../components/OrdersAndControlGrid';
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
  const navigate = useNavigate();

  // Redirect superadmins to platform admin console
  useEffect(() => {
    if (user?.role === 'superadmin') {
      navigate('/platform-admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const token = localStorage.getItem('token') || localStorage.getItem('polaris_token') || user?.token;

  // ── Data State ──
  const [orders,   setOrders]   = useState([]);
  const [drivers,  setDrivers]  = useState([]);
  const [routes,   setRoutes]   = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // ── UI State ──
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [selectedOrderId,  setSelectedOrderId]  = useState(null);
  const [activeTab,        setActiveTab]        = useState('drivers');

  // ── Solver State ──
  const [isSolving,          setIsSolving]          = useState(false);
  const [currentJobId,       setCurrentJobId]       = useState(null);
  const [solveStatus,        setSolveStatus]        = useState('');
  const [solveError,         setSolveError]         = useState(null);
  const [unassignedOrderIds, setUnassignedOrderIds] = useState([]);
  const [isFailedModalOpen,  setIsFailedModalOpen]  = useState(false);

  // ── Modals State ──
  const [isOrderModalOpen,  setIsOrderModalOpen]  = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  const { liveLocations, socketConnected } = useLiveTracking(token);
  const driverColorMap = useMemo(() => buildDriverColorMap(drivers), [drivers]);

  // ── Fetch Initial Data ──
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
    try {
      await seedDemoData();
      await loadInitialData();
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreateOrder = async (data) => {
    const created = await createOrder(data);
    setOrders((prev) => [created, ...prev]);
  };

  const handleCreateDriver = async (data) => {
    const created = await createDriver(data);
    setDrivers((prev) => [created, ...prev]);
  };

  // ── Route Optimization Workflow ──
  const handleOptimize = async () => {
    const activeDriverIds = drivers.filter((d) => d.is_active !== false).map((d) => d.id);
    const pendingOrderIds = orders.map((o) => o.id);

    if (!activeDriverIds.length || !pendingOrderIds.length) {
      alert('You need at least 1 active driver and 1 order to run optimization.');
      return;
    }

    setIsSolving(true);
    setSolveStatus('queued');
    setSolveError(null);
    setUnassignedOrderIds([]);

    try {
      const { job_id: jobId } = await submitSolve(pendingOrderIds, activeDriverIds);
      setCurrentJobId(jobId);

      const poll = setInterval(async () => {
        try {
          const job = await getJobStatus(jobId);
          setSolveStatus(job.status);

          if (job.status === 'done') {
            clearInterval(poll);
            setIsSolving(false);
            if (job.route_ids?.length) {
              const fetched = await Promise.all(
                job.route_ids.map((id) => getRoute(id).catch(() => null))
              );
              setRoutes(fetched.filter(Boolean));
            }
            setOrders(await getOrders().catch(() => orders));
          } else if (job.status === 'failed') {
            clearInterval(poll);
            setIsSolving(false);
            setSolveError(job.error_message || 'Optimization failed');
            setUnassignedOrderIds(job.unassigned_order_ids || []);
            setIsFailedModalOpen(true);
          }
        } catch (e) {
          console.error('Poll error:', e);
        }
      }, 1500);
    } catch (err) {
      setIsSolving(false);
      setSolveStatus('failed');
      setSolveError(err.message || 'Failed to submit solve job');
      setIsFailedModalOpen(true);
    }
  };

  // ── Resizable Layout State ──
  const [rightPanelWidth, setRightPanelWidth] = useState(28); // Right sidebar width % (default 28%)
  const [topSectionHeight, setTopSectionHeight] = useState(620); // Top section height in px
  const [isResizingHoriz, setIsResizingHoriz] = useState(false);
  const [isResizingVert, setIsResizingVert] = useState(false);

  const topSectionRef = useRef(null);
  const mainContentRef = useRef(null);

  // Handle Horizontal Resize (Map vs Right Rail)
  const handleHorizMouseDown = (e) => {
    e.preventDefault();
    setIsResizingHoriz(true);

    const handleMouseMove = (moveEvent) => {
      if (!topSectionRef.current) return;
      const rect = topSectionRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const mouseXFromRight = rect.right - moveEvent.clientX;
      const newPct = (mouseXFromRight / containerWidth) * 100;
      // Clamp between 20% and 42%
      const clampedPct = Math.max(20, Math.min(42, newPct));
      setRightPanelWidth(clampedPct);
    };

    const handleMouseUp = () => {
      setIsResizingHoriz(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Handle Vertical Resize (Top Map/Rail vs Bottom Orders Grid)
  const handleVertMouseDown = (e) => {
    e.preventDefault();
    setIsResizingVert(true);

    const handleMouseMove = (moveEvent) => {
      if (!topSectionRef.current) return;
      const rect = topSectionRef.current.getBoundingClientRect();
      const newHeight = moveEvent.clientY - rect.top;
      // Clamp between 400px and 900px
      const clampedHeight = Math.max(400, Math.min(900, newHeight));
      setTopSectionHeight(clampedHeight);
    };

    const handleMouseUp = () => {
      setIsResizingVert(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const riskCount = orders.filter((o) => isTimeWindowAtRisk(o.deadline_end)).length;

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-surface">
        <Loader />
        <p className="mt-4 text-xs font-medium tracking-widest uppercase text-text-secondary">
          Loading Polaris Fleet Dispatch…
        </p>
      </div>
    );
  }

  const isEmpty = drivers.length === 0 && orders.length === 0;

  return (
    <div className={`bg-surface font-body-sm text-on-surface antialiased min-h-screen flex flex-col ${
      isResizingHoriz ? 'cursor-col-resize select-none' : isResizingVert ? 'cursor-row-resize select-none' : ''
    }`}>
      {/* ── Fixed Polaris Standard Header ── */}
      <DashboardTopbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        riskCount={riskCount}
      />

      {/* ── Main Dashboard Body ── */}
      <main className="pt-16 min-h-screen flex flex-col md:flex-row flex-1">
        {/* Fixed Left Sidebar Icon Rail */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content Area */}
        <div ref={mainContentRef} className="flex-1 md:ml-20 p-4 lg:p-6 flex flex-col gap-6">
          {/* Solver Status Banner */}
          <SolveStatusBanner
            jobId={currentJobId}
            status={solveStatus}
            error={solveError}
            onClose={() => { setSolveStatus(''); setCurrentJobId(null); }}
          />

          {isEmpty ? (
            <EmptyState
              onSeedData={handleSeedData}
              isSeeding={isSeeding}
              onOpenOrderModal={() => setIsOrderModalOpen(true)}
              onOpenDriverModal={() => setIsDriverModalOpen(true)}
            />
          ) : (
            <>
              {/* ── TOP SECTION: INTERACTIVE MAP & METRIC RAIL WITH FLEXIBLE RESIZER ── */}
              <section 
                ref={topSectionRef} 
                className="flex flex-col lg:flex-row gap-4 relative group"
                style={{ minHeight: `${topSectionHeight}px`, height: `${topSectionHeight}px` }}
              >
                {/* ENHANCED INTERACTIVE MAP (Flexible Left Panel) */}
                <div 
                  className="flex-1 h-full min-w-0" 
                  style={{ width: `calc(${100 - rightPanelWidth}% - 12px)` }}
                >
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
                </div>

                {/* Vertical Resizer Handle (Left Map vs Right Rail) */}
                <div
                  onMouseDown={handleHorizMouseDown}
                  title="Drag to resize right sidebar width"
                  className="hidden lg:flex w-3 items-center justify-center cursor-col-resize group/resizer hover:bg-primary/10 transition-colors rounded-lg py-2"
                >
                  <div className="w-1 h-12 rounded-full bg-border-subtle group-hover/resizer:bg-primary transition-colors flex flex-col items-center justify-center gap-1">
                    <div className="w-0.5 h-0.5 rounded-full bg-white"></div>
                    <div className="w-0.5 h-0.5 rounded-full bg-white"></div>
                  </div>
                </div>

                {/* RIGHT SIDEBAR: METRIC CARDS RAIL (Flexible Right Panel) */}
                <div 
                  className="h-full overflow-y-auto pr-1 flex shrink-0" 
                  style={{ width: `${rightPanelWidth}%` }}
                >
                  <MetricCardsRail
                    drivers={drivers}
                    orders={orders}
                    routes={routes}
                  />
                </div>
              </section>

              {/* Horizontal Resizer Handle (Top Section vs Bottom Section) */}
              <div
                onMouseDown={handleVertMouseDown}
                title="Drag to resize map height vs bottom orders grid"
                className="w-full h-3 flex items-center justify-center cursor-row-resize group/hresizer hover:bg-primary/10 transition-colors rounded-lg px-2 my-1"
              >
                <div className="h-1 w-24 rounded-full bg-border-subtle group-hover/hresizer:bg-primary transition-colors flex items-center justify-center gap-1">
                  <div className="w-0.5 h-0.5 rounded-full bg-white"></div>
                  <div className="w-0.5 h-0.5 rounded-full bg-white"></div>
                </div>
              </div>

              {/* ── BOTTOM SECTION: ORDERS TABLE & DISPATCH CONTROL PANEL ── */}
              <section className="w-full">
                <OrdersAndControlGrid
                  orders={orders}
                  selectedOrderId={selectedOrderId}
                  onSelectOrder={setSelectedOrderId}
                  onOpenDriverModal={() => setIsDriverModalOpen(true)}
                  onOpenOrderModal={() => setIsOrderModalOpen(true)}
                  onOptimize={handleOptimize}
                  isSolving={isSolving}
                  socketConnected={socketConnected}
                />
              </section>
            </>
          )}
        </div>
      </main>

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

