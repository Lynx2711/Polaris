import { useState, useEffect } from 'react';

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  overflow: 'hidden',
};

const TH = {
  padding: '12px 16px', fontSize: 9, fontWeight: 700, letterSpacing: '0.10em',
  textTransform: 'uppercase', color: 'var(--ink-dim)', whiteSpace: 'nowrap',
  fontFamily: 'Inter,sans-serif', background: 'var(--surface-raised)',
};

const TD = { padding: '14px 16px' };

function StatusPill({ status }) {
  const map = {
    in_transit:  { label: 'IN TRANSIT',  color: 'var(--ink-muted)',    bg: 'transparent',            border: 'var(--border)' },
    assigned:    { label: 'IN TRANSIT',  color: 'var(--ink-muted)',    bg: 'transparent',            border: 'var(--border)' },
    loaded:      { label: 'LOADED',      color: 'var(--ink)',          bg: 'var(--surface-raised)',  border: 'var(--border)' },
    delayed:     { label: 'DELAYED',     color: 'var(--accent-amber)', bg: 'rgba(217,119,6,0.08)',   border: 'rgba(217,119,6,0.4)' },
    at_risk:     { label: 'AT RISK',     color: 'var(--accent-amber)', bg: 'rgba(217,119,6,0.08)',   border: 'rgba(217,119,6,0.4)' },
    delivered:   { label: 'DELIVERED',   color: 'var(--accent-green)', bg: 'rgba(5,150,105,0.08)',   border: 'rgba(5,150,105,0.4)' },
    cancelled:   { label: 'CANCELLED',   color: 'var(--accent-red)',   bg: 'rgba(186,26,26,0.08)',   border: 'rgba(186,26,26,0.4)' },
  };
  const s = map[status] || { label: 'PENDING', color: 'var(--accent-blue)', bg: 'rgba(37,99,235,0.06)', border: 'rgba(37,99,235,0.3)' };
  return (
    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 999, fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', border: `1px solid ${s.border}`, color: s.color, background: s.bg, fontFamily: 'Inter,sans-serif' }}>
      {s.label}
    </span>
  );
}

export default function OrdersAndControlGrid({ orders = [], selectedOrderId, onSelectOrder, onOpenDriverModal, onOpenOrderModal, onOptimize, isSolving, socketConnected }) {
  const [activeFilter, setActiveFilter] = useState('active');
  const [lastSyncedTime, setLastSyncedTime] = useState('');

  useEffect(() => {
    setLastSyncedTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    const id = setInterval(() => setLastSyncedTime(new Date().toLocaleTimeString('en-GB', { hour12: false })), 15000);
    return () => clearInterval(id);
  }, []);

  const filteredOrders = orders.filter(o =>
    activeFilter === 'active' ? o.status !== 'delivered' && o.status !== 'cancelled' : o.status === 'delivered' || o.status === 'cancelled'
  );
  const displayOrders = filteredOrders.length > 0 ? filteredOrders : orders;

  const formatTimeWindow = (order) => {
    if (order.deadline_start && order.deadline_end) {
      const s = new Date(order.deadline_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const e = new Date(order.deadline_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${s} – ${e}`;
    }
    return '08:00 – 18:00';
  };

  const btnBase = {
    width: '100%', padding: '12px 0',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 10, cursor: 'pointer', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Inter,sans-serif',
    transition: 'opacity 0.15s',
  };

  return (
    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr minmax(260px,320px)', gap: 20, userSelect: 'none' }}>

      {/* ── Orders Table ── */}
      <div style={card}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Hanken Grotesk',sans-serif", color: 'var(--ink)', margin: 0 }}>
            Operational Orders
          </h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {['active', 'archive'].map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} style={{
                padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)',
                background: activeFilter === f ? 'var(--ink)' : 'none',
                color: activeFilter === f ? 'var(--surface)' : 'var(--ink-muted)',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all 0.15s',
              }}>
                {f === 'active' ? 'Active' : 'Archive'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Order', 'Customer', 'Address', 'Weight', 'Time Window', 'Status'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayOrders.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif', fontSize: 13 }}>No orders available.</td></tr>
              ) : displayOrders.map(order => {
                const isSelected = selectedOrderId === order.id;
                const weightKg = order.weight_kg || order.weight || 0;
                return (
                  <tr key={order.id} onClick={() => onSelectOrder?.(isSelected ? null : order.id)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s', background: isSelected ? 'var(--surface-raised)' : 'transparent' }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-raised)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                    <td style={TD}><span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>#POL-{order.id}</span></td>
                    <td style={TD}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', fontFamily: 'Inter,sans-serif', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.customer_name || `Customer #${order.id}`}</div></td>
                    <td style={{ ...TD, maxWidth: 200 }}><div style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.address || order.dropoff_address || `${order.lat?.toFixed(3)}, ${order.lng?.toFixed(3)}`}</div></td>
                    <td style={TD}><span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{parseFloat(weightKg).toFixed(2)} kg</span></td>
                    <td style={TD}><span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ink-muted)' }}>{formatTimeWindow(order)}</span></td>
                    <td style={TD}><StatusPill status={order.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Dispatch Control Panel ── */}
      <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Hanken Grotesk',sans-serif", color: 'var(--ink)', margin: 0 }}>Dispatch Control</h3>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-muted)' }}>tune</span>
        </div>

        <p style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.6, fontFamily: 'Inter,sans-serif', margin: 0 }}>
          Manage real-time operational capacity. Assign resources or trigger AI-driven route optimization.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onOpenDriverModal} style={{ ...btnBase, background: 'var(--ink)', color: 'var(--surface)', border: 'none' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
            Add Drivers
          </button>

          <button onClick={onOpenOrderModal} style={{ ...btnBase, background: 'var(--ink)', color: 'var(--surface)', border: 'none' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_shopping_cart</span>
            Add Orders
          </button>

          <button onClick={onOptimize} disabled={isSolving} style={{ ...btnBase, background: 'none', color: 'var(--ink)', border: '1px solid var(--border)', opacity: isSolving ? 0.6 : 1 }}
            onMouseEnter={e => { if (!isSolving) e.currentTarget.style.background = 'var(--surface-raised)'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, animation: isSolving ? 'spin 1s linear infinite' : 'none' }}>
              {isSolving ? 'refresh' : 'auto_fix_high'}
            </span>
            {isSolving ? 'Solving Routes…' : 'Optimize Routes'}
          </button>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'System Health', val: socketConnected ? 'NOMINAL' : 'STANDBY', dot: socketConnected ? 'var(--accent-green)' : 'var(--accent-amber)' },
            { label: 'Last Synced', val: lastSyncedTime, dot: null },
          ].map(({ label, val, dot }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif' }}>{label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 5 }}>
                {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, display: 'inline-block' }}/>}
                {val}
              </span>
            </div>
          ))}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
