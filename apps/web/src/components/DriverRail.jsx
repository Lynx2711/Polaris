import { Truck, Navigation, Clock, Radio, CheckCircle, EyeOff } from 'lucide-react';

export default function DriverRail({
  drivers = [],
  routes = [],
  driverColorMap = {},
  selectedDriverId,
  onSelectDriver,
  liveLocations = {},
  socketConnected,
  horizontal = false,
}) {
  const routesByDriver = {};
  routes.forEach((r) => {
    if (r.driver_id) routesByDriver[r.driver_id] = r;
  });

  if (drivers.length === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--ink-dim)' }}>
        <div className="text-center">
          <Truck size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">No drivers in fleet.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full polaris-transition ${horizontal ? 'flex flex-row overflow-x-auto overflow-y-hidden gap-0' : 'flex flex-col overflow-y-auto overflow-x-hidden'}`}
      style={{ background: 'var(--surface)' }}
    >
      {selectedDriverId && !horizontal && (
        <div
          className="px-4 py-2 flex items-center justify-between border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-xs" style={{ color: 'var(--ink-dim)' }}>Driver focused</span>
          <button
            onClick={() => onSelectDriver(null)}
            className="flex items-center gap-1 text-[11px] transition cursor-pointer hover:opacity-60"
            style={{ color: 'var(--ink-dim)' }}
          >
            <EyeOff size={11} />
            <span>Reset</span>
          </button>
        </div>
      )}

      {drivers.map((driver) => {
        const color = driverColorMap[driver.id] || '#60A5FA';
        const route = routesByDriver[driver.id];
        const liveLoc = liveLocations[driver.id];
        const isSelected = selectedDriverId === driver.id;

        if (horizontal) {
          // Compact card for horizontal bottom panel
          return (
            <div
              key={driver.id}
              onClick={() => onSelectDriver(isSelected ? null : driver.id)}
              className="shrink-0 h-full flex flex-col justify-between cursor-pointer transition-colors border-r polaris-transition"
              style={{
                width: '200px',
                background: isSelected ? 'var(--surface-raised)' : 'var(--surface)',
                borderColor: 'var(--border)',
                borderTop: `3px solid ${color}`,
                padding: '12px 14px',
              }}
            >
              {/* Top: name + status */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
                    {driver.name}
                  </span>
                  {liveLoc ? (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-1 shrink-0"
                      style={socketConnected ? {
                        background: 'color-mix(in srgb, #34D399 12%, transparent)',
                        color: '#34D399',
                      } : {
                        background: 'color-mix(in srgb, #FBBF24 12%, transparent)',
                        color: '#FBBF24',
                      }}
                    >
                      <Radio size={8} className={`inline mr-0.5 ${socketConnected ? 'animate-pulse' : ''}`} />
                      {socketConnected ? 'Live' : 'Stale'}
                    </span>
                  ) : (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full ml-1 shrink-0"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--ink-dim)' }}
                    >
                      Depot
                    </span>
                  )}
                </div>

                <p className="text-[11px]" style={{ color: 'var(--ink-dim)' }}>
                  Capacity: <strong style={{ color: 'var(--ink-muted)' }}>{driver.vehicle_capacity_kg} kg</strong>
                </p>
              </div>

              {/* Bottom: route stats */}
              {route ? (
                <div className="flex items-center gap-3 text-[11px] mt-2" style={{ color: 'var(--ink-dim)' }}>
                  <span className="flex items-center gap-1">
                    <CheckCircle size={10} style={{ color }} />
                    <span>{route.stops?.length || 0} stops</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Navigation size={10} />
                    <span>{route.total_distance_km?.toFixed(1) || 0} km</span>
                  </span>
                </div>
              ) : (
                <p className="text-[11px] italic mt-2" style={{ color: 'var(--ink-dim)' }}>
                  No route yet
                </p>
              )}
            </div>
          );
        }

        // Vertical (stacked) card
        return (
          <div
            key={driver.id}
            onClick={() => onSelectDriver(isSelected ? null : driver.id)}
            className="px-4 py-3.5 cursor-pointer transition-colors border-b polaris-transition"
            style={{
              background: isSelected ? 'var(--surface-raised)' : 'var(--surface)',
              borderColor: 'var(--border-light)',
              borderLeft: `3px solid ${color}`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  {driver.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {liveLoc ? (
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={socketConnected ? {
                      background: 'color-mix(in srgb, #34D399 12%, transparent)',
                      color: '#34D399',
                    } : {
                      background: 'color-mix(in srgb, #FBBF24 12%, transparent)',
                      color: '#FBBF24',
                    }}
                  >
                    <Radio size={9} className={socketConnected ? 'animate-pulse' : ''} />
                    {socketConnected ? 'Live' : 'Stale'}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--ink-dim)' }}>
                    Depot
                  </span>
                )}
                {isSelected && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
                    Focus
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] mb-2" style={{ color: 'var(--ink-muted)' }}>
              <span>Capacity <strong style={{ color: 'var(--ink)' }}>{driver.vehicle_capacity_kg} kg</strong></span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span style={{ color: 'var(--ink-dim)' }}>ID #{driver.id}</span>
            </div>

            {route ? (
              <div
                className="flex items-center justify-between text-[11px] px-3 py-2 polaris-transition"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--ink-muted)' }}
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={11} style={{ color }} />
                  <span><strong style={{ color: 'var(--ink)' }}>{route.stops?.length || 0}</strong> stops</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Navigation size={11} />
                  <span><strong style={{ color: 'var(--ink)' }}>{route.total_distance_km?.toFixed(1) || 0}</strong> km</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={11} />
                  <span><strong style={{ color: 'var(--ink)' }}>{route.total_duration_min ? Math.round(route.total_duration_min) : 0}</strong> min</span>
                </span>
              </div>
            ) : (
              <p className="text-[11px] italic" style={{ color: 'var(--ink-dim)' }}>
                No route assigned — run Optimize to solve.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
