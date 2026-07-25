import { Truck, Navigation, Clock, Radio, CheckCircle, Eye, EyeOff, Plus } from 'lucide-react';

export default function DriverRail({
  drivers = [],
  routes = [],
  driverColorMap = {},
  selectedDriverId,
  onSelectDriver,
  liveLocations = {},
  socketConnected,
  onOpenDriverModal,
}) {
  // Map route data by driver_id for quick lookup
  const routesByDriver = {};
  routes.forEach((r) => {
    if (r.driver_id) {
      routesByDriver[r.driver_id] = r;
    }
  });

  return (
    <div className="flex flex-col h-full bg-[#121212] border-r border-[#262626] w-full font-mono text-xs select-none">
      {/* Rail Header */}
      <div className="p-3 border-b border-[#262626] bg-[#0A0A0A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck size={15} className="text-[#A0A0A0]" />
          <span className="font-semibold text-white tracking-wide uppercase">FLEET RAIL ({drivers.length})</span>
          {onOpenDriverModal && (
            <button
              onClick={onOpenDriverModal}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-white/5 hover:bg-white/10 text-white border border-white/10 transition cursor-pointer font-bold rounded"
              title="Add a new driver"
            >
              <Plus size={10} />
              <span>ADD</span>
            </button>
          )}
        </div>
        {selectedDriverId && (
          <button
            onClick={() => onSelectDriver(null)}
            className="flex items-center gap-1 text-[10px] text-[#8C8C8C] hover:text-white transition cursor-pointer"
          >
            <EyeOff size={11} />
            <span>RESET FOCUS</span>
          </button>
        )}
      </div>

      {/* Driver List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1F1F1F]">
        {drivers.length === 0 ? (
          <div className="p-6 text-center text-[#666666]">
            <p className="text-xs">No active drivers in fleet.</p>
          </div>
        ) : (
          drivers.map((driver) => {
            const color = driverColorMap[driver.id] || '#5B7FBD';
            const route = routesByDriver[driver.id];
            const liveLoc = liveLocations[driver.id];
            const isSelected = selectedDriverId === driver.id;

            return (
              <div
                key={driver.id}
                onClick={() => onSelectDriver(isSelected ? null : driver.id)}
                className={`p-3.5 transition cursor-pointer relative group ${
                  isSelected ? 'bg-[#1C1C1C]' : 'hover:bg-[#181818]'
                }`}
                style={{
                  borderLeft: `4px solid ${color}`,
                }}
              >
                {/* Driver Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {/* Color Swatch / Badge */}
                    <div
                      className="w-3 h-3 rounded-none shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-bold text-white tracking-wide">{driver.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {liveLoc ? (
                      <span
                        className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] ${
                          socketConnected
                            ? 'bg-[#051F15] text-[#34D399] border border-[#10B981]/30'
                            : 'bg-[#211505] text-[#FBBF24] border border-[#F59E0B]/30'
                        }`}
                      >
                        <Radio size={9} className={socketConnected ? 'animate-pulse' : ''} />
                        {socketConnected ? 'LIVE' : 'STALE'}
                      </span>
                    ) : (
                      <span className="text-[9px] text-[#555555]">DEPOT</span>
                    )}

                    {isSelected && (
                      <span className="text-[9px] bg-white text-black px-1 font-bold">
                        FOCUS
                      </span>
                    )}
                  </div>
                </div>

                {/* Driver Specs */}
                <div className="grid grid-cols-2 gap-1 text-[11px] text-[#8C8C8C] mb-2">
                  <div>
                    <span>CAPACITY: </span>
                    <strong className="text-[#CCCCCC]">{driver.vehicle_capacity_kg} KG</strong>
                  </div>
                  <div className="text-right">
                    <span>ID: </span>
                    <strong className="text-[#CCCCCC]">#{driver.id}</strong>
                  </div>
                </div>

                {/* Assigned Route Summary if available */}
                {route ? (
                  <div className="bg-[#0D0D0D] border border-[#222222] p-2 space-y-1 mt-2">
                    <div className="flex items-center justify-between text-[10px] text-[#A0A0A0]">
                      <span className="flex items-center gap-1">
                        <CheckCircle size={10} style={{ color }} />
                        <span>STOPS: <strong className="text-white">{route.stops?.length || 0}</strong></span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Navigation size={10} className="text-[#8C8C8C]" />
                        <span>{route.total_distance_km ? route.total_distance_km.toFixed(1) : 0} KM</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8C8C8C]">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        <span>EST. TIME</span>
                      </span>
                      <span className="text-white font-bold">
                        {route.total_duration_min ? Math.round(route.total_duration_min) : 0} MINS
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-[#555555] italic mt-1">
                    No route assigned yet. Click optimize to solve.
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
