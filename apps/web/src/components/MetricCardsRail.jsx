import { isTimeWindowAtRisk } from './OrderQueue';

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '20px 22px',
};

const label = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.10em',
  textTransform: 'uppercase', color: 'var(--ink-muted)',
  fontFamily: 'Inter,sans-serif', marginBottom: 14,
};

const bigNum = {
  fontSize: 32, fontWeight: 500, lineHeight: 1,
  fontFamily: "'Hanken Grotesk',sans-serif", color: 'var(--ink)',
};

const smallLabel = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.07em',
  textTransform: 'uppercase', color: 'var(--ink-muted)',
  fontFamily: 'Inter,sans-serif', marginTop: 4,
};

export default function MetricCardsRail({ drivers = [], orders = [], routes = [] }) {
  // A driver is "active" if they have a route assigned (route exists for their id)
  // "idle" = is_active true but no route assigned yet
  // "offline" = is_active false (soft-deleted / deactivated)
  const routeDriverIds = new Set(routes.map((r) => String(r.driver_id)));
  const activeCount  = drivers.filter(d => d.is_active !== false && routeDriverIds.has(String(d.id))).length;
  const idleCount    = drivers.filter(d => d.is_active !== false && !routeDriverIds.has(String(d.id))).length;
  const offlineCount = drivers.filter(d => d.is_active === false).length;

  const fmt = (n) => (n < 10 ? `0${n}` : `${n}`);

  const deliveredCount  = orders.filter(o => o.status === 'delivered').length;
  const inTransitCount  = orders.filter(o => o.status === 'in_transit' || o.status === 'assigned' || o.status === 'loaded').length;
  const pendingCount    = orders.filter(o => !o.status || o.status === 'pending' || o.status === 'unassigned').length;
  const totalOrders     = orders.length || 1;
  const deliveredPct    = Math.min(Math.round((deliveredCount / totalOrders) * 100), 100);
  const inTransitPct    = Math.min(Math.round((inTransitCount / totalOrders) * 100), 100 - deliveredPct);

  const assignedOrders  = orders.filter(o => o.status === 'assigned' || o.status === 'in_transit' || o.status === 'loaded');
  const currentLoadKg   = assignedOrders.reduce((sum, o) => sum + (parseFloat(o.weight_kg) || parseFloat(o.weight) || 0), 0);
  const totalCapacityKg = drivers.reduce((sum, d) => sum + (parseFloat(d.vehicle_capacity_kg) || parseFloat(d.capacity_weight) || 0), 0) || 1;
  const utilizationPct  = Math.min(Math.round((currentLoadKg / totalCapacityKg) * 100), 100);
  const strokeDashoffset = Math.round(188 - (188 * utilizationPct) / 100);

  const atRiskRoutesCount = routes.filter(r => {
    if (!r.stops) return false;
    return r.stops.some(s => {
      const order = orders.find(o => o.id === s.order_id);
      return order && isTimeWindowAtRisk(order.deadline_end);
    });
  }).length;

  const lateRoutesCount = routes.filter(r => {
    if (!r.stops) return false;
    return r.stops.some(s => {
      const order = orders.find(o => o.id === s.order_id);
      return order && order.deadline_end && new Date(order.deadline_end) < new Date();
    });
  }).length;

  const totalRoutes       = routes.length;
  const onTimeRoutesCount = Math.max(totalRoutes - atRiskRoutesCount - lateRoutesCount, 0);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14, userSelect: 'none' }}>

      {/* ── Card 1: Fleet Status ── */}
      <div style={card}>
        <div style={label}>Fleet Status</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={bigNum}>{fmt(activeCount)}</div>
            <div style={smallLabel}>Active</div>
          </div>
          <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={bigNum}>{fmt(idleCount)}</div>
            <div style={smallLabel}>Idle</div>
          </div>
          <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={bigNum}>{fmt(offlineCount)}</div>
            <div style={smallLabel}>Offline</div>
          </div>
        </div>
      </div>

      {/* ── Card 2: Delivery Progress ── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={label}>Delivery Progress</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Inter,sans-serif' }}>
            {deliveredCount + inTransitCount}/{orders.length} Total
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', height: 5, borderRadius: 99, background: 'var(--surface-raised)', marginBottom: 14, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: `${deliveredPct}%`, background: 'var(--ink)', transition: 'width 0.5s' }}/>
          <div style={{ width: `${inTransitPct}%`, background: 'var(--ink-muted)', transition: 'width 0.5s' }}/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { dot: 'var(--ink)',       text: `Delivered: ${deliveredCount}` },
            { dot: 'var(--ink-muted)', text: `In Transit: ${inTransitCount}` },
            { dot: 'var(--border)',    text: `Pending: ${pendingCount}` },
          ].map(({ dot, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot, border: '1px solid var(--border)', flexShrink: 0 }}/>
              <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Card 3: Capacity Utilization ── */}
      <div style={card}>
        <div style={label}>Capacity Utilization</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* SVG donut */}
          <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="32" cy="32" fill="none" r="28" stroke="var(--surface-raised)" strokeWidth="5"/>
              <circle cx="32" cy="32" fill="none" r="28" stroke="var(--ink)" strokeDasharray="176" strokeDashoffset={Math.round(176 - (176 * utilizationPct) / 100)} strokeWidth="5" style={{ transition: 'stroke-dashoffset 0.5s' }}/>
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Inter,sans-serif' }}>
              {utilizationPct}%
            </span>
          </div>
          <div style={{ flex: 1 }}>
            {[
              { label: 'Current Load', val: `${currentLoadKg.toLocaleString()} kg` },
              { label: 'Total Capacity', val: `${totalCapacityKg.toLocaleString()} kg` },
            ].map(({ label: l, val }) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif' }}>{l}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Inter,sans-serif' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Card 4: Route Health ── */}
      <div style={card}>
        <div style={label}>Route Health</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { dot: 'var(--accent-green)', text: 'On Time', count: onTimeRoutesCount },
            { dot: 'var(--accent-amber)', text: 'At Risk', count: atRiskRoutesCount },
            { dot: 'var(--accent-red)',   text: 'Late',    count: lateRoutesCount },
          ].map(({ dot, text, count }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }}/>
                <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif' }}>{text}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Inter,sans-serif' }}>{count} Routes</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
