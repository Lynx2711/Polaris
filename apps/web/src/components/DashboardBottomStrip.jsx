import { Package, Truck, ChevronDown, CheckCircle, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  delivered:   { label: 'Delivered',   color: '#059669' },
  in_transit:  { label: 'In Transit',  color: '#2563EB' },
  assigned:    { label: 'Assigned',    color: '#8B5CF6' },
  pending:     { label: 'Pending',     color: '#D97706' },
  unassigned:  { label: 'Unassigned',  color: '#D97706' },
  delayed:     { label: 'Delayed',     color: '#DC2626' },
  cancelled:   { label: 'Cancelled',   color: '#991B1B' },
};

function statusLabel(s) {
  return STATUS_CONFIG[s]?.label || (s ? s[0].toUpperCase() + s.slice(1) : 'Pending');
}
function statusColor(s) {
  return STATUS_CONFIG[s]?.color || '#D97706';
}

// ─────────────────────────────────────────────────────────────
// Panel 1 — Shipments Volume Chart
// ─────────────────────────────────────────────────────────────
function ShipmentsChart({ orders }) {
  const total = orders.length;
  return (
    <div
      className="flex flex-col h-full p-4 polaris-transition rounded-2xl border"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>
          Shipments Volume &amp; Transit Time
        </p>
        <button
          className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 border rounded-lg cursor-pointer hover:bg-[var(--bg-secondary)]"
          style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
        >
          Month <ChevronDown size={10} />
        </button>
      </div>

      {total === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs" style={{ color: 'var(--ink-dim)' }}>No shipment data yet</p>
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden mt-1">
          <svg width="100%" height="100%" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 0,90 Q 40,40 80,65 T 160,30 T 240,55 T 320,20 L 320,110 L 0,110 Z"
              fill="url(#chartGrad)"
            />
            <path
              d="M 0,90 Q 40,40 80,65 T 160,30 T 240,55 T 320,20"
              fill="none"
              stroke="var(--accent-blue)"
              strokeWidth="2.5"
            />
          </svg>
          <div
            className="absolute bottom-1 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'var(--bg-secondary)', color: 'var(--ink-dim)' }}
          >
            {total} total orders
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Panel 2 — Status Overview
// ─────────────────────────────────────────────────────────────
function StatusOverview({ orders }) {
  const counts = {};
  orders.forEach((o) => {
    const s = o.status || 'pending';
    counts[s] = (counts[s] || 0) + 1;
  });

  const total = orders.length || 1;
  const segments = Object.entries(counts).map(([s, n]) => ({
    status: s,
    count: n,
    pct: Math.round((n / total) * 100),
    color: statusColor(s),
    label: statusLabel(s),
  }));

  return (
    <div
      className="flex flex-col h-full p-4 polaris-transition rounded-2xl border"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>
          Status Overview
        </p>
        <button
          className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 border rounded-lg cursor-pointer hover:bg-[var(--bg-secondary)]"
          style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
        >
          Month <ChevronDown size={10} />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs" style={{ color: 'var(--ink-dim)' }}>No orders</p>
        </div>
      ) : (
        <>
          <div className="flex w-full h-2.5 rounded-full overflow-hidden mb-3 gap-0.5">
            {segments.map((seg) => (
              <div
                key={seg.status}
                style={{ width: `${seg.pct}%`, background: seg.color, minWidth: seg.count > 0 ? '6px' : '0' }}
              />
            ))}
          </div>

          <div className="space-y-1.5 overflow-y-auto pr-1">
            {segments.map((seg) => (
              <div key={seg.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
                  <span style={{ color: 'var(--ink-muted)' }}>{seg.label}</span>
                </div>
                <span className="font-bold" style={{ color: 'var(--ink)' }}>
                  {seg.count}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Panel 3 — Vehicles in Transit
// ─────────────────────────────────────────────────────────────
function VehiclesInTransit({ drivers, routes }) {
  const activeDriverIds = new Set(routes.map((r) => r.driver_id));
  const inTransit = [...activeDriverIds].length;

  return (
    <div
      className="flex flex-col h-full p-4 items-center justify-between polaris-transition rounded-2xl border"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <p className="text-xs font-bold self-start" style={{ color: 'var(--ink)' }}>
        Vehicles in Transit
      </p>

      <div className="flex flex-col items-center justify-center flex-1 my-1">
        <span
          className="text-4xl font-extrabold tracking-tight tabular-nums"
          style={{ color: 'var(--ink)', lineHeight: 1 }}
        >
          {inTransit || drivers.length}
        </span>
        <span className="text-[11px] font-medium mt-1" style={{ color: 'var(--ink-dim)' }}>
          Active drivers
        </span>
      </div>

      <div className="flex items-end justify-end w-full">
        <Truck
          size={36}
          style={{ color: 'var(--ink-dim)', opacity: 0.35 }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Panel 4 — Orders List
// ─────────────────────────────────────────────────────────────
function OrdersPanel({ orders, selectedOrderId, onSelectOrder }) {
  return (
    <div
      className="flex flex-col h-full polaris-transition rounded-2xl border overflow-hidden"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div>
          <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>Orders</p>
          <p className="text-[10px]" style={{ color: 'var(--ink-dim)' }}>
            Total: {orders.length}
          </p>
        </div>
        <button
          className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 border rounded-lg cursor-pointer hover:bg-[var(--bg-secondary)]"
          style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
        >
          Month <ChevronDown size={10} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {orders.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center">
              <Package size={22} className="mx-auto mb-1.5 opacity-30" style={{ color: 'var(--ink-dim)' }} />
              <p className="text-xs" style={{ color: 'var(--ink-dim)' }}>No orders</p>
            </div>
          </div>
        ) : (
          orders.map((order) => {
            const isSelected = selectedOrderId === order.id;
            const s = order.status || 'pending';
            const color = statusColor(s);
            const label = statusLabel(s);

            const deliveryDate = order.deadline_end
              ? new Date(order.deadline_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
              : '—';

            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder(isSelected ? null : order.id)}
                className="p-2.5 rounded-xl cursor-pointer transition-all border"
                style={{
                  background: isSelected ? 'var(--bg-secondary)' : 'var(--surface)',
                  borderColor: isSelected ? 'var(--ink)' : 'var(--border-light)',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Package size={13} style={{ color: 'var(--ink-dim)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--ink)' }}>
                      #{order.id}
                    </span>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: `color-mix(in srgb, ${color} 15%, transparent)`,
                      color,
                    }}
                  >
                    {label}
                  </span>
                </div>

                <p className="text-[11px] truncate mb-1 text-gray-500">
                  {order.address || `${order.lat?.toFixed(3)}, ${order.lng?.toFixed(3)}`}
                </p>

                <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--ink-dim)' }}>
                  <span>Est. {deliveryDate}</span>
                  <span>•</span>
                  <span>{order.weight_kg} kg</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4-Panel Bottom Strip
// ─────────────────────────────────────────────────────────────
export default function DashboardBottomStrip({
  orders = [],
  drivers = [],
  routes = [],
  selectedOrderId,
  onSelectOrder,
}) {
  return (
    <div
      className="h-full p-2.5 gap-2.5 flex items-stretch polaris-transition overflow-x-auto"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <div className="flex-1 min-w-[240px] h-full">
        <ShipmentsChart orders={orders} />
      </div>
      <div className="w-[200px] shrink-0 h-full">
        <StatusOverview orders={orders} />
      </div>
      <div className="w-[160px] shrink-0 h-full">
        <VehiclesInTransit drivers={drivers} routes={routes} />
      </div>
      <div className="flex-1 min-w-[260px] h-full">
        <OrdersPanel
          orders={orders}
          selectedOrderId={selectedOrderId}
          onSelectOrder={onSelectOrder}
        />
      </div>
    </div>
  );
}
