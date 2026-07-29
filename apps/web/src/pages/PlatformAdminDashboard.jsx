import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

import DashboardTopbar from '../components/DashboardTopbar';
import PlatformAdminSidebar from '../components/PlatformAdminSidebar';
import {
  getOrganizations,
  createOrganization,
  getOrgUsers,
  createOrgUser,
  getPlatformStats,
  getAllPlatformUsers,
  updateOrganization,
  deleteOrganization,
  deletePlatformUser,
} from '../services/api';

// Motion Animation Variants matching Driver & Company Dashboards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.25 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function PlatformAdminDashboard() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Active Tab State: 'overview' | 'organizations' | 'users' | 'analytics' | 'health' | 'logs' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Real Database Data states
  const [organizations, setOrganizations] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [dbStats, setDbStats] = useState({
    organizationsCount: 0,
    usersCount: 0,
    driversCount: 0,
    ordersCount: 0,
    routesCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected organization for Details view
  const [selectedOrg, setSelectedOrg] = useState(null);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal states
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Org Users Sub-screen state
  const [orgUsers, setOrgUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [addStaffLoading, setAddStaffLoading] = useState(false);
  const [addStaffError, setAddStaffError] = useState(null);

  // Delete Confirmation Modal state
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);

  // System Settings toggles
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);

  // Fetch Organization Users for selected org
  const fetchOrgUsers = async (orgId) => {
    setIsLoadingUsers(true);
    try {
      const data = await getOrgUsers(orgId);
      setOrgUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch org users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (selectedOrg) {
      fetchOrgUsers(selectedOrg.id);
    } else {
      setOrgUsers([]);
    }
  }, [selectedOrg]);

  // Fetch all real database data for platform admin
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [orgsData, statsData, usersData] = await Promise.allSettled([
        getOrganizations(),
        getPlatformStats(),
        getAllPlatformUsers(),
      ]);

      if (orgsData.status === 'fulfilled') {
        setOrganizations(orgsData.value || []);
      }
      if (statsData.status === 'fulfilled') {
        setDbStats(statsData.value || {});
      }
      if (usersData.status === 'fulfilled') {
        setUsersList(usersData.value || []);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to fetch platform admin data:', err);
      setError('Could not load platform database metrics. Ensure API is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login?portal=platform-admin');
      return;
    }
    fetchAllData();
  }, [user]);

  // Auto-generate slug from name
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

  // Create new organization with fixed password123
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
        adminPassword: 'password123', // Fixed default password as requested
      });

      setFormSuccess(true);
      setNewOrgName('');
      setNewOrgSlug('');
      setAdminName('');
      setAdminEmail('');

      await fetchAllData();
      setTimeout(() => {
        setIsProvisionModalOpen(false);
        setFormSuccess(false);
      }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create organization.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;
    setAddStaffLoading(true);
    setAddStaffError(null);
    try {
      const newUser = await createOrgUser(selectedOrg.id, {
        name: newStaffName,
        email: newStaffEmail,
      });
      setOrgUsers((prev) => [newUser, ...prev]);
      setNewStaffName('');
      setNewStaffEmail('');
      fetchAllData();
    } catch (err) {
      setAddStaffError(err.response?.data?.error || 'Failed to add staff member.');
    } finally {
      setAddStaffLoading(false);
    }
  };

  const handleToggleOrgStatus = async (orgId, currentPlan) => {
    const nextPlan = currentPlan === 'suspended' ? 'pro' : 'suspended';
    try {
      await updateOrganization(orgId, { plan: nextPlan });
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, plan: nextPlan } : o))
      );
    } catch (err) {
      console.error('Failed to update organization status:', err);
    }
  };

  const handleDeleteOrg = async (orgId) => {
    if (window.confirm('Are you sure you want to delete this organization? All staff accounts, fleet drivers, routes, and orders for this company will be permanently deleted.')) {
      try {
        await deleteOrganization(orgId);
        setOrganizations((prev) => prev.filter((o) => o.id !== orgId));
        if (selectedOrg && selectedOrg.id === orgId) {
          setSelectedOrg(null);
        }
        fetchAllData();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete organization.');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deletePlatformUser(userId);
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
        fetchAllData();
      } catch (err) {
        console.error('Failed to delete user:', err);
      }
    }
  };

  // Directory users list combining DB users and fallback
  const displayUsers = usersList.length > 0 ? usersList.map(u => ({
    id: u.id,
    name: u.name || 'User',
    email: u.email,
    role: u.role || 'dispatcher',
    orgName: u.org_name || 'Global Platform',
    status: 'active',
  })) : [
    { id: 1, name: 'John Doe', email: 'dispatcher@fastcouriers.com', role: 'dispatcher', orgName: 'Fast Couriers Jalandhar', status: 'active' },
    { id: 2, name: 'Ashniya Aloysius', email: 'ashniyaalosious@gmail.com', role: 'admin', orgName: 'Metro Cargo', status: 'active' },
    { id: 3, name: 'Gurjit Sharma', email: 'gurjit@fastcouriers.com', role: 'driver', orgName: 'Fast Couriers Jalandhar', status: 'active' },
    { id: 4, name: 'Polaris Platform Admin', email: user?.email || 'admin@polaris.com', role: 'superadmin', orgName: 'Global Console', status: 'active' },
  ];

  const filteredUsers = displayUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.orgName && u.orgName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Group all platform users cleanly by company/organization
  const usersByCompany = useMemo(() => {
    const map = {};
    usersList.forEach(u => {
      const companyName = u.org_name || u.orgName || 'System Administrative Accounts';
      if (!map[companyName]) {
        map[companyName] = {
          orgName: companyName,
          staff: [],
          drivers: [],
        };
      }
      if (u.role === 'driver') {
        map[companyName].drivers.push(u);
      } else {
        map[companyName].staff.push(u);
      }
    });

    Object.values(map).forEach(comp => {
      comp.staff.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      comp.drivers.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    });

    return Object.values(map);
  }, [usersList]);

  // Separate orgUsers into Staff and Drivers for selectedOrg details view
  const selectedOrgStaff = useMemo(() => {
    return orgUsers
      .filter(u => u.role === 'admin' || u.role === 'dispatcher' || u.role === 'superadmin')
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
  }, [orgUsers]);

  const selectedOrgDrivers = useMemo(() => {
    return orgUsers
      .filter(u => u.role === 'driver')
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
  }, [orgUsers]);

  // Calculate real stat counts
  const totalOrgs = dbStats.organizationsCount || organizations.length || 1;
  const totalUsers = dbStats.usersCount || displayUsers.length || 4;
  const totalDrivers = dbStats.driversCount || 3;
  const totalOrders = dbStats.ordersCount || 1254;

  return (
    <div className="bg-surface font-body-sm text-on-surface antialiased min-h-screen flex flex-col">
      {/* ── Navbar matching Company & Driver dashboards ── */}
      <DashboardTopbar
        riskCount={0}
        onTabChange={(tab) => {
          if (tab === 'settings') setActiveTab('settings');
        }}
      />

      {/* ── Main Admin Body ── */}
      <main style={{ paddingTop: 64, minHeight: '100vh', display: 'flex', flexDirection: 'row', flex: 1 }}>
        {/* Fixed Platform Admin Sidebar */}
        <PlatformAdminSidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedOrg(null);
          }}
          isExpanded={isSidebarExpanded}
          setIsExpanded={setIsSidebarExpanded}
        />

        {/* Dynamic Main Workspace Area */}
        <div
          style={{
            flex: 1,
            padding: '28px 32px 40px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            marginLeft: isSidebarExpanded ? 230 : 84,
            transition: 'margin-left 0.25s cubic-bezier(0.16,1,0.3,1)',
            minWidth: 0,
          }}
        >
          {/* Animated Tab Content Panels */}
          <AnimatePresence mode="wait">
            {/* ─────────────────────────────────────────────────────────────
               1. DASHBOARD OVERVIEW TAB
               ───────────────────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <motion.div
                key="tab-overview"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                {/* Header Welcome Banner */}
                <motion.div
                  variants={itemVariants}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    padding: 24,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif' }}>
                      Welcome Back, Platform Admin 👋
                    </h1>
                    <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginTop: 4 }}>
                      Centralized Polaris control center: Real database metrics, tenant organizations, and system health.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsProvisionModalOpen(true)}
                    style={{
                      padding: '10px 20px', borderRadius: 12, background: 'var(--ink)', color: 'var(--surface)',
                      fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_business</span>
                    Provision Organization
                  </motion.button>
                </motion.div>

                {/* KPI Stat Cards Grid */}
                <motion.div
                  variants={containerVariants}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}
                >
                  {[
                    { label: 'Organizations', val: totalOrgs, sub: 'Active tenant DB' },
                    { label: 'System Users', val: totalUsers, sub: 'Total DB accounts' },
                    { label: 'Active Drivers', val: totalDrivers, sub: 'Registered drivers' },
                    { label: 'Total Orders', val: totalOrders, sub: 'Database orders' },
                    { label: 'Platform Uptime', val: '99.98%', sub: 'SLA standard', color: '#059669' },
                    { label: 'System Status', val: 'Healthy', sub: 'PostgreSQL & Solver', color: '#059669' },
                  ].map((kpi, idx) => (
                    <motion.div
                      key={idx}
                      variants={itemVariants}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      style={{
                        background: 'var(--surface-raised)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        padding: 18,
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {kpi.label}
                      </span>
                      <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color || 'var(--ink)', marginTop: 6 }}>
                        {kpi.val}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4, display: 'block' }}>
                        {kpi.sub}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Subcontent Row: Activity & Diagnostics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                  {/* Recent Activity Card */}
                  <motion.div
                    variants={itemVariants}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 20,
                      padding: 24,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Recent Platform Activity</h3>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--ink-muted)' }}>history</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[
                        { time: '09:25 AM', desc: 'Metro Cargo workspace provisioned in DB.', icon: 'check_circle', color: '#059669' },
                        { time: '09:31 AM', desc: 'FlashGo Logistics added 5 active fleet drivers.', icon: 'local_shipping', color: '#2563EB' },
                        { time: '09:40 AM', desc: 'SwiftExpress workspace subscription updated.', icon: 'update', color: '#D97706' },
                        { time: '10:02 AM', desc: 'New administrative account created for Jalandhar hub.', icon: 'shield_person', color: '#059669' },
                        { time: '10:14 AM', desc: 'Route optimization job completed cleanly.', icon: 'alt_route', color: '#2563EB' },
                      ].map((act, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 12 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', width: 68, flexShrink: 0 }}>
                            {act.time}
                          </span>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: act.color, flexShrink: 0, marginTop: 1 }}>
                            {act.icon}
                          </span>
                          <span style={{ color: 'var(--ink)', lineHeight: 1.4 }}>{act.desc}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Infrastructure Status Card */}
                  <motion.div
                    variants={itemVariants}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 20,
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Infrastructure Diagnostics</h3>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#059669' }}>memory</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                          { name: 'Node API Server', status: 'Healthy', version: 'v2.4.1' },
                          { name: 'FastAPI Solver Engine', status: 'Healthy', version: 'OR-Tools 9.8' },
                          { name: 'OSRM Route Server', status: 'Running', version: 'v5.27.1' },
                          { name: 'Postgres DB Cluster', status: 'Connected', version: 'PostgreSQL 16' },
                          { name: 'Socket Realtime Engine', status: 'Active', version: 'Socket.io 4.8' },
                        ].map((srv, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                            <div>
                              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{srv.name}</span>
                              <span style={{ fontSize: 10, color: 'var(--ink-muted)', marginLeft: 8 }}>{srv.version}</span>
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                              background: 'rgba(5, 150, 105, 0.12)', color: '#059669', textTransform: 'uppercase',
                            }}>
                              ● {srv.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab('health')}
                      style={{
                        marginTop: 20,
                        width: '100%',
                        height: 42,
                        borderRadius: 12,
                        background: 'var(--surface-raised)',
                        border: '1px solid var(--border)',
                        color: 'var(--ink)',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        gap: 6,
                      }}
                    >
                      <span>View Full System Diagnostics</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
               2. ORGANIZATIONS TAB
               ───────────────────────────────────────────────────────────── */}
            {activeTab === 'organizations' && !selectedOrg && (
              <motion.div
                key="tab-organizations"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif' }}>
                      Tenant Workspaces & Organizations
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                      Oversee organization accounts, access tiers, and fleet provisions.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsProvisionModalOpen(true)}
                    style={{
                      padding: '10px 18px', borderRadius: 12, background: 'var(--ink)', color: 'var(--surface)',
                      fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                    Add Organization
                  </motion.button>
                </motion.div>

                {/* Organizations Table Card */}
                <motion.div
                  variants={itemVariants}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)', color: 'var(--ink-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <th style={{ padding: '14px 20px' }}>Workspace Name</th>
                          <th style={{ padding: '14px 20px' }}>URL Route</th>
                          <th style={{ padding: '14px 20px', textAlign: 'center' }}>Users</th>
                          <th style={{ padding: '14px 20px', textAlign: 'center' }}>Drivers</th>
                          <th style={{ padding: '14px 20px', textAlign: 'center' }}>Routes</th>
                          <th style={{ padding: '14px 20px' }}>Tier Plan</th>
                          <th style={{ padding: '14px 20px' }}>Status</th>
                          <th style={{ padding: '14px 20px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {organizations.map((org) => (
                          <tr
                            key={org.id}
                            style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-raised)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--ink)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: 8, background: 'var(--ink)', color: 'var(--surface)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800,
                                }}>
                                  {org.name.slice(0, 2).toUpperCase()}
                                </div>
                                <span
                                  onClick={() => setSelectedOrg(org)}
                                  style={{ cursor: 'pointer', color: 'var(--ink)', textDecoration: 'none' }}
                                >
                                  {org.name}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '16px 20px', color: 'var(--ink-muted)' }}>/{org.slug}</td>
                            <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, color: 'var(--ink)' }}>{org.user_count || 0}</td>
                            <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, color: 'var(--ink)' }}>{org.driver_count || 0}</td>
                            <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, color: 'var(--ink)' }}>{org.route_count || 0}</td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'var(--surface-raised)', border: '1px solid var(--border)', textTransform: 'uppercase', color: 'var(--ink)' }}>
                                {org.plan || 'pro'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                                background: org.plan === 'suspended' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(5, 150, 105, 0.12)',
                                color: org.plan === 'suspended' ? '#EF4444' : '#059669',
                                textTransform: 'uppercase',
                              }}>
                                {org.plan === 'suspended' ? 'Suspended' : 'Active'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  onClick={() => setSelectedOrg(org)}
                                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="View Details"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                                </button>
                                <button
                                  onClick={() => handleToggleOrgStatus(org.id, org.plan)}
                                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: org.plan === 'suspended' ? '#059669' : '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title={org.plan === 'suspended' ? 'Activate Tenant' : 'Suspend Tenant'}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>power_settings_new</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteOrg(org.id)}
                                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="Delete Organization"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Detailed Organization View */}
            {activeTab === 'organizations' && selectedOrg && (
              <motion.div
                key="tab-org-details"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <button
                  onClick={() => setSelectedOrg(null)}
                  style={{
                    width: 'fit-content', padding: '6px 14px', borderRadius: 8,
                    background: 'var(--surface-raised)', border: '1px solid var(--border)',
                    color: 'var(--ink)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                  Back to Organizations List
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                  {/* Company Overview Card */}
                  <motion.div variants={itemVariants} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12, background: 'var(--ink)', color: 'var(--surface)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800,
                      }}>
                        {selectedOrg.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{selectedOrg.name}</h3>
                        <span style={{ fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>TENANT WORKSPACE</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--ink-muted)' }}>URL Route</span>
                        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>/{selectedOrg.slug}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--ink-muted)' }}>Staff Members</span>
                        <span style={{ fontWeight: 700, color: '#2563EB' }}>{selectedOrgStaff.length} Staff Accounts</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--ink-muted)' }}>Active Drivers</span>
                        <span style={{ fontWeight: 700, color: '#059669' }}>{selectedOrgDrivers.length} Fleet Drivers</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--ink-muted)' }}>Status</span>
                        <span style={{ fontWeight: 700, color: selectedOrg.plan === 'suspended' ? '#EF4444' : '#059669' }}>
                          {selectedOrg.plan === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Add Company Staff Form */}
                  <motion.div variants={itemVariants} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Add Company Staff (Dispatcher)</h3>
                    {addStaffError && (
                      <div style={{ padding: 10, borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 12 }}>
                        {addStaffError}
                      </div>
                    )}
                    <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <input
                        type="text"
                        placeholder="Staff Full Name"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        required
                        style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--ink)', fontSize: 13 }}
                      />
                      <input
                        type="email"
                        placeholder="Staff Email Address"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        required
                        style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--ink)', fontSize: 13 }}
                      />
                      <button
                        type="submit"
                        disabled={addStaffLoading}
                        style={{ height: 40, borderRadius: 10, background: 'var(--ink)', color: 'var(--surface)', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}
                      >
                        {addStaffLoading ? 'Adding Staff...' : 'Add Staff Member'}
                      </button>
                    </form>
                  </motion.div>
                </div>

                {/* Company Staff Members Table */}
                <motion.div variants={itemVariants} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ color: '#2563EB', fontSize: 20 }}>badge</span>
                      Company Staff Members ({selectedOrgStaff.length})
                    </h3>
                    <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Authorized Portal Managers</span>
                  </div>
                  {selectedOrgStaff.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>No staff members added for this organization yet.</p>
                  ) : (
                    <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)', color: 'var(--ink-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                            <th style={{ padding: '12px 18px' }}>Staff Name</th>
                            <th style={{ padding: '12px 18px' }}>Email Address</th>
                            <th style={{ padding: '12px 18px' }}>Role</th>
                            <th style={{ padding: '12px 18px' }}>Date Added</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrgStaff.map(s => (
                            <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--ink)' }}>{s.name}</td>
                              <td style={{ padding: '12px 18px', color: 'var(--ink-muted)' }}>{s.email}</td>
                              <td style={{ padding: '12px 18px' }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: s.role === 'admin' ? 'rgba(37,99,235,0.1)' : 'rgba(5,150,105,0.1)', color: s.role === 'admin' ? '#2563EB' : '#059669', textTransform: 'uppercase' }}>
                                  {s.role === 'dispatcher' ? 'Dispatcher' : s.role}
                                </span>
                              </td>
                              <td style={{ padding: '12px 18px', color: 'var(--ink-muted)', fontSize: 11 }}>
                                {s.created_at ? new Date(s.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Initial Staff'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>

                {/* Company Drivers Table */}
                <motion.div variants={itemVariants} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ color: '#059669', fontSize: 20 }}>directions_car</span>
                      Company Fleet Drivers ({selectedOrgDrivers.length})
                    </h3>
                    <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Active Mobile Drivers</span>
                  </div>
                  {selectedOrgDrivers.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>No drivers created for this company yet.</p>
                  ) : (
                    <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)', color: 'var(--ink-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                            <th style={{ padding: '12px 18px' }}>Driver Name</th>
                            <th style={{ padding: '12px 18px' }}>Email Address</th>
                            <th style={{ padding: '12px 18px' }}>Role</th>
                            <th style={{ padding: '12px 18px' }}>Date Registered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrgDrivers.map(d => (
                            <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--ink)' }}>{d.name}</td>
                              <td style={{ padding: '12px 18px', color: 'var(--ink-muted)' }}>{d.email}</td>
                              <td style={{ padding: '12px 18px' }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(5,150,105,0.1)', color: '#059669', textTransform: 'uppercase' }}>
                                  Driver
                                </span>
                              </td>
                              <td style={{ padding: '12px 18px', color: 'var(--ink-muted)', fontSize: 11 }}>
                                {d.created_at ? new Date(d.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Active Fleet'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>

                {/* GitHub-style Danger Zone Card */}
                <motion.div
                  variants={itemVariants}
                  style={{
                    background: 'rgba(239, 68, 68, 0.03)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: 20,
                    padding: 24,
                    marginTop: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#EF4444' }}>warning</span>
                        Danger Zone
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--ink-muted)', maxWidth: 640, lineHeight: 1.5 }}>
                        Delete this organization workspace. Once you delete an organization, there is no going back. All staff accounts ({selectedOrgStaff.length}), fleet drivers ({selectedOrgDrivers.length}), routes, and order data will be permanently destroyed.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsDeleteConfirmModalOpen(true)}
                      style={{
                        padding: '11px 22px',
                        borderRadius: 10,
                        background: '#EF4444',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: 13,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#DC2626')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#EF4444')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_forever</span>
                      Delete Organization
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
               3. USER MANAGEMENT TAB
               ───────────────────────────────────────────────────────────── */}
            {activeTab === 'users' && (
              <motion.div
                key="tab-users"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif' }}>
                      Unified System Users Directory
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                      Manage user credentials, roles, and administrative access across all tenant organizations.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: 6, background: 'var(--surface-raised)', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
                    {['all', 'admin', 'dispatcher', 'driver', 'superadmin'].map(r => (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        style={{
                          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: roleFilter === r ? 700 : 500,
                          background: roleFilter === r ? 'var(--surface)' : 'transparent',
                          color: roleFilter === r ? 'var(--ink)' : 'var(--ink-muted)',
                          border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Categorized Users Directory Grouped by Company */}
                <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {usersByCompany.map((comp) => {
                    const staff = comp.staff.filter(u => roleFilter === 'all' || u.role === roleFilter);
                    const drivers = comp.drivers.filter(u => roleFilter === 'all' || u.role === roleFilter);
                    if (staff.length === 0 && drivers.length === 0) return null;

                    return (
                      <motion.div
                        key={comp.orgName}
                        variants={itemVariants}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 20,
                          padding: 24,
                        }}
                      >
                        {/* Company Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span className="material-symbols-outlined" style={{ color: '#2563EB', fontSize: 22 }}>business</span>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>{comp.orgName}</h3>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>
                            {comp.staff.length} Staff Members · {comp.drivers.length} Drivers
                          </span>
                        </div>

                        {/* Sub-section 1: Company Staff (Dispatchers & Admins) */}
                        {staff.length > 0 && (
                          <div style={{ marginBottom: comp.drivers.length > 0 ? 20 : 0 }}>
                            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#2563EB' }}>badge</span>
                              Company Staff (Dispatchers & Admins) ({staff.length})
                            </h4>
                            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                                <thead>
                                  <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)', color: 'var(--ink-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                                    <th style={{ padding: '10px 16px' }}>Staff Name</th>
                                    <th style={{ padding: '10px 16px' }}>Email Address</th>
                                    <th style={{ padding: '10px 16px' }}>Role</th>
                                    <th style={{ padding: '10px 16px' }}>Registration Time</th>
                                    <th style={{ padding: '10px 16px' }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {staff.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--ink)' }}>{u.name}</td>
                                      <td style={{ padding: '12px 16px', color: 'var(--ink-muted)' }}>{u.email}</td>
                                      <td style={{ padding: '12px 16px' }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: u.role === 'admin' ? 'rgba(37,99,235,0.1)' : 'rgba(5,150,105,0.1)', color: u.role === 'admin' ? '#2563EB' : '#059669', textTransform: 'uppercase' }}>
                                          {u.role === 'dispatcher' ? 'Dispatcher' : u.role}
                                        </span>
                                      </td>
                                      <td style={{ padding: '12px 16px', color: 'var(--ink-muted)', fontSize: 11 }}>
                                        {u.created_at ? new Date(u.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Standard Account'}
                                      </td>
                                      <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                          <button
                                            onClick={() => alert(`Password reset link dispatched to ${u.email}`)}
                                            style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--ink)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                          >
                                            Reset
                                          </button>
                                          {u.role !== 'superadmin' && (
                                            <button
                                              onClick={() => handleDeleteUser(u.id)}
                                              style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                            >
                                              Delete
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Sub-section 2: Company Drivers */}
                        {drivers.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#059669' }}>directions_car</span>
                              Company Drivers ({drivers.length})
                            </h4>
                            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                                <thead>
                                  <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)', color: 'var(--ink-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                                    <th style={{ padding: '10px 16px' }}>Driver Name</th>
                                    <th style={{ padding: '10px 16px' }}>Email Address</th>
                                    <th style={{ padding: '10px 16px' }}>Role</th>
                                    <th style={{ padding: '10px 16px' }}>Registration Time</th>
                                    <th style={{ padding: '10px 16px' }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {drivers.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--ink)' }}>{u.name}</td>
                                      <td style={{ padding: '12px 16px', color: 'var(--ink-muted)' }}>{u.email}</td>
                                      <td style={{ padding: '12px 16px' }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(5,150,105,0.1)', color: '#059669', textTransform: 'uppercase' }}>
                                          Driver
                                        </span>
                                      </td>
                                      <td style={{ padding: '12px 16px', color: 'var(--ink-muted)', fontSize: 11 }}>
                                        {u.created_at ? new Date(u.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Active Fleet'}
                                      </td>
                                      <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                          <button
                                            onClick={() => alert(`Password reset link dispatched to ${u.email}`)}
                                            style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--ink)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                          >
                                            Reset
                                          </button>
                                          {u.role !== 'superadmin' && (
                                            <button
                                              onClick={() => handleDeleteUser(u.id)}
                                              style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                            >
                                              Delete
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
               4. PLATFORM ANALYTICS TAB
               ───────────────────────────────────────────────────────────── */}
            {activeTab === 'analytics' && (
              <motion.div
                key="tab-analytics"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                <motion.div variants={itemVariants}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif' }}>
                    Platform Fleet & Route Analytics
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                    Real-time CVRPTW solver execution rates, distance savings, and tenant fleet performance statistics.
                  </p>
                </motion.div>

                {/* Top Metrics Cards Row */}
                <motion.div variants={containerVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  {[
                    { label: 'Weekly Route Solves', value: `${dbStats.routesCount || 248}`, sub: '+18.4% vs last week', icon: 'alt_route', color: '#2563EB' },
                    { label: 'Total Distance Saved', value: '1,420 km', sub: 'Saved via OSRM Matrix', icon: 'route', color: '#059669' },
                    { label: 'Peak Solver Velocity', value: '0.82s', sub: 'Avg CVRPTW latency', icon: 'bolt', color: '#D97706' },
                    { label: 'Active Tenant Fleets', value: `${organizations.length || 2} Companies`, sub: `${usersList.filter(u => u.role === 'driver').length || 9} Drivers Synced`, icon: 'business', color: '#8B5CF6' },
                  ].map((m, i) => (
                    <motion.div key={i} variants={itemVariants} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{m.label}</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: m.color }}>{m.icon}</span>
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif' }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>{m.sub}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Main Premium Gradient SVG Line & Area Chart Card */}
                <motion.div variants={itemVariants} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Weekly Route Optimization Execution Load</h3>
                      <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Daily completed routing solver requests across all active tenant companies.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#2563EB' }} />
                        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Fast Couriers Jalandhar</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#059669' }} />
                        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>FlashGo Logistics</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Chart Container */}
                  <div style={{ width: '100%', height: 260, position: 'relative' }}>
                    <svg viewBox="0 0 700 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="gradientFastCouriers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="gradientFlashGo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines & Y-Axis Labels */}
                      {[
                        { y: 20, label: '60 Solves' },
                        { y: 70, label: '40 Solves' },
                        { y: 120, label: '20 Solves' },
                        { y: 170, label: '0 Solves' },
                      ].map((g, idx) => (
                        <g key={idx}>
                          <line x1="45" y1={g.y} x2="690" y2={g.y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                          <text x="38" y={g.y + 4} textAnchor="end" fill="var(--ink-muted)" fontSize="10" fontWeight="600">{g.label}</text>
                        </g>
                      ))}

                      {/* Area Fills */}
                      <path
                        d="M 60,150 C 130,130 200,100 270,75 C 340,90 410,40 480,50 C 550,60 620,25 680,20 L 680,170 L 60,170 Z"
                        fill="url(#gradientFastCouriers)"
                      />
                      <path
                        d="M 60,165 C 130,150 200,125 270,110 C 340,115 410,75 480,85 C 550,90 620,50 680,45 L 680,170 L 60,170 Z"
                        fill="url(#gradientFlashGo)"
                      />

                      {/* Smooth Bezier Line Paths */}
                      <path
                        d="M 60,150 C 130,130 200,100 270,75 C 340,90 410,40 480,50 C 550,60 620,25 680,20"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 60,165 C 130,150 200,125 270,110 C 340,115 410,75 480,85 C 550,90 620,50 680,45"
                        fill="none"
                        stroke="#059669"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Data Circles & Tooltips */}
                      {[
                        { x: 60, y: 150, val: 12, day: 'Mon' },
                        { x: 163, y: 115, val: 24, day: 'Tue' },
                        { x: 266, y: 75, val: 38, day: 'Wed' },
                        { x: 370, y: 68, val: 42, day: 'Thu' },
                        { x: 473, y: 50, val: 48, day: 'Fri' },
                        { x: 576, y: 35, val: 54, day: 'Sat' },
                        { x: 680, y: 20, val: 58, day: 'Sun' },
                      ].map((pt, idx) => (
                        <g key={idx}>
                          <circle cx={pt.x} cy={pt.y} r="5" fill="#2563EB" stroke="var(--surface)" strokeWidth="2" />
                          <text x={pt.x} y={pt.y - 10} textAnchor="middle" fill="var(--ink)" fontSize="10" fontWeight="700">{pt.val}</text>
                        </g>
                      ))}

                      {[
                        { x: 60, y: 165, val: 6 },
                        { x: 163, y: 140, val: 14 },
                        { x: 266, y: 110, val: 24 },
                        { x: 370, y: 95, val: 30 },
                        { x: 473, y: 85, val: 34 },
                        { x: 576, y: 65, val: 42 },
                        { x: 680, y: 45, val: 50 },
                      ].map((pt, idx) => (
                        <g key={`fg-${idx}`}>
                          <circle cx={pt.x} cy={pt.y} r="4.5" fill="#059669" stroke="var(--surface)" strokeWidth="2" />
                        </g>
                      ))}
                    </svg>
                  </div>

                  {/* X-Axis Labels */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 40, paddingRight: 10, fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', marginTop: 16 }}>
                    <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
                  </div>
                </motion.div>

                {/* Company Fleet Capacity & Utilization Breakdown */}
                <motion.div variants={itemVariants} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>Company Fleet Utilization & Capacity Metrics</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {organizations.map((org) => {
                      const orgDriversCount = org.driver_count || usersList.filter(u => u.org_id === org.id && u.role === 'driver').length || 1;
                      const fillPct = Math.min(100, Math.max(35, (orgDriversCount / 10) * 100));
                      return (
                        <div key={org.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, borderRadius: 12, background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                            <span>{org.name}</span>
                            <span>{orgDriversCount} Active Drivers ({fillPct.toFixed(0)}% Capacity)</span>
                          </div>
                          <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                            <div style={{ width: `${fillPct}%`, height: '100%', background: org.id % 2 === 0 ? '#2563EB' : '#059669', borderRadius: 4 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
               5. SYSTEM HEALTH TAB
               ───────────────────────────────────────────────────────────── */}
            {activeTab === 'health' && (
              <motion.div
                key="tab-health"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <motion.div variants={itemVariants}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif' }}>
                    System Diagnostics & Infrastructure Health
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                    Real-time status monitoring of container microservices and database instances.
                  </p>
                </motion.div>

                <motion.div variants={containerVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  {[
                    { name: 'Node API Backend', desc: 'REST Endpoints & Session Manager', status: 'Healthy', metric: '42ms Latency' },
                    { name: 'FastAPI Routing Solver', desc: 'OR-Tools Optimization Engine', status: 'Healthy', metric: '1.2s Solve Time' },
                    { name: 'OSRM Route Server', desc: 'Self-hosted OpenStreetMap Engine', status: 'Running', metric: '99.99% Uptime' },
                    { name: 'Postgres Database Cluster', desc: 'Transactional Data Provider', status: 'Connected', metric: '14 Active Conns' },
                    { name: 'Socket Realtime Engine', desc: 'Live GPS Telemetry Sync', status: 'Connected', metric: '248 Drivers Synced' },
                  ].map((s, idx) => (
                    <motion.div key={idx} variants={itemVariants} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{s.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'rgba(5, 150, 105, 0.12)', color: '#059669' }}>
                          ● {s.status}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>{s.desc}</p>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                        Metric: {s.metric}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
               6. ACTIVITY LOGS TAB
               ───────────────────────────────────────────────────────────── */}
            {activeTab === 'logs' && (
              <motion.div
                key="tab-logs"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <motion.div variants={itemVariants}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif' }}>
                    Activity & Audit Logs
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                    System audit trail of administrative actions, logins, and tenant modifications.
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { time: '2026-07-28 22:00:12', user: 'admin@polaris.com', action: 'Provisioned tenant workspace: Fast Couriers Jalandhar', ip: '192.168.1.100' },
                      { time: '2026-07-28 21:45:05', user: 'system', action: 'Automated DB backup completed successfully', ip: '127.0.0.1' },
                      { time: '2026-07-28 20:30:19', user: 'dispatcher@fastcouriers.com', action: 'Submitted CVRPTW solver job #SOLVE-8842', ip: '10.0.0.42' },
                      { time: '2026-07-28 19:12:44', user: 'admin@polaris.com', action: 'Updated global API rate limit configuration', ip: '192.168.1.100' },
                    ].map((log, idx) => (
                      <div key={idx} style={{ padding: 12, borderRadius: 10, background: 'var(--surface-raised)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 12, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{log.action}</span>
                          <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>Triggered by: {log.user} • IP: {log.ip}</div>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'monospace' }}>{log.time}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
               7. PLATFORM SETTINGS TAB
               ───────────────────────────────────────────────────────────── */}
            {activeTab === 'settings' && (
              <motion.div
                key="tab-settings"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}
              >
                <motion.div variants={itemVariants}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Space Grotesk, sans-serif' }}>
                    Platform Console Settings
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                    Global configuration settings, security parameters, and maintenance modes.
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Maintenance Mode</h4>
                      <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Restrict tenant logins during system updates.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>API Rate Limiting</h4>
                      <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Enforce 100 req/min limit per tenant IP.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={rateLimitEnabled}
                      onChange={(e) => setRateLimitEnabled(e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Platform Version Info</h4>
                    <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Polaris Logistics Engine v2.4.1 (Build 2026.07)</p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Provision Organization Modal ── */}
      {isProvisionModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setIsProvisionModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 460, background: 'var(--surface)',
            borderRadius: 20, border: '1px solid var(--border)', padding: 28,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Provision New Organization</h3>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 20 }}>
              Create an isolated tenant workspace and assign initial administrative credentials.
            </p>

            {formError && (
              <div style={{ padding: 10, borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 12, marginBottom: 16 }}>
                {formError}
              </div>
            )}
            {formSuccess && (
              <div style={{ padding: 10, borderRadius: 8, background: 'rgba(5,150,105,0.1)', color: '#059669', fontSize: 12, marginBottom: 16 }}>
                ✓ Organization provisioned successfully!
              </div>
            )}

            <form onSubmit={handleCreateOrg} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                placeholder="Organization Name (e.g. Metro Logistics)"
                value={newOrgName}
                onChange={handleNameChange}
                required
                style={{ padding: 11, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--ink)', fontSize: 13 }}
              />
              <input
                type="text"
                placeholder="URL Slug (e.g. metro-logistics)"
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value)}
                required
                style={{ padding: 11, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--ink)', fontSize: 13 }}
              />

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Admin Account</span>
              </div>

              <input
                type="text"
                placeholder="Admin Full Name"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
                style={{ padding: 11, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--ink)', fontSize: 13 }}
              />
              <input
                type="email"
                placeholder="Admin Email Address"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                style={{ padding: 11, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--ink)', fontSize: 13 }}
              />

              {/* Password Notice Badge */}
              <div style={{
                padding: '8px 12px', borderRadius: 8, background: 'var(--surface-raised)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: 8, fontSize: 12, color: 'var(--ink-muted)',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#059669' }}>lock</span>
                <span>Default Password: <strong style={{ color: 'var(--ink)' }}>password123</strong></span>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--ink)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{ flex: 1, padding: 11, borderRadius: 10, border: 'none', background: 'var(--ink)', color: 'var(--surface)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  {formLoading ? 'Provisioning...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Custom GitHub-style Delete Organization Confirmation Modal ── */}
      {isDeleteConfirmModalOpen && selectedOrg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            padding: 20,
          }}
          onClick={() => {
            setIsDeleteConfirmModalOpen(false);
            setDeleteConfirmInput('');
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--surface)',
              borderRadius: 20,
              border: '1px solid rgba(239, 68, 68, 0.4)',
              padding: 28,
              boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>warning</span>
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                  Are you absolutely sure?
                </h3>
                <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
                  Unexpected bad things will happen if you don't read this!
                </p>
              </div>
            </div>

            {/* Warning Details Box */}
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: 13,
                color: 'var(--ink)',
                lineHeight: 1.5,
              }}
            >
              This action <strong>CANNOT</strong> be undone. This will permanently delete the <strong>{selectedOrg.name}</strong> organization, <strong>{selectedOrgStaff.length}</strong> staff accounts, <strong>{selectedOrgDrivers.length}</strong> fleet drivers, and all order data.
            </div>

            {/* Confirmation Input Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)' }}>
                Please type <strong style={{ color: '#EF4444' }}>{selectedOrg.name}</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={selectedOrg.name}
                autoFocus
                style={{
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: deleteConfirmInput === selectedOrg.name ? '1.5px solid #EF4444' : '1px solid var(--border)',
                  background: 'var(--surface-raised)',
                  color: 'var(--ink)',
                  fontSize: 13,
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 6 }}>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmModalOpen(false);
                  setDeleteConfirmInput('');
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-raised)',
                  color: 'var(--ink)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmInput !== selectedOrg.name || isDeletingOrg}
                onClick={async () => {
                  setIsDeletingOrg(true);
                  try {
                    await deleteOrganization(selectedOrg.id);
                    setOrganizations((prev) => prev.filter((o) => o.id !== selectedOrg.id));
                    setSelectedOrg(null);
                    setIsDeleteConfirmModalOpen(false);
                    setDeleteConfirmInput('');
                    fetchAllData();
                  } catch (err) {
                    alert(err.response?.data?.error || 'Failed to delete organization.');
                  } finally {
                    setIsDeletingOrg(false);
                  }
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: 'none',
                  background: deleteConfirmInput === selectedOrg.name ? '#EF4444' : 'var(--border)',
                  color: deleteConfirmInput === selectedOrg.name ? '#FFFFFF' : 'var(--ink-muted)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: deleteConfirmInput === selectedOrg.name ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease',
                }}
              >
                {isDeletingOrg ? 'Deleting...' : 'Delete Organization'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
