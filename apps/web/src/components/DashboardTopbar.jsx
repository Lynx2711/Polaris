import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

export default function DashboardTopbar({
  activeTab,
  onTabChange,
  riskCount = 0,
}) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const userName = user?.name || user?.email?.split('@')[0] || 'Jacob Jones';
  const userRole = user?.role || 'Dispatch Officer';
  const userAvatar = user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTDEMqhnQAktmTohUvXyJGfinkNzzQvIjAMZJSQrnt1Rni-PiYbq3uy6jz37ZUWz9YpY-bcLD1_6SUOv5OpwEewxgavXbPNfjUM43FyWVkFpIl3Uv7zxmOz4UNVg7kM5NgHY4VAAgxrNN6oyK1OVrTR3PEn5H_VRkSweNXwPc4Z_9uAFDFjSIKEOSqTOIdSiYBe5LO1KfqSPqV16K_E-6I7bZeGxJ0uRAAKy0F5j94f29w8LWLgSkZ-wQfhS4EFqtv6UbeaQDV6KDP';

  const navLinks = [
    { id: 'drivers',   label: 'Overview' },
    { id: 'orders',    label: 'Orders' },
    { id: 'drivers',   label: 'Drivers' },
    { id: 'documents', label: 'Documents' },
    { id: 'finance',   label: 'Finance' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <header className="bg-pure-white border-b border-border-subtle fixed top-0 left-0 w-full h-16 px-6 flex justify-between items-center z-50 select-none">
      {/* ── Left: Brand Logo & Navigation Links ── */}
      <div className="flex items-center gap-4">
        <div className="font-hanken text-2xl font-bold tracking-tighter text-primary">
          Polaris
        </div>

        <nav className="hidden md:flex items-center gap-6 ml-8">
          {navLinks.map((link, idx) => {
            const isActive =
              (link.id === 'orders' && activeTab === 'orders') ||
              (link.label === 'Overview' && activeTab === 'drivers');

            return (
              <button
                key={`${link.label}-${idx}`}
                onClick={() => onTabChange?.(link.id)}
                className={`font-hanken text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'text-primary font-semibold border-b-2 border-primary pb-1'
                    : 'text-text-secondary hover:text-primary'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Right: Search, Notifications, Theme, Profile ── */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <button
          title="Search"
          className="p-2 hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
        </button>

        {/* Notifications */}
        <button
          title="Notifications"
          className="p-2 hover:bg-surface-container transition-colors relative cursor-pointer flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          {riskCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full"></span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          className="p-2 hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-4 ml-2 border-l border-border-subtle">
          <div className="text-right hidden sm:block">
            <div className="font-body-sm text-on-surface font-semibold leading-tight">
              {userName}
            </div>
            <div className="font-label-caps text-[10px] text-text-secondary uppercase">
              {userRole}
            </div>
          </div>

          <img
            alt={userName}
            className="w-10 h-10 rounded-full object-cover border border-border-subtle"
            src={userAvatar}
            onError={(e) => {
              e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName) + '&background=000&color=fff';
            }}
          />
        </div>
      </div>
    </header>
  );
}
