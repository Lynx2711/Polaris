import { useState, useEffect, useMemo, useCallback } from 'react';
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
    <div className="bg-surface font-body-sm text-on-surface antialiased min-h-screen flex flex-col">
      {/* ── Fixed Stitch Top Header ── */}
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
        <div className="flex-1 md:ml-20 p-4 lg:p-8 flex flex-col gap-8">
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
              {/* TOP GRID: INTERACTIVE MAP & 4 METRIC CARDS */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ENHANCED INTERACTIVE MAP (8 cols) */}
                <div className="lg:col-span-8 relative min-h-[600px] bg-white border border-border-subtle group overflow-hidden">
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

                {/* RIGHT SIDEBAR: 4 SPECIFIC METRIC CARDS (4 cols) */}
                <MetricCardsRail
                  drivers={drivers}
                  orders={orders}
                  routes={routes}
                />
              </section>

              {/* BOTTOM GRID: ORDERS TABLE & DISPATCH CONTROL PANEL */}
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
