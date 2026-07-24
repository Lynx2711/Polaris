import { RefreshCw, CheckCircle2, AlertOctagon, X } from 'lucide-react';

export default function SolveStatusBanner({ jobId, status, error, onClose }) {
  if (!jobId && !status) return null;

  let icon, label, detail, colorStyle;

  if (status === 'queued' || status === 'running') {
    icon = <RefreshCw size={14} className="animate-spin shrink-0" style={{ color: 'var(--accent-blue)' }} />;
    label = 'Optimization running';
    detail = `Job #${jobId} — ${status}`;
    colorStyle = {
      borderColor: 'color-mix(in srgb, var(--accent-blue) 30%, transparent)',
    };
  } else if (status === 'done') {
    icon = <CheckCircle2 size={14} className="shrink-0" style={{ color: 'var(--accent-green)' }} />;
    label = 'Optimization complete';
    detail = 'Routes solved and updated.';
    colorStyle = {
      borderColor: 'color-mix(in srgb, var(--accent-green) 30%, transparent)',
    };
  } else {
    icon = <AlertOctagon size={14} className="shrink-0" style={{ color: 'var(--accent-red)' }} />;
    label = 'Solver failed';
    detail = error || 'Could not compute optimal routes.';
    colorStyle = {
      borderColor: 'color-mix(in srgb, var(--accent-red) 30%, transparent)',
    };
  }

  return (
    <div
      className="absolute top-3 left-1/2 -translate-x-1/2 z-40 select-none"
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="flex items-center gap-3 px-4 py-2.5 border text-sm polaris-transition shadow-lg"
        style={{
          background: 'var(--surface)',
          color: 'var(--ink)',
          ...colorStyle,
          minWidth: '280px',
        }}
      >
        {icon}
        <div className="flex-1 min-w-0">
          <span className="font-semibold">{label}</span>
          <span className="text-xs ml-2" style={{ color: 'var(--ink-muted)' }}>{detail}</span>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 hover:opacity-60 transition cursor-pointer"
          style={{ color: 'var(--ink-dim)' }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
