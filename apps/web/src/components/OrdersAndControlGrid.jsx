import { useState, useEffect } from 'react';

export default function OrdersAndControlGrid({
  orders = [],
  selectedOrderId,
  onSelectOrder,
  onOpenDriverModal,
  onOpenOrderModal,
  onOptimize,
  isSolving,
  socketConnected,
}) {
  const [activeFilter, setActiveFilter] = useState('active');
  const [lastSyncedTime, setLastSyncedTime] = useState('');

  useEffect(() => {
    setLastSyncedTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    const interval = setInterval(() => {
      setLastSyncedTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'active') {
      return o.status !== 'delivered' && o.status !== 'cancelled';
    }
    return o.status === 'delivered' || o.status === 'cancelled';
  });

  const displayOrders = filteredOrders.length > 0 ? filteredOrders : orders;

  const formatTimeWindow = (order) => {
    if (order.deadline_start && order.deadline_end) {
      const start = new Date(order.deadline_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const end = new Date(order.deadline_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${start} - ${end}`;
    }
    return '08:00 - 18:00';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_transit':
      case 'assigned':
        return (
          <span className="px-2 py-0.5 bg-surface-container text-text-secondary font-label-caps text-[9px] uppercase border border-border-subtle">
            In Transit
          </span>
        );
      case 'loaded':
        return (
          <span className="px-2 py-0.5 bg-primary text-on-primary font-label-caps text-[9px] uppercase">
            Loaded
          </span>
        );
      case 'delayed':
      case 'at_risk':
        return (
          <span className="px-2 py-0.5 border border-secondary text-secondary font-label-caps text-[9px] uppercase">
            Delayed
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-label-caps text-[9px] uppercase border border-emerald-200">
            Delivered
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-surface-gray text-text-secondary font-label-caps text-[9px] uppercase border border-border-subtle">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 select-none">
      {/* ── UPDATED ORDERS TABLE (8 cols) ── */}
      <div className="lg:col-span-8 bg-pure-white border border-border-subtle rounded-2xl shadow-xl shadow-slate-900/5 dark:shadow-black/40 flex flex-col min-h-[380px] overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-border-subtle flex justify-between items-center">
          <h3 className="font-title-md text-title-md text-primary font-bold">
            Operational Orders
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter('active')}
              className={`px-4 py-1.5 font-label-caps text-[10px] uppercase rounded-xl cursor-pointer transition-all ${
                activeFilter === 'active'
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'border border-border-subtle text-text-secondary hover:text-primary hover:bg-surface-container'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveFilter('archive')}
              className={`px-4 py-1.5 font-label-caps text-[10px] uppercase rounded-xl cursor-pointer transition-all ${
                activeFilter === 'archive'
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'border border-border-subtle text-text-secondary hover:text-primary hover:bg-surface-container'
              }`}
            >
              Archive
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-border-subtle bg-surface-gray">
                <th className="p-4 font-label-caps text-[10px] text-text-secondary uppercase">Order</th>
                <th className="p-4 font-label-caps text-[10px] text-text-secondary uppercase">Customer</th>
                <th className="p-4 font-label-caps text-[10px] text-text-secondary uppercase">Address</th>
                <th className="p-4 font-label-caps text-[10px] text-text-secondary uppercase">Weight</th>
                <th className="p-4 font-label-caps text-[10px] text-text-secondary uppercase">Time Window</th>
                <th className="p-4 font-label-caps text-[10px] text-text-secondary uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {displayOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-secondary font-body-sm">
                    No orders available. Click "Add Orders" to create one.
                  </td>
                </tr>
              ) : (
                displayOrders.map((order) => {
                  const isSelected = selectedOrderId === order.id;
                  const customerName = order.customer_name || `Customer #${order.id}`;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder?.(isSelected ? null : order.id)}
                      className={`hover:bg-surface-gray transition-colors cursor-pointer ${
                        isSelected ? 'bg-surface-container' : ''
                      }`}
                    >
                      <td className="p-4 font-mono-data text-primary font-medium">
                        #POL-{order.id}
                      </td>
                      <td className="p-4">
                        <div className="font-body-sm font-semibold text-primary truncate max-w-[150px]">
                          {customerName}
                        </div>
                      </td>
                      <td className="p-4 text-[11px] text-text-secondary truncate max-w-[200px]">
                        {order.address || `${order.lat?.toFixed(3)}, ${order.lng?.toFixed(3)}`}
                      </td>
                      <td className="p-4 font-mono-data text-[11px] text-primary">
                        {order.weight_kg} kg
                      </td>
                      <td className="p-4 font-mono-data text-[11px] text-primary">
                        {formatTimeWindow(order)}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DISPATCH CONTROL PANEL (4 cols) ── */}
      <div className="lg:col-span-4 bg-pure-white border border-border-subtle rounded-2xl shadow-xl shadow-slate-900/5 dark:shadow-black/40 p-8 flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <h3 className="font-title-md text-title-md text-primary font-bold">
            Dispatch Control
          </h3>
          <span className="material-symbols-outlined text-text-secondary">tune</span>
        </div>

        <p className="text-[13px] text-text-secondary leading-relaxed">
          Manage real-time operational capacity. Assign resources or trigger AI-driven route optimization.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={onOpenDriverModal}
            className="w-full py-3.5 bg-primary text-on-primary font-label-caps text-[11px] uppercase tracking-widest rounded-xl shadow-md hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-sm">person_add</span> Add Drivers
          </button>

          <button
            onClick={onOpenOrderModal}
            className="w-full py-3.5 bg-primary text-on-primary font-label-caps text-[11px] uppercase tracking-widest rounded-xl shadow-md hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-sm">add_shopping_cart</span> Add Orders
          </button>

          <button
            onClick={onOptimize}
            disabled={isSolving}
            className="w-full py-3.5 border border-primary text-primary font-label-caps text-[11px] uppercase tracking-widest rounded-xl shadow-sm hover:bg-surface-container transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${isSolving ? 'animate-spin' : ''}`}>
              {isSolving ? 'refresh' : 'auto_fix'}
            </span>
            {isSolving ? 'Solving Routes...' : 'Optimize Routes'}
          </button>
        </div>

        {/* System Health & Last Synced Footer */}
        <div className="mt-auto pt-6 border-t border-border-subtle flex flex-col gap-2">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-text-secondary uppercase">System Health</span>
            <span className="font-bold text-primary flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              {socketConnected ? 'NOMINAL' : 'STANDBY'}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-text-secondary uppercase">Last Synced</span>
            <span className="font-mono-data text-primary font-semibold">{lastSyncedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
