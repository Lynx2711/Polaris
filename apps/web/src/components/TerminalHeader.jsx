import { useState } from 'react';
import { Play, Plus, RefreshCw, Radio, User, LogOut, Package, Truck, AlertTriangle } from 'lucide-react';
import PolarisLogo from './PolarisLogo';

export default function TerminalHeader({
  user,
  onLogout,
  onOptimize,
  isSolving,
  solveStatus,
  socketConnected,
  orderCount,
  driverCount,
  unassignedCount,
  riskCount,
  onOpenOrderModal,
  onOpenDriverModal,
  onSeedData,
  isSeeding,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 bg-[#0A0A0A] border-b border-[#262626] px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* ── Left Branding ── */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <PolarisLogo size={30} dark={true} loop={true} showWord={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-widest text-sm uppercase">POLARIS</span>
              <span className="text-[10px] font-mono bg-[#1F1F1F] text-[#A0A0A0] px-1.5 py-0.5 border border-[#333333]">
                v2.4 TERMINAL
              </span>
            </div>
            <p className="text-[10px] text-[#8C8C8C] tracking-wider font-mono">
              OR-TOOLS CVRPTW DISPATCH
            </p>
          </div>
        </div>

        {/* Live Socket Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono border transition ${
            socketConnected
              ? 'bg-[#051F15] border-[#10B981]/40 text-[#34D399]'
              : 'bg-[#211505] border-[#F59E0B]/40 text-[#FBBF24]'
          }`}
          title={socketConnected ? 'Live Socket Connected' : 'Socket Disconnected - Tracking Paused'}
        >
          <Radio size={12} className={socketConnected ? 'animate-pulse text-[#10B981]' : 'text-[#F59E0B]'} />
          <span>{socketConnected ? 'LIVE FEED' : 'FEED PAUSED'}</span>
        </div>

        {/* Risk Pill if any */}
        {riskCount > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono bg-[#231206] border border-[#F59E0B]/50 text-[#F59E0B]">
            <AlertTriangle size={12} />
            <span>{riskCount} RISK ORDERS</span>
          </div>
        )}
      </div>

      {/* ── Center Quick Stats ── */}
      <div className="hidden lg:flex items-center gap-6 text-xs font-mono text-[#A0A0A0]">
        <div className="flex items-center gap-2">
          <Truck size={14} className="text-[#38BDF8]" />
          <span>DRIVERS: <strong className="text-white">{driverCount}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Package size={14} className="text-[#FBBF24]" />
          <span>UNASSIGNED: <strong className="text-white">{unassignedCount}</strong> / {orderCount}</span>
        </div>
      </div>

      {/* ── Right Actions ── */}
      <div className="flex items-center gap-2.5">
        {/* Seed Data Button */}
        <button
          onClick={onSeedData}
          disabled={isSeeding}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#141414] hover:bg-[#202020] text-[#A0A0A0] hover:text-white border border-[#2A2A2A] transition cursor-pointer disabled:opacity-50"
          title="Seed demo drivers and orders into database"
        >
          <RefreshCw size={13} className={isSeeding ? 'animate-spin' : ''} />
          <span>SEED DEMO</span>
        </button>

        {/* Add Driver Button */}
        <button
          onClick={onOpenDriverModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#141414] hover:bg-[#202020] text-[#A0A0A0] hover:text-white border border-[#2A2A2A] transition cursor-pointer"
        >
          <Plus size={13} />
          <span>DRIVER</span>
        </button>

        {/* Add Order Button */}
        <button
          onClick={onOpenOrderModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#141414] hover:bg-[#202020] text-[#A0A0A0] hover:text-white border border-[#2A2A2A] transition cursor-pointer"
        >
          <Plus size={13} />
          <span>ORDER</span>
        </button>

        {/* OPTIMIZE ROUTES PRIMARY BUTTON */}
        <button
          onClick={onOptimize}
          disabled={isSolving || unassignedCount === 0 || driverCount === 0}
          className={`flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-semibold tracking-wide border transition cursor-pointer ${
            isSolving
              ? 'bg-[#1E1B4B] text-[#818CF8] border-[#4338CA] animate-pulse'
              : unassignedCount === 0 || driverCount === 0
              ? 'bg-[#141414] text-[#555555] border-[#222222] cursor-not-allowed'
              : 'bg-white text-[#0A0A0A] hover:bg-[#E5E5E5] border-white active:scale-95'
          }`}
        >
          {isSolving ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>SOLVING ({solveStatus.toUpperCase()})...</span>
            </>
          ) : (
            <>
              <Play size={14} className="fill-current" />
              <span>OPTIMIZE ROUTES</span>
            </>
          )}
        </button>

        {/* User Profile */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-[#141414] hover:bg-[#202020] border border-[#2A2A2A] text-xs font-mono text-[#A0A0A0] cursor-pointer"
          >
            <User size={14} />
            <span className="hidden md:inline max-w-[100px] truncate">
              {user?.name || user?.email || 'Dispatcher'}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[#141414] border border-[#2A2A2A] shadow-2xl z-50 py-1 font-mono text-xs">
              <div className="px-3 py-2 border-b border-[#222222]">
                <p className="text-white font-semibold truncate">{user?.name || 'Dispatcher'}</p>
                <p className="text-[10px] text-[#666666] truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-[#221212] transition text-left cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
