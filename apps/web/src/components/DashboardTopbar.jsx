import useAuth from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import PolarisLogo from './PolarisLogo';
import { useNavigate } from 'react-router-dom';

export default function DashboardTopbar({
  activeTab,
  onTabChange,
  riskCount = 0,
}) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Real user data without fake fallbacks
  const userName = user?.name || user?.fullName || (user?.email ? user.email.split('@')[0] : 'User');
  
  const formatRole = (role) => {
    if (!role) return 'Member';
    if (role === 'superadmin') return 'Platform Admin';
    if (role === 'dispatcher') return 'Dispatcher';
    if (role === 'admin') return 'Admin';
    if (role === 'driver') return 'Driver';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const userRole = formatRole(user?.role);
  const avatarInitial = (userName[0] || 'U').toUpperCase();

  const navLinks = [
    { id: 'drivers',   label: 'Overview' },
    { id: 'orders',    label: 'Orders' },
    { id: 'drivers',   label: 'Drivers' },
    { id: 'documents', label: 'Documents' },
    { id: 'finance',   label: 'Finance' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <header className="bg-pure-white border-b border-border-subtle fixed top-0 left-0 w-full h-16 px-6 flex justify-between items-center z-50 select-none shadow-md shadow-slate-900/5 dark:shadow-black/40">
      {/* ── Left: Polaris Brand Logo & Navigation Links ── */}
      <div className="flex items-center gap-6">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => navigate('/dashboard')}
        >
          <PolarisLogo size={28} dark={theme === 'dark'} />
        </div>

        <nav className="hidden md:flex items-center gap-6 ml-4">
          {navLinks.map((link, idx) => {
            const isActive =
              (link.id === 'orders' && activeTab === 'orders') ||
              (link.label === 'Overview' && activeTab === 'drivers');

            return (
              <button
                key={`${link.label}-${idx}`}
                onClick={() => onTabChange?.(link.id)}
                className={`font-hanken text-sm transition-all rounded-lg px-2.5 py-1 cursor-pointer ${
                  isActive
                    ? 'text-primary font-semibold border-b-2 border-primary bg-primary/5'
                    : 'text-text-secondary hover:text-primary hover:bg-surface-container'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Right: Search, Notifications, Theme, Profile ── */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button
          title="Search"
          className="p-2 rounded-xl hover:bg-surface-container transition-all shadow-sm border border-transparent hover:border-border-subtle cursor-pointer flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
        </button>

        {/* Notifications */}
        <button
          title="Notifications"
          className="p-2 rounded-xl hover:bg-surface-container transition-all shadow-sm border border-transparent hover:border-border-subtle relative cursor-pointer flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          {riskCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-pure-white"></span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          className="p-2 rounded-xl hover:bg-surface-container transition-all shadow-sm border border-transparent hover:border-border-subtle cursor-pointer flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* User Profile */}
        <div 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 pl-4 ml-2 border-l border-border-subtle cursor-pointer group rounded-xl py-1 px-2 hover:bg-surface-container/60 transition-all"
        >
          <div className="text-right hidden sm:block">
            <div className="font-body-sm text-on-surface font-semibold leading-tight group-hover:text-primary transition-colors">
              {userName}
            </div>
            <div className="font-label-caps text-[10px] text-text-secondary uppercase">
              {userRole}
            </div>
          </div>

          {user?.avatar ? (
            <img
              alt={userName}
              className="w-9 h-9 rounded-full object-cover border border-border-subtle shadow-md"
              src={user.avatar}
            />
          ) : (
            <div 
              title={userName}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm shadow-md border transition-all ${
                theme === 'dark' 
                  ? 'bg-white text-slate-950 border-slate-200 shadow-white/10' 
                  : 'bg-slate-900 text-white border-slate-800 shadow-slate-900/20'
              }`}
            >
              {avatarInitial}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

