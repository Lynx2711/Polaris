import useAuth from '../hooks/useAuth';
import PolarisLogo from './PolarisLogo';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <nav className="h-16 border-b border-slate-200/80 bg-white px-6 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-3 cursor-pointer animate-fade-in" onClick={() => navigate('/dashboard')}>
        <PolarisLogo size={28} dark={false} loop={true} showWord={true} wordClass="text-lg" />
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div 
            onClick={() => navigate('/profile')} 
            className="flex items-center gap-3 border-r border-slate-100 pr-4 cursor-pointer group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB]/10 to-[#00D4FF]/10 border border-[#2563EB]/10 group-hover:from-[#2563EB]/15 group-hover:to-[#00D4FF]/15 transition-all">
              <UserIcon size={16} className="text-[#2563EB]" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-none group-hover:text-[#2563EB] transition-colors">{user.fullName || 'User'}</p>
              <p className="text-[10px] font-semibold text-slate-400 capitalize mt-0.5">{user.role || 'Member'}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:text-red-500 cursor-pointer"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
}
