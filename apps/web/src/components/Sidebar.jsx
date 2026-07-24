import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Sun,
  Moon,
  Download,
} from 'lucide-react';
import PolarisLogo from './PolarisLogo';
import { useTheme } from '../context/ThemeContext';
import useAuth from '../hooks/useAuth';

const NAV_MAIN = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Orders',    icon: Package,          tab: 'orders'     },
  { label: 'Vehicles',  icon: Truck,            tab: 'drivers'    },
  { label: 'Documents', icon: FileText,         stub: true        },
  { label: 'Finance',   icon: DollarSign,       stub: true        },
  { label: 'Analytics', icon: BarChart3,        stub: true        },
];

export default function Sidebar({ activeTab, onTabChange, width }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const initials = (user?.name || user?.email || 'D')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className="shrink-0 h-full flex flex-col select-none polaris-transition relative"
      style={{
        width: width ? `${width}px` : '240px',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* ── Logo + Light/Dark mode button ── */}
      <div
        className="h-14 flex items-center justify-between px-5 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <PolarisLogo size={26} dark={isDark} loop showWord={false} />
          <span
            className="text-sm font-bold tracking-tight"
            style={{ color: 'var(--sidebar-ink)' }}
          >
            Polaris
          </span>
        </div>

        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer hover:opacity-80"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--ink-muted)',
            boxShadow: 'var(--shadow-sm)',
          }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <>
              <Sun size={13} className="text-amber-400" />
              <span className="text-[11px]">Light</span>
            </>
          ) : (
            <>
              <Moon size={13} className="text-indigo-500" />
              <span className="text-[11px]">Dark</span>
            </>
          )}
        </button>
      </div>

      {/* ── User Profile ── */}
      <div
        className="px-4 py-3.5 flex items-center gap-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
              : 'linear-gradient(135deg, #0A0A0A, #404040)',
            color: '#FFFFFF',
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate leading-none"
            style={{ color: 'var(--sidebar-ink)' }}
          >
            {user?.name || 'Dispatcher'}
          </p>
          <p
            className="text-[11px] mt-0.5 capitalize"
            style={{ color: 'var(--sidebar-ink-dim)' }}
          >
            {user?.role || 'Admin'}
          </p>
        </div>
        <button
          className="shrink-0 p-1.5 rounded-lg hover:bg-[var(--sidebar-hover)] cursor-pointer transition"
          style={{ color: 'var(--sidebar-ink-dim)' }}
        >
          <Bell size={15} />
        </button>
      </div>

      {/* ── Main Navigation ── */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {NAV_MAIN.map(({ label, icon: Icon, path, tab }) => {
          const isTabActive = tab && activeTab === tab;

          if (path) {
            return (
              <NavLink
                key={label}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                    isActive ? 'font-semibold shadow-sm' : 'hover:bg-[var(--sidebar-hover)]'
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'var(--sidebar-active)' : 'transparent',
                  color: isActive ? 'var(--ink)' : 'var(--sidebar-ink-dim)',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                })}
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            );
          }

          if (tab) {
            return (
              <button
                key={label}
                onClick={() => onTabChange?.(tab)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer w-full text-left hover:bg-[var(--sidebar-hover)]"
                style={{
                  background: isTabActive ? 'var(--sidebar-active)' : 'transparent',
                  color: isTabActive ? 'var(--ink)' : 'var(--sidebar-ink-dim)',
                  fontWeight: isTabActive ? '600' : '500',
                  boxShadow: isTabActive ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            );
          }

          return (
            <button
              key={label}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer w-full text-left hover:bg-[var(--sidebar-hover)]"
              style={{ color: 'var(--sidebar-ink-dim)', background: 'transparent' }}
              onClick={() => navigate('/profile')}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Bottom Nav ── */}
      <div className="px-3 pb-2 space-y-1" style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer ${isActive ? 'font-semibold shadow-sm' : 'hover:bg-[var(--sidebar-hover)]'}`
          }
          style={({ isActive }) => ({
            background: isActive ? 'var(--sidebar-active)' : 'transparent',
            color: isActive ? 'var(--ink)' : 'var(--sidebar-ink-dim)',
          })}
        >
          <Settings size={16} />
          <span>Settings</span>
        </NavLink>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer w-full text-left hover:bg-[var(--sidebar-hover)]"
          style={{ color: 'var(--sidebar-ink-dim)', background: 'transparent' }}
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>

      {/* ── Soft App Promo Card ── */}
      <div
        className="mx-3 mb-3 rounded-2xl overflow-hidden shrink-0 polaris-transition"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #161616 0%, #202020 100%)'
            : 'linear-gradient(135deg, #F9F9F9 0%, #F0F0F0 100%)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="px-4 pt-3 pb-2">
          <p
            className="text-xs font-bold leading-tight"
            style={{ color: 'var(--ink)' }}
          >
            Dispatch App
          </p>
          <p
            className="text-[11px] mt-0.5 leading-relaxed"
            style={{ color: 'var(--ink-muted)' }}
          >
            Manage deliveries anywhere
          </p>
        </div>

        <div className="px-3 pb-3">
          <button
            className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer hover:opacity-90 shadow-sm"
            style={{
              background: 'var(--ink)',
              color: 'var(--bg)',
            }}
          >
            <Download size={12} />
            Download app
          </button>
        </div>
      </div>
    </aside>
  );
}
