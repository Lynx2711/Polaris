import { RefreshCw, Plus, Package, Truck, Compass } from 'lucide-react';

export default function EmptyState({ onSeedData, isSeeding, onOpenOrderModal, onOpenDriverModal }) {
  return (
    <div className="flex-1 h-full bg-[#0A0A0A] flex flex-col items-center justify-center p-8 font-mono text-center select-none">
      <div className="max-w-md bg-[#121212] border border-[#262626] p-8 shadow-2xl space-y-6">
        {/* Radar Icon lockup */}
        <div className="w-16 h-16 bg-[#1A1A1A] border border-[#333333] mx-auto flex items-center justify-center text-white shadow-inner">
          <Compass size={32} className="animate-spin-slow text-[#38BDF8]" />
        </div>

        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            OPERATIONS TERMINAL READY
          </h2>
          <p className="text-xs text-[#8C8C8C] mt-2 leading-relaxed">
            No active fleet drivers or pending delivery orders registered in your organization yet.
          </p>
        </div>

        {/* Primary Action: 1-Click Seed Demo Fleet */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onSeedData}
            disabled={isSeeding}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white text-[#0A0A0A] font-bold text-xs hover:bg-[#E5E5E5] transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={isSeeding ? 'animate-spin' : ''} />
            <span>{isSeeding ? 'SEEDING FLEET DATA...' : 'SEED DEMO FLEET & ORDERS (JALANDHAR)'}</span>
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={onOpenDriverModal}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1A1A1A] hover:bg-[#222222] text-[#A0A0A0] hover:text-white border border-[#333333] transition cursor-pointer"
            >
              <Truck size={13} />
              <span>+ ADD DRIVER</span>
            </button>

            <button
              onClick={onOpenOrderModal}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1A1A1A] hover:bg-[#222222] text-[#A0A0A0] hover:text-white border border-[#333333] transition cursor-pointer"
            >
              <Package size={13} />
              <span>+ ADD ORDER</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-[#1F1F1F] text-[10px] text-[#555555]">
          POLARIS CVRPTW ROUTE OPTIMIZATION ENGINE
        </div>
      </div>
    </div>
  );
}
