import React, { useState } from 'react';
import { Truck, Phone, ChevronLeft, ChevronRight, CheckCircle, Clock, Filter, Edit3, Trash2, Power } from 'lucide-react';
import WorkspaceContainer from './WorkspaceContainer';
import SlideOverDrawer from '../SlideOverDrawer';
import { updateDriver, deleteDriver } from '../../services/api';

const TH = { padding: '14px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink-dim)', whiteSpace: 'nowrap', fontFamily: 'Inter,sans-serif' };
const TD = { padding: '16px 20px', whiteSpace: 'nowrap' };

export default function DriversWorkspace({ drivers = [], onAddDriver, onRefresh }) {
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const PER = 5;

  const filteredDrivers = drivers.filter(d => {
    const isActive = d.is_active !== false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return isActive;
    if (filterStatus === 'offline') return !isActive;
    return true;
  });

  const total = filteredDrivers.length;
  const activeCount = drivers.filter(d => d.is_active !== false).length;
  const offlineCount = drivers.length - activeCount;
  const totalPages = Math.max(1, Math.ceil(total / PER));
  const slice = filteredDrivers.slice((page - 1) * PER, page * PER);

  const handleOpenDrawer = (driver) => {
    setSelected(driver);
    setEditForm({
      name: driver.name || '',
      phone: driver.phone || '',
      vehicle_capacity_kg: driver.vehicle_capacity_kg || 500,
      is_active: driver.is_active !== false,
    });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await updateDriver(selected.id, editForm);
      onRefresh?.();
      setIsEditing(false);
      setSelected((prev) => ({ ...prev, ...editForm }));
    } catch (err) {
      console.error('Update driver error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (driver) => {
    setActionLoading(true);
    try {
      const updatedStatus = !(driver.is_active !== false);
      await updateDriver(driver.id, { is_active: updatedStatus });
      onRefresh?.();
      if (selected && selected.id === driver.id) {
        setSelected((prev) => ({ ...prev, is_active: updatedStatus }));
      }
    } catch (err) {
      console.error('Toggle active driver error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to deactivate driver #${id}?`)) return;
    setActionLoading(true);
    try {
      await deleteDriver(id);
      setSelected(null);
      onRefresh?.();
    } catch (err) {
      console.error('Delete driver error:', err);
      alert(err.response?.data?.message || 'Failed to delete driver.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <WorkspaceContainer id="drivers" title="Driver Management">
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 28, position: 'relative' }}>
        <button
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          style={{
            padding: '9px 20px', border: '1px solid var(--border)', background: filterStatus !== 'all' ? 'var(--surface-raised)' : 'none',
            cursor: 'pointer', borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink)', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Filter size={13} />
          Filter: {filterStatus.toUpperCase()}
        </button>

        {showFilterMenu && (
          <div style={{
            position: 'absolute', top: 40, right: 140, zIndex: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140,
          }}>
            {['all', 'active', 'offline'].map(st => (
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

        <button onClick={onAddDriver} style={{ padding: '9px 20px', border: 'none', background: 'var(--ink)', color: 'var(--surface)', cursor: 'pointer', borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Inter,sans-serif' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>+ Add Driver</button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Drivers', value: drivers.length, icon: <Truck size={20}/>, bg: 'var(--surface-raised)', ic: 'var(--ink-muted)' },
          { label: 'Active', value: activeCount, icon: <CheckCircle size={20}/>, bg: 'rgba(5,150,105,0.08)', ic: 'var(--accent-green)' },
          { label: 'Offline', value: offlineCount, icon: <Clock size={20}/>, bg: 'rgba(186,26,26,0.08)', ic: 'var(--accent-red)' },
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
                {['Driver Info', 'Contact', 'Capacity (kg)', 'Status', ''].map((h, i) => (
                  <th key={i} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif', fontSize: 13 }}>No drivers available.</td></tr>
              ) : slice.map(driver => {
                const isActive = driver.is_active !== false;
                const weightCap = parseFloat(driver.vehicle_capacity_kg || driver.capacity_weight || driver.capacity || 500);
                const volCap = driver.capacity_volume || Math.round(weightCap * 0.02) || 10;
                return (
                  <tr key={driver.id} onClick={() => handleOpenDrawer(driver)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={TD}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', fontFamily: 'Inter,sans-serif' }}>{driver.name || 'Unnamed'}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--ink-dim)', marginTop: 2 }}>ID #{driver.id}</div>
                    </td>
                    <td style={TD}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-muted)', fontSize: 13, fontFamily: 'Inter,sans-serif' }}>
                        <Phone size={13} style={{ color: 'var(--ink-dim)', flexShrink: 0 }}/>{driver.phone || '—'}
                      </div>
                    </td>
                    <td style={TD}>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                        {weightCap.toLocaleString()} kg <span style={{ fontSize: 11, color: 'var(--ink-dim)', fontWeight: 400 }}>({volCap} vol)</span>
                      </span>
                    </td>
                    <td style={TD}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', fontFamily: 'Inter,sans-serif', border: isActive ? '1px solid rgba(5,150,105,0.4)' : '1px solid var(--border)', color: isActive ? 'var(--accent-green)' : 'var(--ink-muted)', background: isActive ? 'rgba(5,150,105,0.06)' : 'transparent' }}>
                        {isActive ? 'ACTIVE' : 'OFFLINE'}
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(driver.id); }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}
                        title="Deactivate Driver"
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
      <SlideOverDrawer isOpen={!!selected} onClose={() => setSelected(null)} title="Driver Details">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Hanken Grotesk',sans-serif", color: 'var(--ink)', margin: 0 }}>{selected.name || 'Unnamed'}</h3>
              <span style={{ display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: selected.is_active !== false ? 'rgba(5,150,105,0.1)' : 'rgba(140,140,140,0.1)', color: selected.is_active !== false ? 'var(--accent-green)' : 'var(--ink-dim)', fontFamily: 'Inter,sans-serif' }}>
                {selected.is_active !== false ? 'Active' : 'Offline'}
              </span>
            </div>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Driver Name</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', marginTop: 4, color: 'var(--ink)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Phone Number</label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', marginTop: 4, color: 'var(--ink)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Vehicle Capacity (kg)</label>
                  <input
                    type="number"
                    value={editForm.vehicle_capacity_kg}
                    onChange={(e) => setEditForm({ ...editForm, vehicle_capacity_kg: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', marginTop: 4, color: 'var(--ink)' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button onClick={handleSaveEdit} disabled={actionLoading} style={{ flex: 1, padding: 10, borderRadius: 8, background: 'var(--ink)', color: 'var(--surface)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    {actionLoading ? 'Saving...' : 'Save Driver'}
                  </button>
                  <button onClick={() => setIsEditing(false)} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Phone', val: selected.phone || 'N/A' },
                  { label: 'Vehicle Weight Cap', val: `${parseFloat(selected.vehicle_capacity_kg || selected.capacity_weight || selected.capacity || 500).toLocaleString()} kg` },
                  { label: 'Volume Capacity', val: `${selected.capacity_volume || Math.round((selected.vehicle_capacity_kg || 500) * 0.02)} vol` },
                  { label: 'Status', val: selected.is_active !== false ? 'Active' : 'Offline' },
                ].map(({ label, val }) => (
                  <div key={label} style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 6, fontFamily: 'Inter,sans-serif' }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'Inter,sans-serif' }}>{val}</div>
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
                {isEditing ? 'Cancel Edit' : 'Edit Driver'}
              </button>
              <button
                onClick={() => handleToggleActive(selected)}
                disabled={actionLoading}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', background: 'var(--ink)', color: 'var(--surface)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Power size={15}/>
                {selected.is_active !== false ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </WorkspaceContainer>
  );
}
