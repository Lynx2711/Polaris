import { useState, useEffect, useMemo, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import useLiveTracking from '../hooks/useLiveTracking';
import {
  getOrders,
  getDrivers,
  submitSolve,
  getJobStatus,
  getRoute,
  createOrder,
  createDriver,
  seedDemoData,
} from '../services/api';
import { buildDriverColorMap } from '../utils/driverPalette';

import TerminalHeader from '../components/TerminalHeader';
import DriverRail from '../components/DriverRail';
import OrderQueue, { isTimeWindowAtRisk } from '../components/OrderQueue';
import DispatchMap from '../components/DispatchMap';
import SolveStatusBanner from '../components/SolveStatusBanner';
import SolveFailedModal from '../components/SolveFailedModal';
import NewOrderModal from '../components/NewOrderModal';
import NewDriverModal from '../components/NewDriverModal';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { Truck, Package, Layers } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();

  // Retrieve token from localStorage or AuthContext user payload
  const token = localStorage.getItem('token') || localStorage.getItem('polaris_token') || user?.token;

  // Data states
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Selection & UI states
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('drivers'); // 'drivers' | 'orders'

  // Solver states
  const [isSolving, setIsSolving] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [solveStatus, setSolveStatus] = useState(''); // 'queued' | 'running' | 'done' | 'failed'
  const [solveError, setSolveError] = useState(null);
  const [unassignedOrderIds, setUnassignedOrderIds] = useState([]);
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false);

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  // Live Socket tracking
  const { liveLocations, socketConnected } = useLiveTracking(token);

  // Derive driver color map using user's golden angle palette logic
  const driverColorMap = useMemo(() => {
    return buildDriverColorMap(drivers);
  }, [drivers]);

  // Load initial orders and drivers
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedOrders, fetchedDrivers] = await Promise.all([
        getOrders().catch(() => []),
        getDrivers().catch(() => []),
      ]);
      setOrders(fetchedOrders || []);
      setDrivers(fetchedDrivers || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Seed demo data handler
  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      await loadInitialData();
    } catch (err) {
      console.error('Seed demo data error:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  // Create Order handler
  const handleCreateOrder = async (orderData) => {
    const created = await createOrder(orderData);
    setOrders((prev) => [created, ...prev]);
  };

  // Create Driver handler
  const handleCreateDriver = async (driverData) => {
    const created = await createDriver(driverData);
    setDrivers((prev) => [created, ...prev]);
  };

  // ── OPTIMIZE ROUTES (Async Solve Flow) ──
  const handleOptimize = async () => {
    // Collect active drivers and unassigned/all order IDs
    const activeDriverIds = drivers.filter((d) => d.is_active !== false).map((d) => d.id);
    const pendingOrderIds = orders.map((o) => o.id);

    if (activeDriverIds.length === 0 || pendingOrderIds.length === 0) {
      alert('You need at least 1 active driver and 1 order to run optimization.');
      return;
    }

    setIsSolving(true);
    setSolveStatus('queued');
    setSolveError(null);
    setUnassignedOrderIds([]);

    try {
      // Step 1: POST to /api/solve -> get back job_id immediately
      const solveRes = await submitSolve(pendingOrderIds, activeDriverIds);
      const jobId = solveRes.job_id;
      setCurrentJobId(jobId);

      // Step 2: Poll GET /api/jobs/:id every ~1.5s until status is 'done' or 'failed'
      const pollInterval = setInterval(async () => {
        try {
          const job = await getJobStatus(jobId);
          setSolveStatus(job.status);

          if (job.status === 'done') {
            clearInterval(pollInterval);
            setIsSolving(false);

            // Step 3: Fetch all route geometries
            if (job.route_ids && job.route_ids.length > 0) {
              const fetchedRoutes = await Promise.all(
                job.route_ids.map((id) => getRoute(id).catch(() => null))
              );
              setRoutes(fetchedRoutes.filter(Boolean));
            }

            // Refresh order status
            const updatedOrders = await getOrders().catch(() => orders);
            setOrders(updatedOrders);
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            setIsSolving(false);
            setSolveError(job.error_message || 'Optimization solver failed');
            setUnassignedOrderIds(job.unassigned_order_ids || []);
            setIsFailedModalOpen(true);
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, 1500);

    } catch (err) {
      console.error('Solve submission error:', err);
      setIsSolving(false);
      setSolveStatus('failed');
      setSolveError(err.message || 'Failed to submit solve job');
      setIsFailedModalOpen(true);
    }
  };

  // Counts
  const unassignedOrders = orders.filter((o) => !o.status || o.status === 'pending' || o.status === 'unassigned');
  const riskCount = orders.filter((o) => isTimeWindowAtRisk(o.deadline_end)).length;

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-[#0A0A0A] flex flex-col items-center justify-center font-mono text-white">
        <Loader />
        <p className="mt-4 text-xs text-[#8C8C8C] tracking-widest uppercase animate-pulse">
          LOADING POLARIS OPERATIONS TERMINAL...
        </p>
      </div>
    );
  }

  const isEmpty = drivers.length === 0 && orders.length === 0;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0A0A0A] text-white font-mono overflow-hidden">
      {/* Top Navigation Terminal Header */}
      <TerminalHeader
        user={user}
        onLogout={logout}
        onOptimize={handleOptimize}
        isSolving={isSolving}
        solveStatus={solveStatus}
        socketConnected={socketConnected}
        orderCount={orders.length}
        driverCount={drivers.length}
        unassignedCount={unassignedOrders.length}
        riskCount={riskCount}
        onOpenOrderModal={() => setIsOrderModalOpen(true)}
        onOpenDriverModal={() => setIsDriverModalOpen(true)}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      />

      {/* Non-blocking Solve Status Banner */}
      <SolveStatusBanner
        jobId={currentJobId}
        status={solveStatus}
        error={solveError}
        onClose={() => {
          setSolveStatus('');
          setCurrentJobId(null);
        }}
      />

      {/* Main Operations Workstation Layout */}
      {isEmpty ? (
        <EmptyState
          onSeedData={handleSeedData}
          isSeeding={isSeeding}
          onOpenOrderModal={() => setIsOrderModalOpen(true)}
          onOpenDriverModal={() => setIsDriverModalOpen(true)}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Operations Rail (360px) */}
          <aside className="w-[340px] md:w-[380px] shrink-0 h-full flex flex-col bg-[#121212] border-r border-[#262626] z-20">
            {/* Rail View Selector */}
            <div className="grid grid-cols-2 border-b border-[#262626] bg-[#0A0A0A] text-xs">
              <button
                onClick={() => setActiveTab('drivers')}
                className={`py-2.5 flex items-center justify-center gap-2 font-bold tracking-wider transition cursor-pointer ${
                  activeTab === 'drivers'
                    ? 'bg-[#121212] text-white border-b-2 border-white'
                    : 'text-[#8C8C8C] hover:text-white'
                }`}
              >
                <Truck size={14} />
                <span>DRIVERS ({drivers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`py-2.5 flex items-center justify-center gap-2 font-bold tracking-wider transition cursor-pointer relative ${
                  activeTab === 'orders'
                    ? 'bg-[#121212] text-white border-b-2 border-white'
                    : 'text-[#8C8C8C] hover:text-white'
                }`}
              >
                <Package size={14} />
                <span>ORDERS ({orders.length})</span>
                {riskCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping absolute top-2 right-3" />
                )}
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'drivers' ? (
                <DriverRail
                  drivers={drivers}
                  routes={routes}
                  driverColorMap={driverColorMap}
                  selectedDriverId={selectedDriverId}
                  onSelectDriver={setSelectedDriverId}
                  liveLocations={liveLocations}
                  socketConnected={socketConnected}
                />
              ) : (
                <OrderQueue
                  orders={orders}
                  selectedOrderId={selectedOrderId}
                  onSelectOrder={setSelectedOrderId}
                />
              )}
            </div>
          </aside>

          {/* Right Main Map Container */}
          <main className="flex-1 h-full relative overflow-hidden bg-[#0D0D0D]">
            <DispatchMap
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
          </main>
        </div>
      )}

      {/* Solve Failure Modal */}
      <SolveFailedModal
        isOpen={isFailedModalOpen}
        onClose={() => setIsFailedModalOpen(false)}
        errorMessage={solveError}
        unassignedOrderIds={unassignedOrderIds}
        orders={orders}
      />

      {/* Add Order Modal */}
      <NewOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSubmit={handleCreateOrder}
      />

      {/* Add Driver Modal */}
      <NewDriverModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        onSubmit={handleCreateDriver}
      />
    </div>
  );
}
