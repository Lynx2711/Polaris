import { motion, AnimatePresence } from 'framer-motion';

export default function DriverDailySummaryModal({ isOpen, onClose, summaryData = {} }) {
  if (!isOpen) return null;

  const data = {
    ordersDelivered: summaryData.ordersDelivered || 12,
    distance: summaryData.distance || '74 km',
    workingTime: summaryData.workingTime || '8h 12m',
    avgStopTime: summaryData.avgStopTime || '9 min',
    completionRate: summaryData.completionRate || '100%',
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(6px)',
      }} onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 440,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            padding: 28,
          }}
        >
          {/* Header icon */}
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--ink)', color: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>verified</span>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', color: 'var(--ink)', marginBottom: 4 }}>
            Today's Shift Summary
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center', marginBottom: 24 }}>
            Great work today! All assigned tasks completed for Route #RT-24.
          </p>

          {/* Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <div style={{
              background: 'var(--surface-raised)', border: '1px solid var(--border)',
              borderRadius: 14, padding: 16, textAlign: 'center',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Orders Delivered
              </span>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
                {data.ordersDelivered}
              </div>
            </div>

            <div style={{
              background: 'var(--surface-raised)', border: '1px solid var(--border)',
              borderRadius: 14, padding: 16, textAlign: 'center',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Distance
              </span>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
                {data.distance}
              </div>
            </div>

            <div style={{
              background: 'var(--surface-raised)', border: '1px solid var(--border)',
              borderRadius: 14, padding: 16, textAlign: 'center',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Working Time
              </span>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
                {data.workingTime}
              </div>
            </div>

            <div style={{
              background: 'var(--surface-raised)', border: '1px solid var(--border)',
              borderRadius: 14, padding: 16, textAlign: 'center',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Average Stop Time
              </span>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
                {data.avgStopTime}
              </div>
            </div>
          </div>

          {/* Progress completion bar */}
          <div style={{
            background: 'var(--surface-raised)', border: '1px solid var(--border)',
            borderRadius: 14, padding: 16, marginBottom: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>
              <span>Route Completion Rate</span>
              <span style={{ color: 'var(--accent-green)' }}>{data.completionRate}</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ width: data.completionRate, height: '100%', background: 'var(--ink)', borderRadius: 99 }} />
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%', height: 44, borderRadius: 12,
              background: 'var(--ink)', color: 'var(--surface)',
              fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            Close Summary
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
