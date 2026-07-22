import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Route, Users, Package, Truck, BarChart3, Map, User } from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Routes', path: '#', icon: Route },
  { label: 'Drivers', path: '#', icon: Users },
  { label: 'Orders', path: '#', icon: Package },
  { label: 'Vehicles', path: '#', icon: Truck },
  { label: 'Analytics', path: '#', icon: BarChart3 },
  { label: 'Map', path: '#', icon: Map },
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-200/80 bg-slate-50/50 p-4 flex flex-col justify-between shrink-0 select-none hidden md:flex">
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-3 mb-3">Menu</p>
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isDummy = item.path === '#';

          return (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={(e) => {
                if (isDummy) e.preventDefault();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${
                  isActive && !isDummy
                    ? 'bg-blue-50 text-[#2563EB]'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                } ${isDummy ? 'opacity-80 cursor-default' : ''}`
              }
            >
              <Icon size={18} />
              {item.label}
              {isDummy && (
                <span className="ml-auto text-[8px] font-bold tracking-widest text-slate-400 bg-slate-200/40 px-1.5 py-0.5 rounded uppercase">
                  Lock
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="border-t border-slate-200/80 pt-4 font-sans">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${
              isActive
                ? 'bg-blue-50 text-[#2563EB]'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`
          }
        >
          <User size={18} />
          Profile Settings
        </NavLink>
      </div>
    </aside>
  );
}
