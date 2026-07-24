import { Play, RefreshCw, Plus, AlertTriangle, ChevronRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function DashboardTopbar({
  onOptimize,
  isSolving,
  solveStatus,
  socketConnected,
  orderCount,
  driverCount,
  unassignedCount,
  riskCount,
  onOpenOrderModal,
  onOpenDriverModal,
  onSeedData,
  isSeeding,
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <header
      className="h-14 flex items-center justify-between px-5 shrink-0 polaris-transition z-20"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--ink-muted)' }}>
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Dashboard</span>
        <ChevronRight size={13} className="text-gray-400" />
        <span>Shipment map</span>

        {riskCount > 0 && (
          <span
            className="ml-2 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm"
            style={{
              background: 'color-mix(in srgb, var(--accent-amber) 12%, transparent)',
              color: 'var(--accent-amber)',
              border: '1px solid color-mix(in srgb, var(--accent-amber) 25%, transparent)',
            }}
          >
            <AlertTriangle size={10} />
            {riskCount} at risk
          </span>
        )}
      </div>

      {/* ── Right: date + quick actions + theme toggle ── */}
      <div className="flex items-center gap-2.5">
        <span className="text-xs mr-1 font-medium" style={{ color: 'var(--ink-dim)' }}>
          Today, {dateStr}
        </span>

        {/* Quick Seed */}
        <button
          onClick={onSeedData}
          disabled={isSeeding}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-xl transition cursor-pointer disabled:opacity-50 hover:bg-[var(--bg-secondary)] shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
        >
          <RefreshCw size={12} className={isSeeding ? 'animate-spin' : ''} />
          <span>Seed Demo</span>
        </button>

        {/* Quick Driver */}
        <button
          onClick={onOpenDriverModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-xl transition cursor-pointer hover:bg-[var(--bg-secondary)] shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
        >
          <Plus size={12} />
          <span>Driver</span>
        </button>

        {/* Quick Order */}
        <button
          onClick={onOpenOrderModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-xl transition cursor-pointer hover:bg-[var(--bg-secondary)] shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
        >
          <Plus size={12} />
          <span>Order</span>
        </button>

        {/* Optimize primary button with soft rounded corners */}
        <button
          onClick={onOptimize}
          disabled={isSolving || unassignedCount === 0 || driverCount === 0}
          className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-xl border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:opacity-90"
          style={
            isSolving
              ? { background: 'color-mix(in srgb, var(--accent-blue) 15%, transparent)', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }
              : { background: 'var(--ink)', borderColor: 'var(--ink)', color: 'var(--bg)' }
          }
        >
          {isSolving ? (
            <><RefreshCw size={12} className="animate-spin" /><span>Solving…</span></>
          ) : (
            <><Play size={12} className="fill-current" /><span>Optimize Routes</span></>
          )}
        </button>
      </div>
    </header>
  );
}
