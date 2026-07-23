import { AlertTriangle, X, Package, ShieldAlert } from 'lucide-react';

export default function SolveFailedModal({
  isOpen,
  onClose,
  errorMessage,
  unassignedOrderIds = [],
  orders = [],
}) {
  if (!isOpen) return null;

  // Resolve unassigned order objects
  const unassignedOrders = orders.filter((o) => unassignedOrderIds.includes(o.id));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono select-none">
      <div className="bg-[#121212] border border-[#F43F5E]/50 w-full max-w-lg shadow-2xl p-6 relative text-xs">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8C8C8C] hover:text-white transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#262626] pb-4 mb-4">
          <div className="p-2.5 bg-[#2B1216] border border-[#F43F5E]/40 text-[#F43F5E]">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 className="font-bold text-base text-white uppercase tracking-wide">
              Route Optimization Error
            </h3>
            <p className="text-[11px] text-[#A0A0A0] mt-0.5">
              The solver encountered constraint conflicts or capacity limits.
            </p>
          </div>
        </div>

        {/* Error Detail Box */}
        <div className="bg-[#1A0C0E] border border-[#5C1D24] p-3 mb-4 text-[#FB7185] leading-relaxed">
          <p className="font-bold uppercase text-[10px] text-[#F43F5E] mb-1">
            Diagnostic Message:
          </p>
          <p>{errorMessage || 'One or more orders could not be placed within vehicle capacities or time windows.'}</p>
        </div>

        {/* Unassigned Orders List if any */}
        {unassignedOrderIds.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-white font-bold flex items-center gap-2">
              <Package size={14} className="text-[#F59E0B]" />
              <span>UNASSIGNED ORDERS ({unassignedOrderIds.length})</span>
            </h4>

            <div className="max-h-40 overflow-y-auto border border-[#262626] bg-[#0A0A0A] divide-y divide-[#1F1F1F]">
              {unassignedOrders.length > 0 ? (
                unassignedOrders.map((o) => (
                  <div key={o.id} className="p-2 flex items-center justify-between text-[#CCCCCC]">
                    <div>
                      <span className="font-bold text-white">ORDER #{o.id}</span>
                      <span className="text-[#8C8C8C] text-[10px] ml-2 block truncate max-w-[240px]">
                        {o.address}
                      </span>
                    </div>
                    <span className="bg-[#261500] text-[#F59E0B] border border-[#F59E0B]/30 px-1.5 py-0.5 text-[10px] font-bold">
                      {o.weight_kg} KG
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-[#A0A0A0]">
                  Order IDs: {unassignedOrderIds.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-2 border-t border-[#262626]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-[#0A0A0A] font-bold hover:bg-[#E5E5E5] transition cursor-pointer"
          >
            DISMISS ALERT
          </button>
        </div>
      </div>
    </div>
  );
}
