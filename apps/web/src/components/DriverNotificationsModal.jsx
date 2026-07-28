import { motion, AnimatePresence } from 'framer-motion';

const NOTIFICATIONS = [
  {
    id: 1,
    title: 'New Route Assigned',
    desc: 'Route #RT-24 assigned with 12 delivery stops in Jalandhar-Phagwara sector.',
    time: '10 mins ago',
    type: 'route',
    icon: 'alt_route',
    unread: true,
  },
  {
    id: 2,
    title: 'Stop Added',
    desc: 'Stop #13 added: LPU Block 38, Customer: Anita Sharma.',
    time: '25 mins ago',
    type: 'stop',
    icon: 'add_location_alt',
    unread: true,
  },
  {
    id: 3,
    title: 'Delivery Rescheduled',
    desc: 'Order #234 delivery window updated to 02:30 PM - 03:30 PM.',
    time: '1 hour ago',
    type: 'time',
    icon: 'schedule',
    unread: false,
  },
  {
    id: 4,
    title: 'Route Updated',
    desc: 'Traffic bypass calculated. 1.8 km distance saved on GT Road.',
    time: '2 hours ago',
    type: 'traffic',
    icon: 'traffic',
    unread: false,
  },
  {
    id: 5,
    title: 'Optimization Completed',
    desc: 'AI solver reorganized your stops to reduce average stop time to 9 min.',
    time: '3 hours ago',
    type: 'solver',
    icon: 'bolt',
    unread: false,
  },
  {
    id: 6,
    title: 'Shift Starting Soon',
    desc: 'Your scheduled shift (09:00 AM - 06:00 PM) is starting.',
    time: '4 hours ago',
    type: 'shift',
    icon: 'alarm',
    unread: false,
  },
];

export default function DriverNotificationsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
        padding: '72px 24px 24px 24px',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
      }} onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 420,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            maxHeight: 'calc(100vh - 100px)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'between',
          }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Driver Notifications</h3>
              <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Operational updates for your current shift</p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1px solid var(--border)', background: 'var(--surface-raised)',
                color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', marginLeft: 'auto',
              }}
            >
              ✕
            </button>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {NOTIFICATIONS.map(n => (
              <div
                key={n.id}
                style={{
                  padding: 14, borderRadius: 12,
                  background: n.unread ? 'var(--surface-raised)' : 'transparent',
                  border: '1px solid var(--border)',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  position: 'relative',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--ink)', color: 'var(--surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{n.icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{n.title}</span>
                    <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>{n.time}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.4 }}>{n.desc}</p>
                </div>
                {n.unread && (
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#2563EB',
                    position: 'absolute', top: 12, right: 12,
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 20px', borderTop: '1px solid var(--border)',
            textAlign: 'center', background: 'var(--surface-raised)',
          }}>
            <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 500 }}>
              All notifications synced with Dispatch Portal
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
