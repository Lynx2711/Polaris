import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Package, Truck, Clock, CheckCircle, Activity, Route } from 'lucide-react';
import WorkspaceContainer from './WorkspaceContainer';

export default function AnalyticsWorkspace({ orders = [], drivers = [], routes = [] }) {
  const totalOrders      = orders.length;
  const completedOrders  = orders.filter(o => o.status === 'completed').length;
  const pendingOrders    = orders.filter(o => !o.status || o.status === 'unassigned' || o.status === 'pending').length;
  const inProgressOrders = orders.filter(o => o.status === 'in_progress' || o.status === 'assigned').length;
  const completionRate   = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  const totalDrivers     = drivers.length;
  const activeDrivers    = drivers.filter(d => d.is_active !== false).length;
  const fleetUtilization = totalDrivers > 0 ? Math.round((activeDrivers / totalDrivers) * 100) : 0;

  const avgVolume = totalOrders > 0 ? (orders.reduce((s, o) => s + (o.volume || 0), 0) / totalOrders).toFixed(1) : 0;
  const avgWeight = totalOrders > 0 ? (orders.reduce((s, o) => s + (o.weight || 0), 0) / totalOrders).toFixed(1) : 0;
  const totalCapVol = drivers.reduce((s, d) => s + (d.capacity_volume || 0), 0);
  const totalCapWt  = drivers.reduce((s, d) => s + (d.capacity_weight || 0), 0);
  const pbt = completedOrders + inProgressOrders + pendingOrders || 1;

  const metrics = [
    { icon: <Package size={18}/>,     value: totalOrders,          label: 'Total Orders',   color: 'var(--ink)' },
    { icon: <CheckCircle size={18}/>, value: completedOrders,      label: 'Completed',      color: 'var(--accent-green)' },
    { icon: <Clock size={18}/>,       value: pendingOrders,        label: 'Pending',        color: 'var(--ink-muted)' },
    { icon: <Activity size={18}/>,    value: inProgressOrders,     label: 'In Progress',    color: 'var(--accent-blue)' },
    { icon: <TrendingUp size={18}/>,  value: `${completionRate}%`, label: 'Success Rate',   color: 'var(--ink)' },
    { icon: <Truck size={18}/>,       value: totalDrivers,         label: 'Total Fleet',    color: 'var(--ink)' },
    { icon: <BarChart3 size={18}/>,   value: `${fleetUtilization}%`, label: 'Fleet Util',   color: 'var(--ink)' },
    { icon: <Route size={18}/>,       value: routes.length,        label: 'Active Routes',  color: 'var(--ink)' },
  ];

  const panelStyle = { border: '1px solid var(--border)', borderRadius: 14, padding: '28px', background: 'var(--surface)' };
  const labelStyle = { fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 6, fontFamily: 'Inter,sans-serif' };

  return (
    <WorkspaceContainer id="analytics" title="Advanced Analytics">
      {/* Metric Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        {metrics.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: 'var(--ink-muted)' }}>{m.icon}</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 300, lineHeight: 1, fontFamily: "'Hanken Grotesk',sans-serif", color: m.color, marginBottom: 4 }}>{m.value}</div>
              <div style={labelStyle}>{m.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Delivery Status */}
        <div style={panelStyle}>
          <div style={labelStyle}>Delivery Status Breakdown</div>
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 48, fontWeight: 300, lineHeight: 1, fontFamily: "'Hanken Grotesk',sans-serif", color: 'var(--ink)' }}>{completionRate}%</span>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 4, fontFamily: 'Inter,sans-serif' }}>completion rate</span>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: 'var(--surface-raised)', overflow: 'hidden', display: 'flex', border: '1px solid var(--border)' }}>
              <div style={{ width: `${(completedOrders / pbt) * 100}%`, background: 'var(--accent-green)', transition: 'width 0.7s' }}/>
              <div style={{ width: `${(inProgressOrders / pbt) * 100}%`, background: 'var(--accent-blue)', transition: 'width 0.7s' }}/>
              <div style={{ width: `${(pendingOrders / pbt) * 100}%`, background: 'var(--ink-dim)', transition: 'width 0.7s' }}/>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Completed', count: completedOrders, color: 'var(--accent-green)' },
              { label: 'In Transit', count: inProgressOrders, color: 'var(--accent-blue)' },
              { label: 'Pending', count: pendingOrders, color: 'var(--ink-dim)' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }}/>
                <span style={{ fontSize: 13, color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif' }}>{label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Inter,sans-serif' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Overview */}
        <div style={panelStyle}>
          <div style={labelStyle}>Fleet Overview</div>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif' }}>Fleet Utilization</span>
                <span style={{ fontSize: 22, fontWeight: 300, fontFamily: "'Hanken Grotesk',sans-serif", color: 'var(--ink)' }}>{fleetUtilization}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: 'var(--surface-raised)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${fleetUtilization}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'var(--ink)', borderRadius: 99 }}/>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Fleet Volume', val: totalCapVol, unit: '' },
                { label: 'Fleet Weight', val: totalCapWt, unit: ' kg' },
                { label: 'Avg Order Vol', val: avgVolume, unit: '' },
                { label: 'Avg Order Wt', val: avgWeight, unit: ' kg' },
              ].map(({ label, val, unit }) => (
                <div key={label} style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                  <div style={labelStyle}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 300, fontFamily: "'Hanken Grotesk',sans-serif", color: 'var(--ink)' }}>
                    {val}<span style={{ fontSize: 12, color: 'var(--ink-dim)', fontFamily: 'Inter,sans-serif' }}>{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WorkspaceContainer>
  );
}
