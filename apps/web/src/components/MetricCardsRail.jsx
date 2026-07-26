import { isTimeWindowAtRisk } from './OrderQueue';

export default function MetricCardsRail({ drivers = [], orders = [], routes = [] }) {
  // ── 1. Fleet Status Calculations ──
  const activeDriverIds = new Set(routes.map((r) => r.driver_id));
  const activeCount = drivers.filter(
    (d) => d.is_active !== false && (activeDriverIds.has(d.id) || d.status === 'active')
  ).length;

  const idleCount = drivers.filter(
    (d) => d.is_active !== false && !activeDriverIds.has(d.id) && d.status !== 'offline'
  ).length;

  const offlineCount = drivers.filter(
    (d) => d.is_active === false || d.status === 'offline'
  ).length;

  // Format with leading zero if under 10
  const fmt = (n) => (n < 10 ? `0${n}` : `${n}`);

  // ── 2. Delivery Progress Calculations ──
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const inTransitCount = orders.filter(
    (o) => o.status === 'in_transit' || o.status === 'assigned' || o.status === 'loaded'
  ).length;
  const pendingCount = orders.filter(
    (o) => !o.status || o.status === 'pending' || o.status === 'unassigned'
  ).length;

  const totalOrders = orders.length || 1;
  const deliveredPct = Math.min(Math.round((deliveredCount / totalOrders) * 100), 100);
  const inTransitPct = Math.min(Math.round((inTransitCount / totalOrders) * 100), 100 - deliveredPct);

  // ── 3. Capacity Utilization Calculations ──
  const assignedOrders = orders.filter(
    (o) => o.status === 'assigned' || o.status === 'in_transit' || o.status === 'loaded'
  );
  const currentLoadKg = assignedOrders.reduce((sum, o) => sum + (parseFloat(o.weight_kg) || 0), 0);
  const totalCapacityKg = drivers.reduce(
    (sum, d) => sum + (parseFloat(d.vehicle_capacity_kg) || 0),
    0
  ) || 1;

  const utilizationPct = Math.min(Math.round((currentLoadKg / totalCapacityKg) * 100), 100);
  // Circle circumference is ~188 (2 * pi * 30)
  const strokeDashoffset = Math.round(188 - (188 * utilizationPct) / 100);

  // ── 4. Route Health Calculations ──
  const atRiskRoutesCount = routes.filter((r) => {
    if (!r.stops) return false;
    return r.stops.some((s) => {
      const order = orders.find((o) => o.id === s.order_id);
      return order && isTimeWindowAtRisk(order.deadline_end);
    });
  }).length;

  const lateRoutesCount = routes.filter((r) => {
    if (!r.stops) return false;
    return r.stops.some((s) => {
      const order = orders.find((o) => o.id === s.order_id);
      return order && order.deadline_end && new Date(order.deadline_end) < new Date();
    });
  }).length;

  const totalRoutes = routes.length;
  const onTimeRoutesCount = Math.max(totalRoutes - atRiskRoutesCount - lateRoutesCount, 0);

  return (
    <div className="w-full flex flex-col gap-6 select-none">
      {/* ── Card 1: Fleet Status ── */}
      <div className="bg-pure-white border border-border-subtle rounded-2xl p-6 shadow-lg shadow-slate-900/5 dark:shadow-black/40">
        <h3 className="font-label-caps text-[10px] text-text-secondary uppercase mb-4 tracking-widest">
          Fleet Status
        </h3>
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="font-hanken text-[32px] font-bold text-primary leading-none">
              {fmt(activeCount)}
            </span>
            <span className="text-[10px] font-label-caps text-secondary font-bold uppercase tracking-tight mt-1">
              Active
            </span>
          </div>
          <div className="flex flex-col text-center border-x border-border-subtle px-6">
            <span className="font-hanken text-[32px] font-bold text-primary leading-none">
              {fmt(idleCount)}
            </span>
            <span className="text-[10px] font-label-caps text-text-secondary uppercase tracking-tight mt-1">
              Idle
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="font-hanken text-[32px] font-bold text-primary leading-none">
              {fmt(offlineCount)}
            </span>
            <span className="text-[10px] font-label-caps text-text-secondary uppercase tracking-tight mt-1">
              Offline
            </span>
          </div>
        </div>
      </div>

      {/* ── Card 2: Delivery Progress ── */}
      <div className="bg-pure-white border border-border-subtle rounded-2xl p-6 shadow-lg shadow-slate-900/5 dark:shadow-black/40">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-label-caps text-[10px] text-text-secondary uppercase tracking-widest">
            Delivery Progress
          </h3>
          <span className="text-[11px] font-mono-data text-primary font-bold">
            {deliveredCount + inTransitCount}/{orders.length} Total
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-surface-container-highest h-1.5 rounded-full mb-4 flex overflow-hidden">
          <div className="bg-primary h-full transition-all" style={{ width: `${deliveredPct}%` }}></div>
          <div className="bg-secondary h-full transition-all" style={{ width: `${inTransitPct}%` }}></div>
        </div>

        <div className="grid grid-cols-2 gap-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            <span className="text-[11px] text-text-secondary">
              Delivered: <b className="text-primary">{deliveredCount}</b>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
            <span className="text-[11px] text-text-secondary">
              In Transit: <b className="text-primary">{inTransitCount}</b>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-surface-dim rounded-full"></div>
            <span className="text-[11px] text-text-secondary">
              Pending: <b className="text-primary">{pendingCount}</b>
            </span>
          </div>
        </div>
      </div>

      {/* ── Card 3: Capacity Utilization ── */}
      <div className="bg-pure-white border border-border-subtle rounded-2xl p-6 shadow-lg shadow-slate-900/5 dark:shadow-black/40">
        <h3 className="font-label-caps text-[10px] text-text-secondary uppercase mb-4 tracking-widest">
          Capacity Utilization
        </h3>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="32" cy="32" fill="none" r="30" stroke="#eeeeee" strokeWidth="4"></circle>
              <circle
                cx="32"
                cy="32"
                fill="none"
                r="30"
                stroke="#000000"
                strokeDasharray="188"
                strokeDashoffset={strokeDashoffset}
                strokeWidth="4"
                className="transition-all duration-500"
              ></circle>
            </svg>
            <span className="absolute text-[12px] font-bold text-primary">{utilizationPct}%</span>
          </div>

          <div className="flex-1">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text-secondary">Current Load</span>
              <span className="font-bold text-primary">{currentLoadKg.toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-text-secondary">Total Capacity</span>
              <span className="font-bold text-primary">{totalCapacityKg.toLocaleString()} kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card 4: Route Health ── */}
      <div className="bg-pure-white border border-border-subtle rounded-2xl p-6 shadow-lg shadow-slate-900/5 dark:shadow-black/40">
        <h3 className="font-label-caps text-[10px] text-text-secondary uppercase mb-4 tracking-widest">
          Route Health
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-[11px] text-on-surface">On Time</span>
            </div>
            <span className="text-[11px] font-bold text-primary">{onTimeRoutesCount} Routes</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary-container"></div>
              <span className="text-[11px] text-on-surface">At Risk</span>
            </div>
            <span className="text-[11px] font-bold text-primary">{atRiskRoutesCount} Routes</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-error"></div>
              <span className="text-[11px] text-on-surface">Late</span>
            </div>
            <span className="text-[11px] font-bold text-primary">{lateRoutesCount} Routes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
