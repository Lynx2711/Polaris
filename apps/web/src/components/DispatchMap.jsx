import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Center of Jalandhar-Phagwara corridor depot
const DEFAULT_DEPOT = { lat: 31.298, lng: 75.647 };

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper component to auto-fit bounds when routes or focus change
function MapBoundsController({ routes, selectedDriverId, drivers, liveLocations }) {
  const map = useMap();

  useEffect(() => {
    if (selectedDriverId) {
      // Find driver route or position
      const driverRoute = routes.find((r) => r.driver_id === selectedDriverId);
      const liveLoc = liveLocations[selectedDriverId];
      const driverObj = drivers.find((d) => d.id === selectedDriverId);

      if (driverRoute?.geometry && driverRoute.geometry.length > 0) {
        const bounds = L.latLngBounds(driverRoute.geometry);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true });
      } else if (liveLoc) {
        map.flyTo([liveLoc.lat, liveLoc.lng], 14, { animate: true });
      } else if (driverObj) {
        map.flyTo([driverObj.home_lat, driverObj.home_lng], 14, { animate: true });
      }
    }
  }, [selectedDriverId, routes, drivers, liveLocations, map]);

  return null;
}

export default function DispatchMap({
  drivers = [],
  orders = [],
  routes = [],
  driverColorMap = {},
  selectedDriverId,
  onSelectDriver,
  liveLocations = {},
  socketConnected,
  selectedOrderId,
}) {
  // Create custom Depot icon
  const depotIcon = L.divIcon({
    className: 'depot-marker-div',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: #0A0A0A;
        border: 2px solid #FFFFFF;
        box-shadow: 0 0 16px rgba(255,255,255,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-family: 'Space Grotesk', monospace;
        font-size: 11px;
        font-weight: 700;
      ">
        DEPOT
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  // Helper to create Driver Marker Icon
  const createDriverIcon = (driver, color, isLive, isSelected) => {
    return L.divIcon({
      className: 'driver-marker-div',
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: ${isSelected ? '28px' : '22px'};
            height: ${isSelected ? '28px' : '22px'};
            background-color: ${color};
            border: 2px solid #FFFFFF;
            box-shadow: 0 0 ${isSelected ? '20px' : '10px'} ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          ">
            <span style="color: #FFFFFF; font-size: 10px; font-weight: 800; font-family: monospace;">
              D${driver.id}
            </span>
          </div>
          ${
            isLive
              ? `<div class="live-pulse-dot" style="
                  position: absolute;
                  inset: -6px;
                  border: 2px solid ${color};
                  pointer-events: none;
                "></div>`
              : ''
          }
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  // Helper to create Order Marker Icon
  const createOrderIcon = (order, isAssigned, driverColor, sequenceNo) => {
    if (isAssigned && driverColor) {
      return L.divIcon({
        className: 'assigned-stop-icon',
        html: `
          <div style="
            width: 22px;
            height: 22px;
            background: #0A0A0A;
            border: 2px solid ${driverColor};
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 700;
            font-family: monospace;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.6);
          ">
            ${sequenceNo || '•'}
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
    }

    return L.divIcon({
      className: 'unassigned-order-icon',
      html: `
        <div style="
          width: 18px;
          height: 18px;
          background: #F59E0B;
          border: 2px solid #0A0A0A;
          color: #0A0A0A;
          font-size: 10px;
          font-weight: 800;
          font-family: monospace;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(245,158,11,0.5);
        ">
          #${order.id}
        </div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  };

  // Build map of stops by order_id to locate sequence and driver color
  const orderStopInfo = {};
  routes.forEach((route) => {
    const color = driverColorMap[route.driver_id] || '#FFFFFF';
    if (route.stops) {
      route.stops.forEach((stop) => {
        orderStopInfo[stop.order_id] = {
          driverId: route.driver_id,
          sequenceNo: stop.sequence_no,
          color,
          eta: stop.eta,
        };
      });
    }
  });

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[DEFAULT_DEPOT.lat, DEFAULT_DEPOT.lng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        {/* Dark Tile Layer (CartoDB Dark Matter) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>'
          maxZoom={19}
        />

        {/* Dynamic Bounds Controller */}
        <MapBoundsController
          routes={routes}
          selectedDriverId={selectedDriverId}
          drivers={drivers}
          liveLocations={liveLocations}
        />

        {/* Central Depot Hub Marker */}
        <Marker position={[DEFAULT_DEPOT.lat, DEFAULT_DEPOT.lng]} icon={depotIcon}>
          <Popup>
            <div className="font-mono text-xs">
              <strong className="text-white">POLARIS CENTRAL DEPOT</strong>
              <p className="text-[#A0A0A0] text-[10px] mt-1">Jalandhar-Phagwara Corridor Logistics Depot</p>
            </div>
          </Popup>
        </Marker>

        {/* Real Geometry Route Polylines */}
        {routes.map((route) => {
          if (!route.geometry || route.geometry.length === 0) return null;

          const color = driverColorMap[route.driver_id] || '#38BDF8';
          const isSelected = selectedDriverId === route.driver_id;
          const isDimmed = selectedDriverId !== null && selectedDriverId !== route.driver_id;

          const weight = isSelected ? 7 : isDimmed ? 2 : 5;
          const opacity = isSelected ? 1.0 : isDimmed ? 0.15 : 0.85;

          return (
            <Polyline
              key={route.id || route.driver_id}
              positions={route.geometry}
              pathOptions={{
                color: color,
                weight: weight,
                opacity: opacity,
                lineCap: 'square',
                lineJoin: 'miter',
              }}
              eventHandlers={{
                click: () => onSelectDriver(route.driver_id),
              }}
            >
              <Popup>
                <div className="font-mono text-xs space-y-1">
                  <div className="flex items-center gap-1.5 border-b border-[#333333] pb-1">
                    <span className="w-2.5 h-2.5" style={{ backgroundColor: color }} />
                    <strong className="text-white">DRIVER #{route.driver_id} ROUTE</strong>
                  </div>
                  <p className="text-[#A0A0A0] text-[10px]">
                    Distance: <strong className="text-white">{route.total_distance_km.toFixed(1)} km</strong>
                  </p>
                  <p className="text-[#A0A0A0] text-[10px]">
                    Duration: <strong className="text-white">{Math.round(route.total_duration_min)} mins</strong>
                  </p>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Driver Live / Home Markers */}
        {drivers.map((driver) => {
          const color = driverColorMap[driver.id] || '#5B7FBD';
          const liveLoc = liveLocations[driver.id];
          const position = liveLoc ? [liveLoc.lat, liveLoc.lng] : [driver.home_lat, driver.home_lng];
          const isSelected = selectedDriverId === driver.id;
          const icon = createDriverIcon(driver, color, !!liveLoc, isSelected);

          return (
            <Marker
              key={`driver-${driver.id}`}
              position={position}
              icon={icon}
              eventHandlers={{
                click: () => onSelectDriver(isSelected ? null : driver.id),
              }}
            >
              <Popup>
                <div className="font-mono text-xs space-y-1">
                  <div className="flex items-center gap-2 border-b border-[#333333] pb-1">
                    <span className="w-3 h-3" style={{ backgroundColor: color }} />
                    <strong className="text-white">{driver.name}</strong>
                  </div>
                  <p className="text-[#A0A0A0] text-[10px]">Capacity: {driver.vehicle_capacity_kg} kg</p>
                  <p className="text-[#A0A0A0] text-[10px]">
                    Status:{' '}
                    {liveLoc ? (
                      <span className={socketConnected ? 'text-[#34D399] font-bold' : 'text-[#FBBF24]'}>
                        {socketConnected ? '● Live Location Ping' : '▲ Stale Ping (Socket Offline)'}
                      </span>
                    ) : (
                      'Depot Home'
                    )}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Order Location Pins */}
        {orders.map((order) => {
          const stopInfo = orderStopInfo[order.id];
          const isAssigned = !!stopInfo;
          const icon = createOrderIcon(
            order,
            isAssigned,
            stopInfo?.color,
            stopInfo?.sequenceNo
          );

          return (
            <Marker
              key={`order-${order.id}`}
              position={[order.lat, order.lng]}
              icon={icon}
            >
              <Popup>
                <div className="font-mono text-xs space-y-1">
                  <strong className="text-white">ORDER #{order.id}</strong>
                  <p className="text-[#A0A0A0] text-[10px] truncate max-w-[200px]">{order.address}</p>
                  <p className="text-[#A0A0A0] text-[10px]">Weight: {order.weight_kg} kg</p>
                  {isAssigned && (
                    <p className="text-[#34D399] text-[10px]">
                      Assigned to Driver #{stopInfo.driverId} (Stop #{stopInfo.sequenceNo})
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}