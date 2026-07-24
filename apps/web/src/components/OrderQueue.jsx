import { useState } from 'react';
import { Package, Clock, MapPin, AlertTriangle, CheckCircle, Scale } from 'lucide-react';

/**
 * Checks if an order's deadline_end is within 2 hours from now.
 */
export function isTimeWindowAtRisk(deadlineEnd) {
  if (!deadlineEnd) return false;
  const now = new Date();
  const end = new Date(deadlineEnd);
  const diffMs = end.getTime() - now.getTime();
  return diffMs / (1000 * 60 * 60) <= 2;
}

export default function OrderQueue({
  orders = [],
  selectedOrderId,
  onSelectOrder,
  horizontal = false,
}) {
  const [filter, setFilter] = useState('unassigned');

  const filteredOrders = orders.filter((o) => {
    if (filter === 'unassigned') {
      return !o.status || o.status === 'pending' || o.status === 'unassigned';
    }
    return true;
  });

  if (orders.length === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--ink-dim)' }}>
        <div className="text-center">
          <Package size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">No orders yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full polaris-transition ${horizontal ? 'flex flex-col overflow-hidden' : 'flex flex-col overflow-hidden'}`}
      style={{ background: 'var(--surface)' }}
    >
      {/* Filter bar — only shown in vertical / standalone mode */}
      {!horizontal && (
        <div
          className="px-4 py-2 flex items-center justify-between border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-xs" style={{ color: 'var(--ink-dim)' }}>
            {filteredOrders.length} {filter === 'unassigned' ? 'pending' : 'total'}
          </span>
          <div
            className="flex text-[11px] font-medium border overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              onClick={() => setFilter('unassigned')}
              className="px-2.5 py-1 cursor-pointer transition-colors"
              style={{
                background: filter === 'unassigned' ? 'var(--ink)' : 'transparent',
                color: filter === 'unassigned' ? 'var(--bg)' : 'var(--ink-muted)',
              }}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('all')}
              className="px-2.5 py-1 cursor-pointer transition-colors"
              style={{
                background: filter === 'all' ? 'var(--ink)' : 'transparent',
                color: filter === 'all' ? 'var(--bg)' : 'var(--ink-muted)',
              }}
            >
              All
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div
        className={`flex-1 ${horizontal ? 'flex flex-row overflow-x-auto overflow-y-hidden' : 'overflow-y-auto'}`}
      >
        {filteredOrders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6" style={{ color: 'var(--ink-dim)' }}>
            <p className="text-xs">
              {filter === 'unassigned' ? 'All orders are assigned.' : 'No orders found.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isRisk = isTimeWindowAtRisk(order.deadline_end);
            const isSelected = selectedOrderId === order.id;
            const isAssigned = order.status === 'assigned';
            const deadlineTime = order.deadline_end
              ? new Date(order.deadline_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : null;

            if (horizontal) {
              // Compact card for horizontal bottom panel
              return (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(isSelected ? null : order.id)}
                  className="shrink-0 h-full flex flex-col justify-between cursor-pointer transition-colors border-r polaris-transition"
                  style={{
                    width: '200px',
                    background: isSelected ? 'var(--surface-raised)' : 'var(--surface)',
                    borderColor: 'var(--border)',
                    borderTop: `3px solid ${isRisk ? 'var(--accent-amber)' : isAssigned ? '#34D399' : 'var(--border)'}`,
                    padding: '12px 14px',
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                        #{order.id}
                      </span>
                      {isAssigned ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, #34D399 12%, transparent)', color: '#34D399' }}>
                          <CheckCircle size={8} className="inline mr-0.5" />Assigned
                        </span>
                      ) : isRisk ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full animate-pulse" style={{ background: 'color-mix(in srgb, var(--accent-amber) 15%, transparent)', color: 'var(--accent-amber)' }}>
                          <AlertTriangle size={8} className="inline mr-0.5" />Risk
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] truncate" style={{ color: 'var(--ink-dim)' }}>
                      {order.address || `${order.lat?.toFixed(3)}, ${order.lng?.toFixed(3)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] mt-2" style={{ color: 'var(--ink-dim)' }}>
                    <span className="flex items-center gap-1">
                      <Scale size={10} />
                      {order.weight_kg} kg
                    </span>
                    {deadlineTime && (
                      <span className="flex items-center gap-1" style={{ color: isRisk ? 'var(--accent-amber)' : undefined }}>
                        <Clock size={10} />
                        {deadlineTime}
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            // Vertical card
            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder(isSelected ? null : order.id)}
                className={`px-4 py-3.5 cursor-pointer transition-colors border-b polaris-transition ${isRisk ? 'risk-amber-border' : ''}`}
                style={{
                  background: isSelected ? 'var(--surface-raised)' : 'var(--surface)',
                  borderColor: 'var(--border-light)',
                  borderLeft: isRisk ? undefined : '3px solid transparent',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>#{order.id}</span>
                    {isAssigned ? (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, #34D399 12%, transparent)', color: '#34D399' }}>
                        <CheckCircle size={9} />Assigned
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--ink-dim)' }}>
                        Pending
                      </span>
                    )}
                  </div>
                  {isRisk && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full animate-pulse" style={{ background: 'color-mix(in srgb, var(--accent-amber) 15%, transparent)', color: 'var(--accent-amber)' }}>
                      <AlertTriangle size={9} />2h risk
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-1.5 text-[12px] mb-2" style={{ color: 'var(--ink-muted)' }}>
                  <MapPin size={11} className="shrink-0 mt-0.5" style={{ color: 'var(--ink-dim)' }} />
                  <span className="truncate">{order.address || `${order.lat?.toFixed(4)}, ${order.lng?.toFixed(4)}`}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--ink-dim)' }}>
                  <span className="flex items-center gap-1">
                    <Scale size={10} />
                    <span><strong style={{ color: 'var(--ink-muted)' }}>{order.weight_kg}</strong> kg</span>
                  </span>
                  {deadlineTime && (
                    <span className="flex items-center gap-1" style={{ color: isRisk ? 'var(--accent-amber)' : undefined }}>
                      <Clock size={10} />
                      Due {deadlineTime}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
