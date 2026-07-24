import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Shield, 
  Activity, 
  Users, 
  LogOut, 
  Plus, 
  X, 
  ChevronRight, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { getOrganizations, createOrganization } from '../services/api';
import PolarisLogo from '../components/PolarisLogo';

export default function PlatformAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states for creating a new org
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Fetch all organizations
  const fetchOrgs = async () => {
    setIsLoading(true);
    try {
      const data = await getOrganizations();
      setOrganizations(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
      setError('Could not load organizations list. Make sure the API server is online.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If not logged in, redirect to login page
    if (!user) {
      navigate('/login?portal=platform-admin');
      return;
    }
    fetchOrgs();
  }, [user]);

  // Handle auto-generation of slug from organization name
  const handleNameChange = (e) => {
    const val = e.target.value;
    setNewOrgName(val);
    // Convert to lowercase, replace spaces/special chars with hyphens
    const slugSuggestion = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setNewOrgSlug(slugSuggestion);
  };

  // Submit form to create org
  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      await createOrganization({
        name: newOrgName,
        slug: newOrgSlug,
        adminName,
        adminEmail,
        adminPassword
      });
      
      setFormSuccess(true);
      setNewOrgName('');
      setNewOrgSlug('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      
      // Refresh list
      await fetchOrgs();
      
      // Close modal after delay
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(false);
      }, 1500);

    } catch (err) {
      console.error('Error creating organization:', err);
      const errMsg = err.response?.data?.error || 'Failed to create organization. Slug or Admin email might already be taken.';
      setFormError(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login?portal=platform-admin');
  };

  // Compute stats metrics dynamically
  const stats = {
    totalTenants: organizations.length,
    totalDrivers: organizations.reduce((acc, curr) => acc + parseInt(curr.driver_count || 0), 0),
    totalRoutes: organizations.reduce((acc, curr) => acc + parseInt(curr.route_count || 0), 0),
    platformUptime: '99.98%'
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] flex flex-col font-sans relative overflow-hidden">
      {/* Background Dot Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] opacity-100 z-1" />

      {/* Header bar */}
      <header className="h-16 bg-[#0D0D0D] border-b border-[#222] px-6 flex items-center justify-between shrink-0 select-none z-10 relative">
        <div className="flex items-center gap-3">
          <PolarisLogo size={28} dark={true} loop={true} showWord={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-widest text-sm uppercase">POLARIS</span>
              <span className="text-[9px] font-mono bg-[#1C1917] text-[#A8A29E] px-1.5 py-0.5 border border-[#444] rounded-sm">
                ADMIN CONSOLE
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right text-xs font-mono hidden sm:block">
            <p className="text-white font-medium">{user?.name || 'Administrator'}</p>
            <p className="text-[#8C8C8C] text-[10px]">{user?.email}</p>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#141414] hover:bg-[#221212] text-[#A0A0A0] hover:text-red-400 border border-[#2A2A2A] hover:border-red-900/50 transition cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Console Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full z-10 relative overflow-y-auto">
        <div className="flex flex-col gap-6">
          
          {/* Section title & Action button */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Platform Control Dashboard</h1>
              <p className="text-xs text-[#8C8C8C]">Monitor system infrastructure, optimize tenant limits, and provision new workspaces.</p>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-semibold bg-white hover:bg-neutral-200 text-[#0A0A0A] border border-white transition rounded-sm cursor-pointer shadow-md"
            >
              <Plus size={14} />
              <span>PROVISION TENANT</span>
            </button>
          </div>

          {/* Stats Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tenants card */}
            <div className="bg-[#121212] border border-[#222] p-5 rounded-sm relative overflow-hidden flex flex-col justify-between min-h-[100px]">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-mono uppercase tracking-wider">Active Organizations</span>
                <Building2 size={18} className="text-[#38BDF8]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white font-mono">{stats.totalTenants}</span>
              </div>
            </div>

            {/* Drivers card */}
            <div className="bg-[#121212] border border-[#222] p-5 rounded-sm relative overflow-hidden flex flex-col justify-between min-h-[100px]">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-mono uppercase tracking-wider">Managed Fleet Drivers</span>
                <Users size={18} className="text-[#FBBF24]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white font-mono">{stats.totalDrivers}</span>
              </div>
            </div>

            {/* Routes card */}
            <div className="bg-[#121212] border border-[#222] p-5 rounded-sm relative overflow-hidden flex flex-col justify-between min-h-[100px]">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-mono uppercase tracking-wider">Optimized Routes</span>
                <TrendingUp size={18} className="text-[#34D399]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white font-mono">{stats.totalRoutes}</span>
              </div>
            </div>

            {/* Uptime card */}
            <div className="bg-[#121212] border border-[#222] p-5 rounded-sm relative overflow-hidden flex flex-col justify-between min-h-[100px]">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-mono uppercase tracking-wider">Infrastructure Uptime</span>
                <Activity size={18} className="text-[#A78BFA]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white font-mono">{stats.platformUptime}</span>
              </div>
            </div>
          </div>

          {/* Error Message if fetch failed */}
          {error && (
            <div className="bg-[#1A1111] border border-red-900/50 p-4 text-xs font-mono text-red-400 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tenants List view */}
          <div className="bg-[#121212] border border-[#222] rounded-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">Registered Organizations</span>
              <button 
                onClick={fetchOrgs} 
                className="text-[10px] font-mono text-[#8C8C8C] hover:text-white transition cursor-pointer"
              >
                REFRESH LIST
              </button>
            </div>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-mono text-[#8C8C8C]">Loading tenant information...</p>
              </div>
            ) : organizations.length === 0 ? (
              <div className="py-20 text-center text-[#8C8C8C] font-mono text-xs">
                No organizations registered on the platform. Click "Provision Tenant" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-[#0A0A0A] border-b border-[#222] text-[#8C8C8C]">
                      <th className="px-5 py-3 font-semibold">Organization Name</th>
                      <th className="px-5 py-3 font-semibold">URL Slug</th>
                      <th className="px-5 py-3 font-semibold">Tier Plan</th>
                      <th className="px-5 py-3 font-semibold text-center">Users</th>
                      <th className="px-5 py-3 text-center font-semibold">Drivers</th>
                      <th className="px-5 py-3 text-center font-semibold">Routes</th>
                      <th className="px-5 py-3 font-semibold">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizations.map((org) => (
                      <tr key={org.id} className="border-b border-[#222]/50 hover:bg-[#181818] transition">
                        <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                          <Building2 size={14} className="text-[#8C8C8C]" />
                          <span>{org.name}</span>
                        </td>
                        <td className="px-5 py-3.5 text-neutral-400">/{org.slug}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wide font-semibold rounded-sm border ${
                            org.plan === 'enterprise' 
                              ? 'bg-[#1E1B4B] text-indigo-400 border-indigo-900/50' 
                              : org.plan === 'pro' 
                              ? 'bg-[#022c22] text-teal-400 border-teal-900/50' 
                              : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                          }`}>
                            {org.plan}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-white">{org.user_count}</td>
                        <td className="px-5 py-3.5 text-center text-white">{org.driver_count}</td>
                        <td className="px-5 py-3.5 text-center text-white">{org.route_count}</td>
                        <td className="px-5 py-3.5 text-neutral-500">
                          {new Date(org.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Provision Organization Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#121212] border border-[#2A2A2A] w-full max-w-md rounded-sm overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-[#222] flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-white flex items-center gap-1.5">
                <Shield size={14} className="text-[#38BDF8]" />
                <span>Provision Organization</span>
              </span>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="p-5 flex flex-col gap-4 font-mono text-xs">
              
              {formError && (
                <div className="bg-[#1A1111] border border-red-900/50 p-3 text-red-400 flex items-start gap-2 rounded-sm">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="bg-[#051F15] border border-emerald-900/50 p-3 text-emerald-400 flex items-center gap-2 rounded-sm">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>Tenant provisioned successfully!</span>
                </div>
              )}

              {/* Company Section */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-[#222] pb-1">
                  1. Workspace Configuration
                </h4>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-neutral-400">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rapid Delivery Systems"
                    value={newOrgName}
                    onChange={handleNameChange}
                    className="bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-2 text-white outline-none focus:border-[#444] rounded-sm transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-neutral-400">URL Route Slug</label>
                  <div className="flex items-center">
                    <span className="bg-[#1A1A1A] border border-r-0 border-[#2A2A2A] px-2.5 py-2 text-[#8C8C8C] rounded-l-sm select-none">
                      /
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="rapid-delivery"
                      value={newOrgSlug}
                      onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-2 text-white outline-none focus:border-[#444] rounded-r-sm flex-1 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Section */}
              <div className="flex flex-col gap-3 mt-2">
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-[#222] pb-1">
                  2. Administrator Details
                </h4>

                <div className="flex flex-col gap-1.5">
                  <label className="text-neutral-400">Admin Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-2 text-white outline-none focus:border-[#444] rounded-sm transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-neutral-400">Admin Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@comp.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-2 text-white outline-none focus:border-[#444] rounded-sm transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-neutral-400">Admin Initial Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-2 text-white outline-none focus:border-[#444] rounded-sm transition"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                  className="px-4 py-2 border border-[#2A2A2A] hover:bg-neutral-900 text-neutral-400 hover:text-white rounded-sm cursor-pointer disabled:opacity-50"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-white hover:bg-neutral-200 text-[#0A0A0A] font-semibold border border-white rounded-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 min-w-[120px]"
                >
                  {formLoading ? (
                    <div className="w-4 h-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>CONFIRM</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
