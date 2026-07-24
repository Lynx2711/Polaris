import { AlertTriangle, X, Package, ShieldAlert } from 'lucide-react';

export default function SolveFailedModal({
  isOpen,
  onClose,
  errorMessage,
  unassignedOrderIds = [],
  orders = [],
}) {
  if (!isOpen) return null;

  const unassignedOrders = orders.filter((o) => unassignedOrderIds.includes(o.id));

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 select-none"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg shadow-2xl p-6 relative polaris-transition"
        style={{
          background: 'var(--surface)',
          border: '1px solid color-mix(in srgb, var(--accent-red) 40%, var(--border))',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 hover:opacity-60 transition cursor-pointer"
          style={{ color: 'var(--ink-muted)' }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div
          className="flex items-center gap-3 pb-4 mb-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="p-2"
            style={{
              background: 'color-mix(in srgb, var(--accent-red) 10%, transparent)',
              color: 'var(--accent-red)',
            }}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
              Route optimization failed
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
              The solver encountered constraint conflicts or capacity limits.
            </p>
          </div>
        </div>

        {/* Error detail */}
        <div
          className="p-3 mb-4 text-sm leading-relaxed"
          style={{
            background: 'color-mix(in srgb, var(--accent-red) 6%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent-red) 20%, transparent)',
            color: 'var(--ink-muted)',
          }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent-red)' }}>
            Diagnostic message
          </p>
          <p>{errorMessage || 'One or more orders could not be placed within vehicle capacities or time windows.'}</p>
        </div>

        {/* Unassigned orders */}
        {unassignedOrderIds.length > 0 && (
          <div className="mb-4">
            <h4
              className="flex items-center gap-2 text-sm font-semibold mb-2"
              style={{ color: 'var(--ink)' }}
            >
              <Package size={14} style={{ color: 'var(--accent-amber)' }} />
              Unassigned orders ({unassignedOrderIds.length})
            </h4>

            <div
              className="max-h-40 overflow-y-auto border divide-y polaris-transition"
              style={{ borderColor: 'var(--border)', '--tw-divide-opacity': 1 }}
            >
              {unassignedOrders.length > 0 ? (
                unassignedOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-2.5 flex items-center justify-between text-sm"
                    style={{ background: 'var(--surface)' }}
                  >
                    <div>
                      <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                        Order #{o.id}
                      </span>
                      <span
                        className="text-xs block truncate max-w-[220px] mt-0.5"
                        style={{ color: 'var(--ink-dim)' }}
                      >
                        {o.address}
                      </span>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        background: 'color-mix(in srgb, var(--accent-amber) 12%, transparent)',
                        color: 'var(--accent-amber)',
                      }}
                    >
                      {o.weight_kg} kg
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-sm" style={{ color: 'var(--ink-muted)' }}>
                  Order IDs: {unassignedOrderIds.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action */}
        <div
          className="flex justify-end pt-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold transition cursor-pointer"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
