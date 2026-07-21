import { useState } from 'react';
import useAuth from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Route, Users, Package, Navigation, ArrowRight } from 'lucide-react';
import { DispatchMap } from '../components/DispatchMap';
import { DriverForm } from '../components/DriverForm';
import { OrderForm } from '../components/OrderForm';
import { OptimizePanel } from '../components/OptimizePanel';

const STATS = [
  { label: 'Total Routes', value: '48', change: '+12% from last week', icon: Route, color: 'text-blue-500 bg-blue-50' },
  { label: 'Active Drivers', value: '18', change: '86% utilization', icon: Users, color: 'text-green-500 bg-green-50' },
  { label: 'Pending Orders', value: '142', change: '24 scheduled today', icon: Package, color: 'text-amber-500 bg-amber-50' },
  { label: 'Dispatched Fleet', value: '94%', change: 'All systems online', icon: Navigation, color: 'text-purple-500 bg-purple-50' },
];

const RECENT_ORDERS = [
  { id: 'POL-1082', customer: 'Acme Corp', address: '128 Industrial Pkwy, Sector 4', status: 'Dispatched', eta: '14 mins', color: 'bg-blue-100 text-blue-800' },
  { id: 'POL-1081', customer: 'Global Freight LLC', address: '404 Shipping Rd, Dock 9', status: 'Delivered', eta: 'Completed', color: 'bg-green-100 text-green-800' },
  { id: 'POL-1080', customer: 'Jane Doe', address: '742 Evergreen Terrace', status: 'Pending', eta: '1 hr 12 mins', color: 'bg-slate-100 text-slate-800' },
  { id: 'POL-1079', customer: 'Tech Logistic Inc', address: '89 Infinite Loop, Building 3', status: 'Dispatched', eta: '32 mins', color: 'bg-blue-100 text-blue-800' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [orgId, setOrgId] = useState('');

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden font-sans">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.fullName || 'Dispatcher'}!
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Orchestrate and optimize your delivery logistics in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                    <div className={`p-2 rounded-xl ${stat.color}`}>
                      <Icon size={18} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase tracking-wider">{stat.change}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Solver forms inputs and setup panel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Solver Integration Panel</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Define token and organization to run optimizations</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                placeholder="Paste JWT token"
                value={token}
                onChange={e => setToken(e.target.value)}
                className="flex-1 min-w-[260px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#2563EB] focus:bg-white"
              />
              <input
                placeholder="Org ID (e.g. test-org-2)"
                value={orgId}
                onChange={e => setOrgId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <DriverForm token={token} orgId={orgId} />
              <OrderForm token={token} orgId={orgId} />
            </div>

            <div className="pt-6 border-t border-slate-100">
              <OptimizePanel token={token} orgId={orgId} />
            </div>
          </div>

          {/* Live Dispatch map */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden select-none p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Dispatch Map Tracker</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Real-time driver location stream</p>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200/80 h-[480px]">
              <DispatchMap />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden select-none">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent Orders</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Live tracking updates</p>
              </div>
              <button className="flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:text-[#1d4ed8] cursor-pointer">
                View All <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5">Order ID</th>
                    <th className="py-3 px-5">Customer</th>
                    <th className="py-3 px-5">Address</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {RECENT_ORDERS.map((order, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-5 font-bold text-[#2563EB]">{order.id}</td>
                      <td className="py-3.5 px-5 text-slate-855">{order.customer}</td>
                      <td className="py-3.5 px-5 text-slate-500 text-xs">{order.address}</td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${order.color}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-700 text-xs font-bold">{order.eta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
