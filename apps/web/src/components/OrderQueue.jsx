import { useState } from 'react';
import { Package, Clock, MapPin, AlertTriangle, CheckCircle, Scale } from 'lucide-react';

/**
 * Checks if an order's deadline_end is within 2 hours from now.
 */
export function isTimeWindowAtRisk(deadlineEnd) {
  if (!deadlineEnd) return false;
  const now = new Date();
  const end = new Date(deadlineEnd);
  const diffMs = end.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= 2; // true if deadline is within 2 hours or expired
}

export default function OrderQueue({
  orders = [],
  selectedOrderId,
  onSelectOrder,
}) {
  const [filter, setFilter] = useState('unassigned'); // 'unassigned' | 'all'

  const filteredOrders = orders.filter((o) => {
    if (filter === 'unassigned') {
      return !o.status || o.status === 'pending' || o.status === 'unassigned';
    }
    return true;
  });

  const riskCount = orders.filter((o) => isTimeWindowAtRisk(o.deadline_end)).length;

  return (
    <div className="flex flex-col h-full bg-[#121212] border-r border-[#262626] w-full font-mono text-xs select-none">
      {/* Queue Header */}
      <div className="p-3 border-b border-[#262626] bg-[#0A0A0A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={15} className="text-[#A0A0A0]" />
          <span className="font-semibold text-white tracking-wide uppercase">ORDER QUEUE ({filteredOrders.length})</span>
        </div>

        {/* Filter Toggle */}
        <div className="flex border border-[#262626] bg-[#141414]">
          <button
            onClick={() => setFilter('unassigned')}
            className={`px-2 py-0.5 text-[10px] transition cursor-pointer ${
              filter === 'unassigned' ? 'bg-white text-black font-bold' : 'text-[#8C8C8C] hover:text-white'
            }`}
          >
            UNASSIGNED
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 text-[10px] transition cursor-pointer ${
              filter === 'all' ? 'bg-white text-black font-bold' : 'text-[#8C8C8C] hover:text-white'
            }`}
          >
            ALL
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1F1F1F]">
        {filteredOrders.length === 0 ? (
          <div className="p-6 text-center text-[#666666]">
            <p className="text-xs">No {filter} orders in queue.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isRisk = isTimeWindowAtRisk(order.deadline_end);
            const isSelected = selectedOrderId === order.id;
            const isAssigned = order.status === 'assigned';

            // Format deadline date cleanly
            const deadlineTime = order.deadline_end
              ? new Date(order.deadline_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'N/A';

            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder(isSelected ? null : order.id)}
                className={`p-3.5 transition cursor-pointer relative ${
                  isRisk ? 'risk-amber-border' : 'border-l-4 border-transparent'
                } ${isSelected ? 'bg-[#1C1C1C]' : 'hover:bg-[#181818]'}`}
              >
                {/* Top Row: Order ID + Status / Risk Badge */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white tracking-wide">ORDER #{order.id}</span>
                    {isAssigned ? (
                      <span className="flex items-center gap-1 text-[9px] bg-[#051F15] text-[#34D399] border border-[#10B981]/30 px-1.5 py-0.5">
                        <CheckCircle size={9} />
                        ASSIGNED
                      </span>
                    ) : (
                      <span className="text-[9px] bg-[#1A1A1A] text-[#A0A0A0] border border-[#333333] px-1.5 py-0.5">
                        PENDING
                      </span>
                    )}
                  </div>

                  {isRisk && (
                    <span className="flex items-center gap-1 text-[9px] font-bold bg-[#261500] text-[#F59E0B] border border-[#F59E0B]/50 px-1.5 py-0.5 animate-pulse">
                      <AlertTriangle size={10} />
                      2H RISK
                    </span>
                  )}
                </div>

                {/* Delivery Address */}
                <div className="flex items-start gap-1.5 text-[11px] text-[#CCCCCC] mb-2 leading-relaxed">
                  <MapPin size={12} className="text-[#8C8C8C] shrink-0 mt-0.5" />
                  <span className="truncate">{order.address || `Point (${order.lat}, ${order.lng})`}</span>
                </div>

                {/* Specs: Weight + Deadline Window */}
                <div className="grid grid-cols-2 gap-2 text-[10px] text-[#8C8C8C] bg-[#0A0A0A] p-2 border border-[#1F1F1F]">
                  <div className="flex items-center gap-1">
                    <Scale size={11} className="text-[#A0A0A0]" />
                    <span>WEIGHT: <strong className="text-white">{order.weight_kg} KG</strong></span>
                  </div>

                  <div className="flex items-center gap-1 justify-end">
                    <Clock size={11} className={isRisk ? 'text-[#F59E0B]' : 'text-[#A0A0A0]'} />
                    <span>DUE: <strong className={isRisk ? 'text-[#F59E0B] font-bold' : 'text-white'}>{deadlineTime}</strong></span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
