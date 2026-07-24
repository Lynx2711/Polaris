export default function Loader({ fullPage = false }) {
  if (fullPage) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center polaris-transition"
        style={{ background: 'var(--bg)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-8 w-8 rounded-full border-2 animate-spin"
            style={{
              borderColor: 'var(--border)',
              borderTopColor: 'var(--ink)',
            }}
          />
          <p
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: 'var(--ink-dim)' }}
          >
            Loading Polaris...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className="h-6 w-6 rounded-full border-2 animate-spin"
        style={{
          borderColor: 'var(--border)',
          borderTopColor: 'var(--ink)',
        }}
      />
    </div>
  );
}
