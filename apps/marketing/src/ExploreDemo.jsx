import { useState } from 'react';
import { PolarisLogo } from './PolarisLogo';
import './ExploreDemo.css';

/* ── Monochrome tab icons ── */
function IconTruck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="demo-tab__icon">
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <path d="M16 8h4l3 3v5h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="demo-tab__icon">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  );
}

function IconRoute() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="demo-tab__icon">
      <circle cx="5" cy="6" r="2"/>
      <circle cx="19" cy="18" r="2"/>
      <path d="M5 8v4c0 2.21 1.79 4 4 4h6c2.21 0 4 1.79 4 4"/>
      <path d="M19 4l-4 4 4 4"/>
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="demo-tab__icon">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  );
}

const TABS = [
  {
    id: 'fleet',
    icon: <IconTruck />,
    label: 'Fleet Operations',
    desc: 'Manage orders and drivers',
  },
  {
    id: 'tracking',
    icon: <IconPin />,
    label: 'Live Tracking',
    desc: 'Monitor deliveries in real time',
  },
  {
    id: 'routes',
    icon: <IconRoute />,
    label: 'AI Route Planner',
    desc: 'Generate optimized routes',
  },
  {
    id: 'analytics',
    icon: <IconChart />,
    label: 'Analytics',
    desc: 'Measure operational performance',
  },
];

/* ── Fleet Operations ── */
const DRIVERS = [
  { id: 'D-01', name: 'Arjun Sharma', vehicle: 'Truck · MH-04-BX-2291', status: 'On Route', orders: 4 },
  { id: 'D-02', name: 'Priya Mehta',  vehicle: 'Van · DL-09-CA-5503',   status: 'Available', orders: 0 },
  { id: 'D-03', name: 'Ravi Kumar',   vehicle: 'Truck · PB-08-ZZ-1190',  status: 'On Route', orders: 6 },
  { id: 'D-04', name: 'Sneha Nair',   vehicle: 'Bike · KA-01-RT-7742',   status: 'Break',    orders: 0 },
];
const ORDERS = [
  { id: 'POL-1082', customer: 'Acme Corp',        address: '128 Industrial Pkwy, Sector 4', status: 'Dispatched', eta: '14 min' },
  { id: 'POL-1081', customer: 'Global Freight LLC', address: '404 Shipping Rd, Dock 9',       status: 'Delivered',  eta: '—' },
  { id: 'POL-1080', customer: 'Jane Doe',          address: '742 Evergreen Terrace',          status: 'Pending',    eta: '1 hr 12 min' },
  { id: 'POL-1079', customer: 'Tech Logistic Inc', address: '89 Infinite Loop, Bldg 3',      status: 'Dispatched', eta: '32 min' },
  { id: 'POL-1078', customer: 'SkyFreight Co.',    address: '55 Warehouse Ave, Zone B',       status: 'Pending',    eta: '2 hr 05 min' },
];

function statusBadge(s) {
  const map = {
    Dispatched: 'badge--blue',
    Delivered:  'badge--green',
    Pending:    'badge--gray',
    'On Route': 'badge--blue',
    Available:  'badge--green',
    Break:      'badge--gray',
  };
  return `demo-badge ${map[s] || 'badge--gray'}`;
}

const DRIVER_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6'];

function FleetTab() {
  const [selectedDriver, setSelectedDriver] = useState(null);

  const onRoute   = DRIVERS.filter(d => d.status === 'On Route').length;
  const available = DRIVERS.filter(d => d.status === 'Available').length;
  const onBreak   = DRIVERS.filter(d => d.status === 'Break').length;

  return (
    <div className="demo-fleet">

      {/* ── Summary strip ── */}
      <div className="fleet-summary">
        <div className="fleet-stat">
          <span className="fleet-stat__num">{DRIVERS.length}</span>
          <span className="fleet-stat__lbl">Total Drivers</span>
        </div>
        <div className="fleet-stat-divider"/>
        <div className="fleet-stat">
          <span className="fleet-stat__num" style={{ color: '#2563EB' }}>{onRoute}</span>
          <span className="fleet-stat__lbl">On Route</span>
        </div>
        <div className="fleet-stat-divider"/>
        <div className="fleet-stat">
          <span className="fleet-stat__num" style={{ color: '#10B981' }}>{available}</span>
          <span className="fleet-stat__lbl">Available</span>
        </div>
        <div className="fleet-stat-divider"/>
        <div className="fleet-stat">
          <span className="fleet-stat__num" style={{ color: '#94A3B8' }}>{onBreak}</span>
          <span className="fleet-stat__lbl">On Break</span>
        </div>
        <div className="fleet-stat-divider"/>
        <div className="fleet-stat">
          <span className="fleet-stat__num">{ORDERS.filter(o => o.status === 'Pending').length}</span>
          <span className="fleet-stat__lbl">Pending Orders</span>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div className="fleet-body">

        {/* Left: Driver cards */}
        <div className="fleet-col">
          <div className="demo-section-head">
            <span className="demo-section-label">Active Drivers</span>
            <span className="demo-section-count">{DRIVERS.length} total</span>
          </div>
          <div className="fleet-driver-list">
            {DRIVERS.map((d, i) => (
              <button
                key={d.id}
                className={`fleet-driver-card ${selectedDriver === d.id ? 'is-selected' : ''}`}
                onClick={() => setSelectedDriver(selectedDriver === d.id ? null : d.id)}
                style={{ '--driver-color': DRIVER_COLORS[i] }}
              >
                <div className="fleet-driver-card__accent"/>
                <div className="fleet-driver-avatar" style={{ background: DRIVER_COLORS[i] }}>
                  {d.name[0]}
                </div>
                <div className="fleet-driver-info">
                  <span className="fleet-driver-name">{d.name}</span>
                  <span className="fleet-driver-vehicle">{d.vehicle}</span>
                  {d.orders > 0 && (
                    <div className="fleet-driver-progress">
                      <div
                        className="fleet-driver-progress__fill"
                        style={{ width: `${(d.orders / 8) * 100}%`, background: DRIVER_COLORS[i] }}
                      />
                    </div>
                  )}
                </div>
                <div className="fleet-driver-meta">
                  <div className="fleet-status-dot-wrap">
                    <span className={`fleet-status-dot dot--${d.status === 'On Route' ? 'blue' : d.status === 'Available' ? 'green' : 'gray'}`}/>
                    <span className="fleet-status-label">{d.status}</span>
                  </div>
                  {d.orders > 0 && (
                    <span className="fleet-order-count">{d.orders} orders</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Live orders */}
        <div className="fleet-col">
          <div className="demo-section-head">
            <span className="demo-section-label">Live Orders</span>
            <span className="demo-section-count">{ORDERS.length} today</span>
          </div>
          <div className="fleet-orders-list">
            {ORDERS.map(o => (
              <div key={o.id} className="fleet-order-row">
                <div className="fleet-order-row__left">
                  <span className="fleet-order-id">{o.id}</span>
                  <span className="fleet-order-customer">{o.customer}</span>
                  <span className="fleet-order-address">{o.address}</span>
                </div>
                <div className="fleet-order-row__right">
                  <span className={statusBadge(o.status)}>{o.status}</span>
                  <span className="fleet-order-eta">{o.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}


/* ── Live Tracking ── */
const TRACK_POINTS = [
  { id: 1, name: 'Depot — Sector 4',         x: 14,  y: 52, status: 'Departed' },
  { id: 2, name: 'Stop 1 — Acme Corp',        x: 31,  y: 34, status: 'En Route' },
  { id: 3, name: 'Stop 2 — Global Freight',   x: 54,  y: 26, status: 'Pending' },
  { id: 4, name: 'Stop 3 — Tech Logistic',    x: 72,  y: 44, status: 'Pending' },
  { id: 5, name: 'Stop 4 — SkyFreight',       x: 83,  y: 67, status: 'Pending' },
];
const TRUCK_PATHS = [
  `M 14 52 Q 22 42, 31 34`,
  `M 31 34 Q 42 30, 54 26`,
  `M 54 26 Q 63 35, 72 44`,
  `M 72 44 Q 77 55, 83 67`,
];

function TrackingTab() {
  const [active, setActive] = useState(1);

  return (
    <div className="demo-tracking">
      <div className="demo-map-shell">
        <div className="demo-map-badge">🔴 Live</div>
        <svg viewBox="0 0 100 100" className="demo-map-svg" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[20,40,60,80].map(v => (
            <g key={v}>
              <line x1={v} y1="0" x2={v} y2="100" stroke="#e5e7eb" strokeWidth="0.3"/>
              <line x1="0" y1={v} x2="100" y2={v} stroke="#e5e7eb" strokeWidth="0.3"/>
            </g>
          ))}

          {/* Route paths */}
          {TRUCK_PATHS.map((d, i) => (
            <path key={i} d={d} stroke="#CBD5E1" strokeWidth="1.2" fill="none" strokeDasharray="2,1.5"/>
          ))}

          {/* Active path segment highlight — monochrome */}
          <path d={TRUCK_PATHS[0]} stroke="#0A0A0A" strokeWidth="2" fill="none" opacity="0.7"/>

          {/* Stop nodes — B&W */}
          {TRACK_POINTS.map((pt, i) => (
            <g key={pt.id} onClick={() => setActive(pt.id)} style={{ cursor: 'pointer' }}>
              <circle
                cx={pt.x} cy={pt.y} r="3.5"
                fill={pt.id === 1 ? '#0A0A0A' : pt.id === active ? '#0A0A0A' : '#fff'}
                stroke="#0A0A0A"
                strokeWidth="1.5"
              />
              <text x={pt.x + 4} y={pt.y - 3} fontSize="3.5" fill="#475569" fontFamily="system-ui">{i + 1}</text>
            </g>
          ))}

          {/* Animated truck dot — monochrome */}
          <circle r="2.2" fill="#0A0A0A">
            <animateMotion dur="6s" repeatCount="indefinite" path={TRUCK_PATHS[0]}/>
          </circle>
        </svg>
      </div>

      <div className="demo-tracking-sidebar">
        <div className="demo-section-label" style={{ marginBottom: 12 }}>Delivery Stops</div>
        {TRACK_POINTS.map((pt, i) => (
          <button
            key={pt.id}
            className={`demo-stop-row ${active === pt.id ? 'is-active' : ''}`}
            onClick={() => setActive(pt.id)}
          >
            <span className="demo-stop-num">{i + 1}</span>
            <div className="demo-stop-info">
              <span className="demo-stop-name">{pt.name}</span>
              <span className={statusBadge(pt.status)}>{pt.status}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── AI Route Planner ── */
const CITIES = [
  { id: 'depot',  label: 'Depot — Sector 4',       x: 14, y: 52 },
  { id: 'c1',     label: 'Acme Corp',               x: 31, y: 34 },
  { id: 'c2',     label: 'Global Freight LLC',       x: 54, y: 26 },
  { id: 'c3',     label: 'Tech Logistic Inc',        x: 72, y: 44 },
  { id: 'c4',     label: 'SkyFreight Co.',           x: 83, y: 67 },
  { id: 'c5',     label: 'Jane Doe',                 x: 60, y: 68 },
];
const NAIVE_PATH  = 'M14,52 L83,67 L60,68 L31,34 L54,26 L72,44';
const OPTIM_PATH  = 'M14,52 L31,34 L54,26 L72,44 L83,67 L60,68';
const SAVINGS     = { distance: '38%', time: '24 min', fuel: '31%' };

function RoutePlannerTab() {
  const [phase, setPhase] = useState('idle'); // idle | thinking | done

  const run = () => {
    setPhase('thinking');
    setTimeout(() => setPhase('done'), 2200);
  };
  const reset = () => setPhase('idle');

  return (
    <div className="demo-planner">
      <div className="demo-map-shell">
        <svg viewBox="0 0 100 100" className="demo-map-svg" preserveAspectRatio="xMidYMid meet">
          {[20,40,60,80].map(v => (
            <g key={v}>
              <line x1={v} y1="0" x2={v} y2="100" stroke="#e5e7eb" strokeWidth="0.3"/>
              <line x1="0" y1={v} x2="100" y2={v} stroke="#e5e7eb" strokeWidth="0.3"/>
            </g>
          ))}

          {/* Naive route (faded when done) */}
          {phase !== 'done' && (
            <polyline points={NAIVE_PATH} stroke="#CBD5E1" strokeWidth="1" fill="none" strokeDasharray="2,1.5"/>
          )}

          {/* Optimized route — monochrome */}
          {phase === 'done' && (
            <polyline points={OPTIM_PATH} stroke="#0A0A0A" strokeWidth="2" fill="none"
              style={{ strokeDasharray: 300, strokeDashoffset: 300, animation: 'drawRoute 1.2s ease forwards' }}
            />
          )}

          {/* Stop nodes — B&W: depot filled black, others hollow */}
          {CITIES.map(c => (
            <g key={c.id}>
              <circle cx={c.x} cy={c.y} r={c.id === 'depot' ? 3.5 : 2.5}
                fill={c.id === 'depot' ? '#0A0A0A' : phase === 'done' ? '#0A0A0A' : '#fff'}
                stroke="#0A0A0A" strokeWidth="1.2" opacity="0.9"
              />
            </g>
          ))}
        </svg>

        {phase === 'thinking' && (
          <div className="demo-ai-overlay">
            <span className="demo-ai-spinner"/>
            <span className="demo-ai-text">Polaris AI optimizing route…</span>
          </div>
        )}
      </div>

      <div className="demo-planner-sidebar">
        {phase === 'idle' && (
          <>
            <div className="demo-section-label" style={{ marginBottom: 8 }}>Stops selected</div>
            <div className="demo-planner-stops">
              {CITIES.map((c, i) => (
                <div key={c.id} className="demo-planner-stop-row">
                  <span className="demo-stop-num">{i === 0 ? '⬤' : i}</span>
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
            <button className="demo-optimize-btn" onClick={run}>
              ⚡ Optimize Route
            </button>
          </>
        )}

        {phase === 'thinking' && (
          <div className="demo-planner-thinking">
            <div className="demo-thinking-step is-done">✓ Loading distance matrix</div>
            <div className="demo-thinking-step is-running">◌ Running OR-Tools TSP solver…</div>
            <div className="demo-thinking-step">◌ Applying time-window constraints</div>
            <div className="demo-thinking-step">◌ Finalizing stop order</div>
          </div>
        )}

        {phase === 'done' && (
          <div className="demo-planner-result">
            <div className="demo-section-label" style={{ marginBottom: 12 }}>Optimized Route</div>
            {CITIES.map((c, i) => (
              <div key={c.id} className="demo-result-row">
                <span className="demo-result-num">{i + 1}</span>
                <span className="demo-result-label">{c.label}</span>
              </div>
            ))}
            <div className="demo-savings-grid">
              <div className="demo-saving"><span className="demo-saving__val">−{SAVINGS.distance}</span><span className="demo-saving__key">Distance</span></div>
              <div className="demo-saving"><span className="demo-saving__val">−{SAVINGS.time}</span><span className="demo-saving__key">Travel time</span></div>
              <div className="demo-saving"><span className="demo-saving__val">−{SAVINGS.fuel}</span><span className="demo-saving__key">Fuel</span></div>
            </div>
            <button className="demo-reset-btn" onClick={reset}>Run again</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Analytics ── */
const WEEKLY = [
  { day: 'Mon', orders: 142, onTime: 91 },
  { day: 'Tue', orders: 189, onTime: 94 },
  { day: 'Wed', orders: 167, onTime: 88 },
  { day: 'Thu', orders: 213, onTime: 96 },
  { day: 'Fri', orders: 248, onTime: 93 },
  { day: 'Sat', orders: 176, onTime: 90 },
  { day: 'Sun', orders: 88,  onTime: 97 },
];
const maxOrders = Math.max(...WEEKLY.map(d => d.orders));

const KPIS = [
  { label: 'Orders Today',  value: '248', change: '+12%', color: '#2563EB' },
  { label: 'Drivers Online', value: '18',  change: '86% util', color: '#10B981' },
  { label: 'Avg ETA',        value: '14m', change: '↓ 3min',   color: '#F59E0B' },
  { label: 'Fuel Saved',     value: '+24%', change: 'vs last wk', color: '#8B5CF6' },
];

function AnalyticsTab() {
  const [hover, setHover] = useState(null);

  return (
    <div className="demo-analytics">
      <div className="demo-kpi-row">
        {KPIS.map(k => (
          <div key={k.label} className="demo-kpi-card" style={{ '--kpi-color': k.color }}>
            <span className="demo-kpi-label">{k.label}</span>
            <span className="demo-kpi-value">{k.value}</span>
            <span className="demo-kpi-change">{k.change}</span>
          </div>
        ))}
      </div>

      <div className="demo-chart-block">
        <div className="demo-section-head">
          <span className="demo-section-label">Weekly Orders</span>
          <span className="demo-section-count">Last 7 days</span>
        </div>
        <div className="demo-bar-chart">
          {WEEKLY.map((d, i) => (
            <div
              key={d.day}
              className={`demo-bar-col ${hover === i ? 'is-hover' : ''}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {hover === i && (
                <div className="demo-bar-tooltip">
                  <strong>{d.orders}</strong> orders<br/>{d.onTime}% on-time
                </div>
              )}
              <div
                className="demo-bar"
                style={{ height: `${(d.orders / maxOrders) * 100}%` }}
              />
              <span className="demo-bar-label">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="demo-on-time-block">
        <div className="demo-section-head">
          <span className="demo-section-label">On-Time Delivery Rate</span>
        </div>
        <div className="demo-on-time-bars">
          {WEEKLY.map(d => (
            <div key={d.day} className="demo-on-time-row">
              <span className="demo-on-time-day">{d.day}</span>
              <div className="demo-on-time-track">
                <div className="demo-on-time-fill" style={{ width: `${d.onTime}%` }}/>
              </div>
              <span className="demo-on-time-pct">{d.onTime}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export function ExploreDemo() {
  const params = new URLSearchParams(window.location.search);
  const initial = TABS.findIndex(t => t.id === params.get('tab'));
  const [activeTab, setActiveTab] = useState(initial >= 0 ? initial : 0);

  return (
    <div className="demo-page">
      {/* Header */}
      <header className="demo-header">
        <a href="/" className="demo-header__logo">
          <PolarisLogo />
        </a>
        <div className="demo-header__pill">Interactive Demo</div>
        <a href="http://localhost:5174/signup" className="demo-header__cta">
          Get started →
        </a>
      </header>

      {/* Hero text */}
      <div className="demo-hero">
        <h1 className="demo-hero__title">Explore Polaris</h1>
        <p className="demo-hero__sub">
          A live preview of the platform — no account needed.
        </p>
      </div>

      {/* Tab bar */}
      <div className="demo-tabs">
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            className={`demo-tab ${activeTab === i ? 'is-active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab.icon}
            <span className="demo-tab__label">{tab.label}</span>
            <span className="demo-tab__desc">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="demo-content">
        {activeTab === 0 && <FleetTab />}
        {activeTab === 1 && <TrackingTab />}
        {activeTab === 2 && <RoutePlannerTab />}
        {activeTab === 3 && <AnalyticsTab />}
      </div>
    </div>
  );
}
