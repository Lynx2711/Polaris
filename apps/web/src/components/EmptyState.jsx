import { RefreshCw, Plus, Package, Truck, Compass } from 'lucide-react';

export default function EmptyState({ onSeedData, isSeeding, onOpenOrderModal, onOpenDriverModal }) {
  return (
    <div
      className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center select-none polaris-transition"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="max-w-sm w-full border p-8 space-y-6 polaris-transition"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Icon */}
        <div
          className="w-14 h-14 mx-auto flex items-center justify-center border polaris-transition"
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}
        >
          <Compass size={28} style={{ color: 'var(--ink-muted)' }} />
        </div>

        <div>
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--ink)' }}
          >
            Fleet is empty
          </h2>
          <p
            className="text-sm mt-1.5 leading-relaxed"
            style={{ color: 'var(--ink-muted)' }}
          >
            No drivers or orders registered yet. Seed demo data to explore the dashboard, or add your own.
          </p>
        </div>

        {/* Primary action */}
        <button
          onClick={onSeedData}
          disabled={isSeeding}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold transition cursor-pointer disabled:opacity-50"
          style={{ background: 'var(--ink)', color: 'var(--bg)' }}
        >
          <RefreshCw size={14} className={isSeeding ? 'animate-spin' : ''} />
          <span>{isSeeding ? 'Seeding data...' : 'Seed demo fleet (Jalandhar)'}</span>
        </button>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenDriverModal}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium border transition cursor-pointer polaris-transition"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--ink-muted)',
            }}
          >
            <Truck size={13} />
            <span>Add driver</span>
          </button>

          <button
            onClick={onOpenOrderModal}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium border transition cursor-pointer polaris-transition"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--ink-muted)',
            }}
          >
            <Package size={13} />
            <span>Add order</span>
          </button>
        </div>

        <p className="text-[11px]" style={{ color: 'var(--ink-dim)' }}>
          Polaris CVRPTW Route Optimization Engine
        </p>
      </div>
    </div>
  );
}
