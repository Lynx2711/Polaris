import { useNavigate } from 'react-router-dom';

export default function Sidebar({ activeTab, onTabChange }) {
  const navigate = useNavigate();

  const navItems = [
    { id: 'overview',   icon: 'dashboard',      label: 'Overview' },
    { id: 'map',        icon: 'map',            label: 'Map' },
    { id: 'drivers',    icon: 'local_shipping', label: 'Drivers' },
    { id: 'analytics',  icon: 'analytics',      label: 'Analytics' },
  ];

  return (
    <aside className="bg-surface-gray fixed left-0 top-16 h-[calc(100vh-64px)] w-20 flex flex-col items-center py-6 gap-5 border-r border-border-subtle z-40 hidden md:flex select-none shadow-xl shadow-slate-900/5 dark:shadow-black/60">
      {navItems.map((item) => {
        const isActive = activeTab === item.id || (item.id === 'overview' && activeTab === 'drivers');
        return (
          <button
            key={item.id}
            onClick={() => onTabChange?.(item.id)}
            title={item.label}
            className={`group flex flex-col items-center cursor-pointer p-3 rounded-2xl transition-all duration-200 active:scale-95 shadow-sm ${
              isActive
                ? 'bg-primary text-on-primary shadow-md shadow-primary/30 ring-2 ring-primary/20'
                : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary hover:shadow-md'
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
          </button>
        );
      })}

      <button
        onClick={() => navigate('/profile')}
        title="Settings"
        className="mt-auto group flex flex-col items-center cursor-pointer p-3 rounded-2xl text-on-surface-variant hover:bg-surface-container-highest hover:text-primary transition-all duration-200 active:scale-95 hover:shadow-md border border-transparent hover:border-border-subtle"
      >
        <span className="material-symbols-outlined">settings</span>
      </button>
    </aside>
  );
}

