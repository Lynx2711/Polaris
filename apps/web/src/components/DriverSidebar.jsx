import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DRIVER_ITEMS = [
  { id: 'dashboard', icon: 'home',            label: 'Dashboard' },
  { id: 'route',     icon: 'alt_route',       label: 'My Route' },
  { id: 'orders',    icon: 'package_2',      label: 'My Orders' },
  { id: 'schedule', icon: 'calendar_today',   label: 'Schedule' },
  { id: 'profile',  icon: 'person',          label: 'Profile' },
];

export default function DriverSidebar({ activeTab, onTabChange, isExpanded, setIsExpanded }) {
  const [hovered, setHovered] = useState(null);

  const sidebarW = isExpanded ? 200 : 64;

  return (
    <aside style={{
      position: 'fixed',
      left: 12,
      top: 68,
      bottom: 12,
      width: sidebarW,
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '8px 6px',
        gap: 4,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        {/* Toggle Expand */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 10,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--ink-muted)',
            marginBottom: 4,
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          title={isExpanded ? 'Collapse Menu' : 'Expand Menu'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            {isExpanded ? 'menu_open' : 'menu'}
          </span>
        </button>

        {/* Driver Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'hidden' }}>
          {DRIVER_ITEMS.map(item => {
            const active = activeTab === item.id;
            return (
              <div
                key={item.id}
                style={{ position: 'relative' }}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <button
                  onClick={() => onTabChange?.(item.id)}
                  style={{
                    width: '100%',
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0,
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? 'var(--surface-raised)' : 'none',
                    color: active ? 'var(--ink)' : 'var(--ink-muted)',
                    transition: 'background 0.15s, color 0.15s',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-raised)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none'; }}
                >
                  {/* Active bar indicator */}
                  {active && (
                    <div style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: 20, borderRadius: 99,
                      background: 'var(--ink)',
                    }} />
                  )}
                  <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{item.icon}</span>
                  </div>
                  {isExpanded && (
                    <span style={{
                      fontSize: 13, fontWeight: active ? 600 : 500,
                      whiteSpace: 'nowrap', opacity: isExpanded ? 1 : 0,
                      transition: 'opacity 0.2s',
                      fontFamily: 'Inter, sans-serif',
                      color: active ? 'var(--ink)' : 'var(--ink-muted)',
                    }}>
                      {item.label}
                    </span>
                  )}
                </button>

                {/* Collapsed Tooltip */}
                <AnimatePresence>
                  {hovered === item.id && !isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.12 }}
                      style={{
                        position: 'absolute',
                        left: 'calc(100% + 10px)',
                        top: '50%', transform: 'translateY(-50%)',
                        padding: '5px 10px',
                        borderRadius: 8,
                        background: 'var(--ink)',
                        color: 'var(--surface)',
                        fontSize: 11, fontWeight: 600,
                        whiteSpace: 'nowrap',
                        zIndex: 100,
                        pointerEvents: 'none',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {item.label}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
