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
  Search,
  CheckCircle2, 
  AlertCircle,
  Database,
  Cpu,
  Wifi,
  HardDrive,
  FileText,
  Settings,
  Bell,
  Lock,
  Download,
  Trash2,
  Edit2,
  Power,
  RotateCw,
  TrendingUp,
  Sliders,
  Play,
  ArrowRight
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { getOrganizations, createOrganization } from '../services/api';
import PolarisLogo from '../components/PolarisLogo';

export default function PlatformAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Tab state: 'overview' | 'organizations' | 'users' | 'analytics' | 'health' | 'logs' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected organization for Details view
  const [selectedOrg, setSelectedOrg] = useState(null);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'admin' | 'dispatcher' | 'driver'

  // Modal states
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
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
      setError('Could not load organizations. Ensure API is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login?portal=platform-admin');
      return;
    }
    fetchOrgs();
  }, [user]);

  // Handle auto-generation of slug
  const handleNameChange = (e) => {
    const val = e.target.value;
    setNewOrgName(val);
    const slugSuggestion = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setNewOrgSlug(slugSuggestion);
  };

  // Create new organization
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
      
      await fetchOrgs();
      setTimeout(() => {
        setIsProvisionModalOpen(false);
        setFormSuccess(false);
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create organization.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login?portal=platform-admin');
  };

  // Mock users list derived/compiled from organizations & custom profiles
  const users = [
    { id: 1, name: 'John Doe', email: 'dispatcher@fastcouriers.com', role: 'dispatcher', orgName: 'Fast Couriers Jalandhar', status: 'active' },
    { id: 2, name: 'Ashniya Aloysius', email: 'ashniyaalosious@gmail.com', role: 'admin', orgName: 'Metro Cargo', status: 'active' },
    { id: 3, name: 'Gurjit Sharma', email: 'gurjit@fastcouriers.com', role: 'driver', orgName: 'Fast Couriers Jalandhar', status: 'active' },
    { id: 4, name: 'Polaris Platform Admin', email: 'admin@polaris.com', role: 'superadmin', orgName: 'Global Control', status: 'active' },
    { id: 5, name: 'Harish Verma', email: 'harish@metrocargo.com', role: 'driver', orgName: 'Metro Cargo', status: 'suspended' },
    { id: 6, name: 'Sarah Connor', email: 'sarah@swift.com', role: 'dispatcher', orgName: 'SwiftExpress', status: 'active' }
  ];

  // Filtered users list
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.orgName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Action mock handlers
  const handleToggleOrgStatus = (orgId, currentStatus) => {
    setOrganizations(prev => prev.map(o => o.id === orgId ? { ...o, plan: currentStatus === 'suspended' ? 'pro' : 'suspended' } : o));
  };

  const handleDeleteOrg = (orgId) => {
    if (window.confirm('Are you sure you want to delete this organization? All tenant data will be permanently wiped.')) {
      setOrganizations(prev => prev.filter(o => o.id !== orgId));
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#E5E5E5] flex flex-col font-sans relative overflow-hidden select-none">
      
      {/* Background radial glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_0%,transparent_70%)] pointer-events-none" />

      {/* Premium Top Navigation Bar */}
      <header className="h-16 bg-[#0E0E0E]/80 backdrop-blur-md border-b border-white/5 px-8 flex items-center justify-between shrink-0 z-20 relative">
        <div className="flex items-center gap-3">
          <PolarisLogo size={28} dark={true} loop={true} showWord={false} />
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-[0.2em] text-sm font-mono">POLARIS</span>
            <span className="text-[9px] font-mono bg-white/5 text-white/70 px-2 py-0.5 border border-white/10 rounded-full">
              CONSOLE
            </span>
          </div>
        </div>

        {/* Search Bar matching mock header */}
        <div className="hidden md:flex items-center bg-[#151515] border border-white/5 rounded-full px-4.5 py-1.5 w-80 text-xs text-white/50 focus-within:border-white/20 transition-all">
          <Search size={14} className="mr-2" />
          <input 
            type="text" 
            placeholder="Search system console..." 
            className="bg-transparent border-none outline-none text-white w-full placeholder-white/20"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right text-xs font-mono hidden sm:block">
            <p className="text-white font-medium">{user?.name || 'Platform Administrator'}</p>
            <p className="text-white/40 text-[9px] tracking-wider uppercase">ROOT_ADMIN</p>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono bg-white/5 hover:bg-red-500/10 text-white/60 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all rounded-full cursor-pointer"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Layout containing Sidebar and Tab Panels */}
      <div className="flex-1 flex overflow-hidden z-10 relative">
        
        {/* Vertical Sidebar */}
        <aside className="w-64 bg-[#0B0B0B] border-r border-white/5 flex flex-col shrink-0">
          <nav className="flex-1 py-6 px-4 flex flex-col gap-1.5">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: Sliders },
              { id: 'organizations', label: 'Organizations', icon: Building2 },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'analytics', label: 'Platform Analytics', icon: Activity },
              { id: 'health', label: 'System Health', icon: Wifi },
              { id: 'logs', label: 'Activity Logs', icon: FileText },
              { id: 'settings', label: 'Platform Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedOrg(null); // Reset detail screen
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-mono tracking-wider transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white/5 border border-white/10 text-white font-bold shadow-[0_0_15px_rgba(255,255,255,0.02)]'
                      : 'text-white/40 hover:text-white hover:bg-white/2 border border-transparent'
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-white/5 text-[10px] font-mono text-white/20 text-center">
            Polaris System v2.4.1
          </div>
        </aside>

        {/* Tab Content Panel */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#080808]">
          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            
            {/* ── 1. DASHBOARD OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-8 animate-fade-in">
                
                {/* Header title */}
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight font-mono">Welcome Back, Platform Admin</h1>
                  <p className="text-xs text-white/40 mt-1">Enterprise management dashboard overview.</p>
                </div>

                {/* Glassmorphic KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Organizations', value: '12', color: 'border-white/10 hover:border-white/20' },
                    { label: 'Company Admins', value: '15', color: 'border-white/10 hover:border-white/20' },
                    { label: 'Active Drivers', value: '248', color: 'border-white/10 hover:border-white/20' },
                    { label: 'Today\'s Orders', value: '1,254', color: 'border-white/10 hover:border-white/20' },
                    { label: 'Platform Uptime', value: '99.98%', color: 'border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400' },
                    { label: 'Active Sessions', value: '183', color: 'border-white/10 hover:border-white/20' }
                  ].map((kpi, idx) => (
                    <div 
                      key={idx} 
                      className={`bg-white/2 backdrop-blur-md border ${kpi.color} p-4.5 rounded-2xl flex flex-col justify-between h-24 transition-all duration-300`}
                    >
                      <span className="text-[10px] uppercase tracking-widest font-mono text-white/30">{kpi.label}</span>
                      <span className="text-2xl font-bold font-mono tracking-tight text-white">{kpi.value}</span>
                    </div>
                  ))}
                </div>

                {/* Subcontent row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Recent Activity Card */}
                  <div className="lg:col-span-2 bg-white/2 border border-white/5 backdrop-blur-md rounded-2xl p-6">
                    <h2 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-5">Recent Platform Activity</h2>
                    <div className="flex flex-col gap-4">
                      {[
                        { time: '09:25', desc: 'Metro Cargo workspace provisioned successfully.', icon: CheckCircle2, status: 'success' },
                        { time: '09:31', desc: 'FlashGo Logistics added 5 active fleet drivers.', icon: Activity, status: 'info' },
                        { time: '09:40', desc: 'SwiftExpress workspace suspended due to billing.', icon: AlertCircle, status: 'error' },
                        { time: '10:02', desc: 'New administrative account created for Jalandhar hub.', icon: Shield, status: 'success' },
                        { time: '10:14', desc: '98 route optimizations completed across all tenants.', icon: RotateCw, status: 'info' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-4 text-xs font-mono text-white/70">
                          <span className="text-white/30 text-[10px] pt-0.5">{item.time}</span>
                          <span className="text-white/20">|</span>
                          <item.icon size={14} className={`mt-0.5 ${
                            item.status === 'success' ? 'text-emerald-400' : item.status === 'error' ? 'text-red-400' : 'text-blue-400'
                          }`} />
                          <span className="flex-1">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick System Health status */}
                  <div className="bg-white/2 border border-white/5 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <h2 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-5">Quick Infrastructure Status</h2>
                      <div className="flex flex-col gap-3">
                        {[
                          { label: 'Node API Server', status: 'Healthy', color: 'text-emerald-400 bg-emerald-500/10' },
                          { label: 'FastAPI Solver', status: 'Healthy', color: 'text-emerald-400 bg-emerald-500/10' },
                          { label: 'OSRM Route Server', status: 'Healthy', color: 'text-emerald-400 bg-emerald-500/10' },
                          { label: 'System Database', status: 'Connected', color: 'text-emerald-400 bg-emerald-500/10' }
                        ].map((srv, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs font-mono">
                            <span className="text-white/50">{srv.label}</span>
                            <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold uppercase tracking-wider ${srv.color}`}>
                              {srv.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('health')}
                      className="mt-6 w-full flex items-center justify-center gap-1.5 py-2.5 bg-white text-[#0A0A0A] font-bold font-mono text-xs rounded-xl hover:bg-neutral-200 transition-all cursor-pointer"
                    >
                      <span>VIEW SYSTEM DIAGNOSTICS</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ── 2. ORGANIZATIONS TAB ── */}
            {activeTab === 'organizations' && !selectedOrg && (
              <div className="flex flex-col gap-6 animate-fade-in">
                
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold font-mono text-white">Platform Tenant Workspace Management</h1>
                    <p className="text-xs text-white/40 mt-1">Manage tenant configurations, subscriptions, and administrative access.</p>
                  </div>
                  
                  <button
                    onClick={() => setIsProvisionModalOpen(true)}
                    className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-mono font-semibold bg-white hover:bg-neutral-200 text-[#0A0A0A] border border-white transition-all rounded-xl cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>ADD ORGANIZATION</span>
                  </button>
                </div>

                {/* Organizations table */}
                <div className="bg-white/2 border border-white/5 backdrop-blur-md rounded-2xl overflow-hidden flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-mono text-xs">
                      <thead>
                        <tr className="bg-white/2 border-b border-white/5 text-white/40">
                          <th className="px-6 py-4 font-semibold">Workspace Name</th>
                          <th className="px-6 py-4 font-semibold">URL Route</th>
                          <th className="px-6 py-4 font-semibold text-center">Drivers</th>
                          <th className="px-6 py-4 font-semibold text-center">Routes</th>
                          <th className="px-6 py-4 font-semibold">Tier Plan</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {organizations.map((org) => (
                          <tr key={org.id} className="border-b border-white/2 hover:bg-white/1 transition-all">
                            <td className="px-6 py-4.5 font-bold text-white flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white text-[10px]">
                                {org.name.slice(0, 2).toUpperCase()}
                              </div>
                              <span 
                                onClick={() => setSelectedOrg(org)}
                                className="cursor-pointer hover:underline"
                              >
                                {org.name}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 text-white/50">/{org.slug}</td>
                            <td className="px-6 py-4.5 text-center text-white">{org.driver_count || 0}</td>
                            <td className="px-6 py-4.5 text-center text-white">{org.route_count || 0}</td>
                            <td className="px-6 py-4.5">
                              <span className="px-2 py-0.5 text-[9px] border border-white/10 bg-white/5 text-white/70 uppercase rounded-sm">
                                {org.plan || 'free'}
                              </span>
                            </td>
                            <td className="px-6 py-4.5">
                              <span className={`px-2.5 py-0.5 text-[9px] rounded-full font-bold uppercase tracking-wider ${
                                org.plan === 'suspended' ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'
                              }`}>
                                {org.plan === 'suspended' ? 'Suspended' : 'Active'}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 flex items-center gap-2">
                              <button 
                                onClick={() => setSelectedOrg(org)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-white transition-all cursor-pointer"
                                title="View details"
                              >
                                <Search size={12} />
                              </button>
                              <button 
                                onClick={() => handleToggleOrgStatus(org.id, org.plan === 'suspended' ? 'suspended' : 'active')}
                                className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-white transition-all cursor-pointer"
                                title={org.plan === 'suspended' ? 'Activate Tenant' : 'Suspend Tenant'}
                              >
                                <Power size={12} className={org.plan === 'suspended' ? 'text-emerald-400' : 'text-red-400'} />
                              </button>
                              <button 
                                onClick={() => handleDeleteOrg(org.id)}
                                className="p-1.5 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded-lg text-white/60 hover:text-red-400 transition-all cursor-pointer"
                                title="Delete Tenant"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ── 2b. DETAILED ORGANIZATION VIEW ── */}
            {activeTab === 'organizations' && selectedOrg && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <button
                  onClick={() => setSelectedOrg(null)}
                  className="w-fit flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <span>← Back to organizations list</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left detail card */}
                  <div className="bg-white/2 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold text-white">
                        {selectedOrg.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white font-mono">{selectedOrg.name}</h2>
                        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">TENANT_WORKSPACE</span>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4 flex flex-col gap-2 text-xs font-mono">
                      <div className="flex justify-between"><span className="text-white/40">URL Slug</span><span className="text-white">/{selectedOrg.slug}</span></div>
                      <div className="flex justify-between"><span className="text-white/40">Tier Plan</span><span className="text-white uppercase">{selectedOrg.plan || 'free'}</span></div>
                      <div className="flex justify-between"><span className="text-white/40">Created At</span><span className="text-white">{new Date(selectedOrg.created_at).toLocaleDateString()}</span></div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Status</span>
                        <span className={`font-bold ${selectedOrg.plan === 'suspended' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {selectedOrg.plan === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats & nested views */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/2 border border-white/5 p-4 rounded-xl text-center">
                        <p className="text-[10px] font-mono uppercase text-white/30">Drivers</p>
                        <p className="text-2xl font-bold font-mono mt-1 text-white">{selectedOrg.driver_count || 0}</p>
                      </div>
                      <div className="bg-white/2 border border-white/5 p-4 rounded-xl text-center">
                        <p className="text-[10px] font-mono uppercase text-white/30">Users</p>
                        <p className="text-2xl font-bold font-mono mt-1 text-white">{selectedOrg.user_count || 0}</p>
                      </div>
                      <div className="bg-white/2 border border-white/5 p-4 rounded-xl text-center">
                        <p className="text-[10px] font-mono uppercase text-white/30">Optimized Routes</p>
                        <p className="text-2xl font-bold font-mono mt-1 text-white">{selectedOrg.route_count || 0}</p>
                      </div>
                    </div>

                    <div className="bg-white/2 border border-white/5 rounded-2xl p-6">
                      <h3 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-4">Workspace Administrators</h3>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs font-mono p-3 bg-white/2 border border-white/5 rounded-xl">
                          <div>
                            <p className="text-white font-bold">Admin Member</p>
                            <p className="text-white/40 text-[10px] mt-0.5">Primary Administrator Account</p>
                          </div>
                          <span className="text-white/50">Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ── 3. USER MANAGEMENT TAB ── */}
            {activeTab === 'users' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                
                <div>
                  <h1 className="text-2xl font-bold font-mono text-white">Unified System Users Directory</h1>
                  <p className="text-xs text-white/40 mt-1">Monitor credentials, suspend platform log-ins, and assign user roles.</p>
                </div>

                {/* Filter and search controls */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  
                  {/* Tabs */}
                  <div className="flex bg-[#121212] p-1 border border-white/5 rounded-xl text-xs font-mono shrink-0">
                    {[
                      { id: 'all', label: 'All Users' },
                      { id: 'admin', label: 'Company Admins' },
                      { id: 'dispatcher', label: 'Dispatchers' },
                      { id: 'driver', label: 'Drivers' },
                      { id: 'superadmin', label: 'Platform Admins' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setRoleFilter(tab.id)}
                        className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                          roleFilter === tab.id
                            ? 'bg-white text-[#0A0A0A] font-bold'
                            : 'text-white/40 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="flex items-center bg-[#121212] border border-white/5 rounded-xl px-4 py-2 w-full md:w-72 text-xs">
                    <Search size={14} className="text-white/30 mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="Filter directory..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-white w-full placeholder-white/20"
                    />
                  </div>
                </div>

                {/* Users Directory Table */}
                <div className="bg-white/2 border border-white/5 backdrop-blur-md rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="bg-white/2 border-b border-white/5 text-white/40">
                        <th className="px-6 py-4 font-semibold">User Profile</th>
                        <th className="px-6 py-4 font-semibold">Associated Workspace</th>
                        <th className="px-6 py-4 font-semibold">Role Tier</th>
                        <th className="px-6 py-4 font-semibold">Access Status</th>
                        <th className="px-6 py-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="border-b border-white/2 hover:bg-white/1 transition-all">
                          <td className="px-6 py-4.5">
                            <p className="font-bold text-white">{u.name}</p>
                            <p className="text-white/40 text-[10px] mt-0.5">{u.email}</p>
                          </td>
                          <td className="px-6 py-4.5 text-white/60">{u.orgName}</td>
                          <td className="px-6 py-4.5">
                            <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wide font-semibold rounded-sm border ${
                              u.role === 'superadmin' 
                                ? 'bg-purple-500/10 text-purple-400 border-purple-900/50' 
                                : u.role === 'admin' 
                                ? 'bg-blue-500/10 text-blue-400 border-blue-900/50' 
                                : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4.5">
                            <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold uppercase tracking-wider ${
                              u.status === 'active' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 flex items-center gap-2">
                            <button 
                              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] rounded-lg text-white transition-all cursor-pointer font-bold"
                              onClick={() => alert(`Reset link dispatched for ${u.email}`)}
                            >
                              RESET PASS
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* ── 4. PLATFORM ANALYTICS TAB ── */}
            {activeTab === 'analytics' && (
              <div className="flex flex-col gap-8 animate-fade-in">
                
                <div>
                  <h1 className="text-2xl font-bold font-mono text-white">Overall Platform Usage Metrics</h1>
                  <p className="text-xs text-white/40 mt-1">Global statistics, optimization runs, and fleet performance aggregates.</p>
                </div>

                {/* Stat grid */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Organizations', value: '12' },
                    { label: 'Total Drivers', value: '248' },
                    { label: 'Total Orders', value: '18,521' },
                    { label: 'Active Vehicles', value: '154' },
                    { label: 'Optimizations Run', value: '1,482' },
                    { label: 'Total Active Users', value: '482' }
                  ].map((c, idx) => (
                    <div key={idx} className="bg-white/2 border border-white/5 p-4 rounded-xl text-center">
                      <p className="text-[10px] font-mono uppercase text-white/30">{c.label}</p>
                      <p className="text-2xl font-bold font-mono mt-1 text-white">{c.value}</p>
                    </div>
                  ))}
                </div>

                {/* SVG Graph rendering */}
                <div className="bg-white/2 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-5">Weekly Route Optimizations Chart</h3>
                  
                  <div className="w-full h-64 relative flex items-end">
                    
                    {/* SVG Line path chart */}
                    <svg viewBox="0 0 500 150" className="w-full h-full text-white" stroke="currentColor" fill="none">
                      <path 
                        d="M 0 130 L 80 110 L 160 125 L 240 85 L 320 90 L 400 45 L 480 30" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                      />
                      
                      {/* Grid background lines */}
                      <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 3" />
                    </svg>

                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-white/20 mt-4">
                    <span>MON</span>
                    <span>TUE</span>
                    <span>WED</span>
                    <span>THU</span>
                    <span>FRI</span>
                    <span>SAT</span>
                    <span>SUN</span>
                  </div>
                </div>

              </div>
            )}

            {/* ── 5. SYSTEM HEALTH TAB ── */}
            {activeTab === 'health' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                
                <div>
                  <h1 className="text-2xl font-bold font-mono text-white">System Diagnostics & Platform Health</h1>
                  <p className="text-xs text-white/40 mt-1">Real-time status tracking of container servers, load balancing, and database clusters.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { label: 'Node API Backend', desc: 'Standard REST API endpoints and socket servers.', status: 'Healthy', icon: Cpu, health: 'good' },
                    { label: 'FastAPI Routing Solver', desc: 'CVRPTW Optimization backend (OR-Tools engine).', status: 'Healthy', icon: RotateCw, health: 'good' },
                    { label: 'OSRM Route Server', desc: 'Self-hosted Open Source Routing Machine maps.', status: 'Running', icon: TrendingUp, health: 'good' },
                    { label: 'Postgres Database Cluster', desc: 'Primary transactional system database.', status: 'Connected', icon: Database, health: 'good' },
                    { label: 'Live Socket Engine', desc: 'Bidirectional updates for vehicle positioning.', status: 'Connected', icon: Wifi, health: 'good' },
                    { label: 'System Disk Storage', desc: 'Local drive cluster for cached tiles and databases.', status: '78% Disk Space', icon: HardDrive, health: 'warning' }
                  ].map((srv, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white/2 border border-white/5 rounded-2xl p-6 flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                            <srv.icon size={18} />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-white font-mono">{srv.label}</h3>
                            <p className="text-[10px] text-white/30 font-mono mt-0.5">{srv.desc}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                        <span className="text-[10px] font-mono text-white/20">DIAGNOSTIC STATUS</span>
                        <span className={`px-2.5 py-0.5 text-[9px] rounded-full font-bold uppercase tracking-wider ${
                          srv.health === 'good' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                        }`}>
                          {srv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* ── 6. ACTIVITY LOGS TAB ── */}
            {activeTab === 'logs' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                
                <div>
                  <h1 className="text-2xl font-bold font-mono text-white">Platform System Audit Trail</h1>
                  <p className="text-xs text-white/40 mt-1">Raw audit records showing administrative API requests, security actions, and logins.</p>
                </div>

                <div className="bg-white/2 border border-white/5 backdrop-blur-md rounded-2xl p-6">
                  <div className="flex flex-col gap-5">
                    {[
                      { actor: 'admin@polaris.com', action: 'Created Company Workspace: Metro Cargo', time: '11:23 AM', ip: '192.168.1.45' },
                      { actor: 'dispatcher@fastcouriers.com', action: 'Initiated CVRPTW Solver Run ID: #302', time: '11:15 AM', ip: '192.168.1.189' },
                      { actor: 'admin@polaris.com', action: 'Suspended Workspace: SwiftExpress', time: '10:45 AM', ip: '192.168.1.45' },
                      { actor: 'admin@polaris.com', action: 'Authorized Platform Admin Token reset', time: '10:02 AM', ip: '192.168.1.45' },
                      { actor: 'gurjit@fastcouriers.com', action: 'Joined active tracking feed session', time: '09:55 AM', ip: '103.24.45.92' }
                    ].map((log, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/2 pb-4 last:border-0 last:pb-0 font-mono text-xs">
                        <div>
                          <p className="text-white font-bold">{log.actor}</p>
                          <p className="text-white/50 text-[10px] mt-0.5">{log.action}</p>
                        </div>
                        <div className="text-right text-[10px] text-white/30 flex md:flex-col gap-2 md:gap-0 mt-1 md:mt-0">
                          <span>{log.time}</span>
                          <span className="hidden md:inline">{log.ip}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ── 7. PLATFORM SETTINGS TAB ── */}
            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                
                <div className="lg:col-span-2 bg-white/2 border border-white/5 rounded-2xl p-6 flex flex-col gap-6">
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">General Platform Settings</h2>
                  
                  <div className="flex flex-col gap-4 font-mono text-xs">
                    
                    {/* Input name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-white/40">Platform Display Name</label>
                      <input 
                        type="text" 
                        defaultValue="Polaris Logistics Platform" 
                        className="bg-[#0A0A0A] border border-white/5 px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-white/25 transition-all"
                      />
                    </div>

                    {/* Secret key */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-white/40">JWT Authorization Token Secret</label>
                      <input 
                        type="password" 
                        defaultValue="polaris_super_secret_jwt_key_12345" 
                        disabled
                        className="bg-[#121212] border border-white/5 px-3.5 py-2.5 rounded-xl text-white/40 outline-none select-none"
                      />
                    </div>

                    {/* Maintenance mode toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/2 border border-white/5 rounded-xl mt-4">
                      <div>
                        <p className="text-white font-bold">Platform Maintenance Mode</p>
                        <p className="text-[10px] text-white/30 mt-0.5">Suspend login portals and show holding page.</p>
                      </div>
                      
                      <button className="w-12 h-6 bg-white/5 border border-white/10 rounded-full p-1 relative transition-all duration-300">
                        <div className="w-4 h-4 bg-white/40 rounded-full transition-all" />
                      </button>
                    </div>

                  </div>
                </div>

                <div className="bg-white/2 border border-white/5 rounded-2xl p-6 flex flex-col gap-6">
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">Platform Actions</h2>
                  
                  <div className="flex flex-col gap-3 font-mono text-xs">
                    <button 
                      onClick={() => alert('FastAPI Solver Server restarted successfully.')}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all cursor-pointer"
                    >
                      <span>Restart Solver Service</span>
                      <RotateCw size={13} className="text-white/50" />
                    </button>

                    <button 
                      onClick={() => alert('All system cache cleared successfully.')}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all cursor-pointer"
                    >
                      <span>Clear Application Cache</span>
                      <Trash2 size={13} className="text-white/50" />
                    </button>

                    <button 
                      onClick={() => alert('Database backup generated and stored.')}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all cursor-pointer"
                    >
                      <span>Backup System Database</span>
                      <HardDrive size={13} className="text-white/50" />
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </main>
      </div>

      {/* Provision Organization Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-[#121212] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4.5 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-white flex items-center gap-1.5">
                <Shield size={14} className="text-blue-400" />
                <span>Provision Organization</span>
              </span>
              <button 
                onClick={() => setIsProvisionModalOpen(false)} 
                className="text-white/40 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="p-6 flex flex-col gap-4 font-mono text-xs">
              
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 p-3.5 text-red-400 flex items-start gap-2 rounded-xl">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-emerald-400 flex items-center gap-2 rounded-xl">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>Tenant provisioned successfully!</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <h4 className="text-[9px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 pb-1">
                  1. Workspace Configuration
                </h4>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FlashGo Logistics"
                    value={newOrgName}
                    onChange={handleNameChange}
                    className="bg-[#0A0A0A] border border-white/5 px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-white/25 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50">URL Route Slug</label>
                  <div className="flex items-center">
                    <span className="bg-[#1A1A1A] border border-r-0 border-white/5 px-3 py-2.5 text-white/30 rounded-l-xl select-none">
                      /
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="flashgo-logistics"
                      value={newOrgSlug}
                      onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="bg-[#0A0A0A] border border-white/5 px-3.5 py-2.5 rounded-r-xl text-white outline-none focus:border-white/25 flex-1 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <h4 className="text-[9px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 pb-1">
                  2. Administrator Details
                </h4>

                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50">Admin Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Sarah Connor"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="bg-[#0A0A0A] border border-white/5 px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-white/25 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50">Admin Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@comp.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="bg-[#0A0A0A] border border-white/5 px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-white/25 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-white/50">Admin Initial Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="bg-[#0A0A0A] border border-white/5 px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-white/25 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  disabled={formLoading}
                  className="px-4 py-2 border border-white/5 hover:bg-neutral-900 text-white/40 hover:text-white rounded-xl cursor-pointer disabled:opacity-50 font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-white hover:bg-neutral-200 text-[#0A0A0A] font-bold border border-white rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 min-w-[120px]"
                >
                  {formLoading ? (
                    <div className="w-4.5 h-4.5 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
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
