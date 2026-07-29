import React, { useState } from 'react';
import { Package, Clock, CheckCircle, MoreVertical, ChevronLeft, ChevronRight, Filter, Trash2, Edit3, Check } from 'lucide-react';
import WorkspaceContainer from './WorkspaceContainer';
import SlideOverDrawer from '../SlideOverDrawer';
import { updateOrder, deleteOrder } from '../../services/api';

function StatusPill({ status }) {
  const s = (status || 'pending').toUpperCase();
  const display = s === 'UNASSIGNED' ? 'PENDING' : s;
  let color = 'var(--ink-muted)', bg = 'transparent', border = 'var(--border)';
  if (display === 'PENDING') { color = 'var(--accent-blue)'; bg = 'rgba(37,99,235,0.06)'; border = 'rgba(37,99,235,0.4)'; }
  else if (s === 'COMPLETED' || s === 'DELIVERED') { color = 'var(--accent-green)'; bg = 'rgba(5,150,105,0.06)'; border = 'rgba(5,150,105,0.4)'; }
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
      fontSize: 9, fontWeight: 700, letterSpacing: '0.10em',
      border: `1px solid ${border}`, color, background: bg,
      fontFamily: 'Inter, sans-serif',
    }}>{display}</span>
  );
}

const TH = { padding: '14px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink-dim)', whiteSpace: 'nowrap', fontFamily: 'Inter,sans-serif' };
const TD = { padding: '16px 20px', whiteSpace: 'nowrap' };

export default function OrdersWorkspace({ orders = [], onAddOrder, onRefresh }) {
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const PER = 5;

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return !o.status || o.status === 'unassigned' || o.status === 'pending';
    if (filterStatus === 'completed') return o.status === 'completed' || o.status === 'delivered';
    return true;
  });

  const total = filteredOrders.length;
  const pending = orders.filter(o => !o.status || o.status === 'unassigned' || o.status === 'pending').length;
  const completed = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
  const totalPages = Math.max(1, Math.ceil(total / PER));
  const slice = filteredOrders.slice((page - 1) * PER, page * PER);

  const handleOpenDrawer = (order) => {
    setSelected(order);
    setEditForm({
      address: order.address || '',
      weight_kg: order.weight_kg || order.weight || 50,
      status: order.status || 'pending',
    });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await updateOrder(selected.id, editForm);
      onRefresh?.();
      setIsEditing(false);
      setSelected((prev) => ({ ...prev, ...editForm }));
    } catch (err) {
      console.error('Update order error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete order #POL-${id}?`)) return;
    setActionLoading(true);
    try {
      await deleteOrder(id);
      setSelected(null);
      onRefresh?.();
    } catch (err) {
      console.error('Delete order error:', err);
      alert(err.response?.data?.message || 'Failed to delete order.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <WorkspaceContainer id="orders" title="Order Management">
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 28, position: 'relative' }}>
        <button
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          style={{
            padding: '9px 20px', border: '1px solid var(--border)', background: filterStatus !== 'all' ? 'var(--surface-raised)' : 'none',
            cursor: 'pointer', borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink)', fontFamily: 'Inter,sans-serif', transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Filter size={13} />
          Filter: {filterStatus.toUpperCase()}
        </button>

        {showFilterMenu && (
          <div style={{
            position: 'absolute', top: 40, right: 140, zIndex: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140,
          }}>
            {['all', 'pending', 'completed'].map(st => (
              <button
                key={st}
                onClick={() => { setFilterStatus(st); setShowFilterMenu(false); setPage(1); }}
                style={{
                  padding: '8px 12px', border: 'none', background: filterStatus === st ? 'var(--surface-raised)' : 'transparent',
                  color: 'var(--ink)', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', textAlign: 'left', textTransform: 'capitalize',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        )}

        <button onClick={onAddOrder} style={{ padding: '9px 20px', border: 'none', background: 'var(--ink)', color: 'var(--surface)', cursor: 'pointer', borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Inter,sans-serif' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>+ Add Order</button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Orders', value: orders.length, icon: <Package size={20}/>, bg: 'var(--surface-raised)', ic: 'var(--ink-muted)' },
          { label: 'Pending Dispatch', value: pending, icon: <Clock size={20}/>, bg: 'rgba(37,99,235,0.08)', ic: 'var(--accent-blue)' },
          { label: 'Completed', value: completed, icon: <CheckCircle size={20}/>, bg: 'rgba(5,150,105,0.08)', ic: 'var(--accent-green)' },
        ].map(({ label, value, icon, bg, ic }) => (
          <div key={label} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--surface)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color: ic, flexShrink: 0 }}>{icon}</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 500, lineHeight: 1, fontFamily: "'Hanken Grotesk',sans-serif", color: 'var(--ink)', marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 14, background: 'var(--surface)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Order ID', 'Pickup / Origin', 'Dropoff Destination', 'Time Window', 'Cargo Weight (kg)', 'Status', ''].map((h, i) => (
                  <th key={i} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif', fontSize: 13 }}>No orders available.</td></tr>
              ) : slice.map(order => {
                const weightKg = parseFloat(order.weight_kg || order.weight || 50);
                const volumeVal = order.volume || (weightKg * 0.02).toFixed(1);
                const dropoff = order.address || order.dropoff_address || `${order.lat?.toFixed(3)}, ${order.lng?.toFixed(3)}`;
                const pickup = order.pickup_address || 'Central Dispatch Hub';

                return (
                  <tr key={order.id} onClick={() => handleOpenDrawer(order)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={TD}><span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>#POL-{order.id}</span></td>
                    <td style={{ ...TD, maxWidth: 180 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif' }}>{pickup}</span></td>
                    <td style={{ ...TD, maxWidth: 200 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12, fontWeight: 500, color: 'var(--ink)', fontFamily: 'Inter,sans-serif' }}>{dropoff}</span></td>
                    <td style={TD}><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--ink-muted)' }}>{order.deadline_start ? new Date(order.deadline_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:00'} – {order.deadline_end ? new Date(order.deadline_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '18:00'}</span></td>
                    <td style={TD}><span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{weightKg.toLocaleString()} kg <span style={{ fontSize: 11, color: 'var(--ink-dim)', fontWeight: 400 }}>({volumeVal} vol)</span></span></td>
                    <td style={TD}><StatusPill status={order.status} /></td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(order.id); }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}
                        title="Delete Order"
                      >
                        <Trash2 size={15}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
          <span style={{ fontSize: 11, fontFamily: 'Inter,sans-serif', color: 'var(--ink-dim)' }}>Showing {total === 0 ? 0 : (page - 1) * PER + 1}–{Math.min(page * PER, total)} of {total}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-dim)', opacity: page === 1 ? 0.35 : 1 }}><ChevronLeft size={14}/></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ width: 30, height: 30, border: 'none', cursor: 'pointer', borderRadius: 6, background: page === p ? 'var(--ink)' : 'none', color: page === p ? 'var(--surface)' : 'var(--ink-muted)', fontSize: 11, fontWeight: 700, fontFamily: 'Inter,sans-serif' }}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-dim)', opacity: page === totalPages ? 0.35 : 1 }}><ChevronRight size={14}/></button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <SlideOverDrawer isOpen={!!selected} onClose={() => setSelected(null)} title="Order Details">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 6, fontFamily: 'Inter,sans-serif' }}>Order Number</div>
              <div style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 600, color: 'var(--ink)' }}>#POL-{selected.id}</div>
              <div style={{ marginTop: 10 }}><StatusPill status={selected.status} /></div>
            </div>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Destination Address</label>
                  <input
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', marginTop: 4, color: 'var(--ink)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Weight (kg)</label>
                  <input
                    type="number"
                    value={editForm.weight_kg}
                    onChange={(e) => setEditForm({ ...editForm, weight_kg: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', marginTop: 4, color: 'var(--ink)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', marginTop: 4, color: 'var(--ink)' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button onClick={handleSaveEdit} disabled={actionLoading} style={{ flex: 1, padding: 10, borderRadius: 8, background: 'var(--ink)', color: 'var(--surface)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    {actionLoading ? 'Saving...' : 'Save Order'}
                  </button>
                  <button onClick={() => setIsEditing(false)} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Pickup Origin', val: selected.pickup_address || 'Central Dispatch Hub' },
                  { label: 'Dropoff Destination', val: selected.address || selected.dropoff_address || 'Not specified' },
                  { label: 'Weight (kg)', val: `${parseFloat(selected.weight_kg || selected.weight || 50).toLocaleString()} kg` },
                  { label: 'Volume', val: `${selected.volume || (parseFloat(selected.weight_kg || 50) * 0.02).toFixed(1)} vol` },
                ].map(({ label, val }) => (
                  <div key={label} style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 6, fontFamily: 'Inter,sans-serif' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', fontFamily: 'Inter,sans-serif' }}>{val}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--ink)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Edit3 size={15}/>
                {isEditing ? 'Cancel Edit' : 'Edit Order'}
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                disabled={actionLoading}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', background: '#EF4444', color: '#FFFFFF', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Trash2 size={15}/>
                Delete Order
              </button>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </WorkspaceContainer>
  );
}
