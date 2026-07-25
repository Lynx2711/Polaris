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
    <aside className="bg-surface-gray fixed left-0 top-16 h-[calc(100vh-64px)] w-20 flex flex-col items-center py-6 gap-4 border-r border-border-subtle z-40 hidden md:flex select-none">
      {navItems.map((item) => {
        const isActive = activeTab === item.id || (item.id === 'overview' && activeTab === 'drivers');
        return (
          <button
            key={item.id}
            onClick={() => onTabChange?.(item.id)}
            title={item.label}
            className={`group flex flex-col items-center cursor-pointer p-2 transition-all active:scale-95 ${
              isActive
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
          </button>
        );
      })}

      <button
        onClick={() => navigate('/profile')}
        title="Settings"
        className="mt-auto group flex flex-col items-center cursor-pointer p-2 text-on-surface-variant hover:bg-surface-container-highest transition-all active:scale-95"
      >
        <span className="material-symbols-outlined">settings</span>
      </button>
    </aside>
  );
}
