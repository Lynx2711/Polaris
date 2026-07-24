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

// Original Leaflet / OpenStreetMap full-color natural map tile layers
const TILE_LAYERS = {
  // Leaflet original full-detail OpenStreetMap tile layer (showing green grass, parks, water, roads)
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  // Carto Voyager — full detail colorful map
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
  },
};

// Tile layer component displaying natural full-detail map tiles
function NaturalMapTileLayer() {
  const map = useMap();
  const layer = TILE_LAYERS.osm;

  useEffect(() => {
    map.eachLayer((l) => {
      if (l instanceof L.TileLayer) map.removeLayer(l);
    });
    L.tileLayer(layer.url, {
      attribution: layer.attribution,
      maxZoom: 19,
    }).addTo(map);
  }, [map, layer]);

  return null;
}

// Automatically triggers map.invalidateSize() when container resizes
function AutoInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

// Fits the map to all loaded data: depot + order pins + full route geometry.
function FitBoundsToRoutes({ routes, orders, depot }) {
  const map = useMap();

  useEffect(() => {
    const allPoints = [];

    // depot
    if (depot) allPoints.push([depot.lat, depot.lng]);

    // every order pin
    orders.forEach((o) => allPoints.push([o.lat, o.lng]));

    // every route's full geometry (the actual road path)
    routes.forEach((r) => {
      if (r.geometry) {
        r.geometry.forEach((point) => allPoints.push(point));
      }
    });

    if (allPoints.length > 0) {
      map.fitBounds(allPoints, { padding: [40, 40] });
    }
  }, [routes, orders, depot, map]);

  return null;
}

export default function DispatchMap({
  theme = 'dark',
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
  const isDark = theme === 'dark';

  // Colors that adapt to light/dark for popups & markers
  const popupBg     = isDark ? '#121212' : '#FFFFFF';
  const popupText   = isDark ? '#FFFFFF' : '#0A0A0A';
  const popupMuted  = isDark ? '#A0A0A0' : '#575757';
  const popupBorder = isDark ? '#262626' : '#E5E5E5';

  // Depot icon — soft rounded badge with subtle shadow
  const depotIcon = L.divIcon({
    className: 'depot-marker-div',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: #0A0A0A;
        border: 2px solid #FFFFFF;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.05em;
      ">
        DEPOT
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  // Driver marker icon — rounded pill badge with shadow
  const createDriverIcon = (driver, color, isLive, isSelected) => {
    return L.divIcon({
      className: 'driver-marker-div',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            width: ${isSelected ? '32px' : '26px'};
            height: ${isSelected ? '32px' : '26px'};
            background-color: ${color};
            border: 2px solid #FFFFFF;
            border-radius: 9999px;
            box-shadow: 0 4px 12px ${color}60, 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          ">
            <span style="color: #FFFFFF; font-size: 9px; font-weight: 800; font-family: 'Space Grotesk', monospace; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">
              D${driver.id}
            </span>
          </div>
          ${isLive
            ? `<div class="live-pulse-dot" style="position: absolute; inset: -5px; border-radius: 9999px; border: 2px solid ${color}; pointer-events: none;"></div>`
            : ''}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Order marker icon — rounded soft pin
  const createOrderIcon = (order, isAssigned, driverColor, sequenceNo) => {
    if (isAssigned && driverColor) {
      return L.divIcon({
        className: 'assigned-stop-icon',
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background: ${popupBg};
            border: 2px solid ${driverColor};
            border-radius: 8px;
            color: ${popupText};
            font-size: 10px;
            font-weight: 700;
            font-family: 'Space Grotesk', monospace;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.25);
          ">
            ${sequenceNo || '·'}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    }

    return L.divIcon({
      className: 'unassigned-order-icon',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: #D97706;
          border: 2px solid #FFFFFF;
          border-radius: 6px;
          color: #FFFFFF;
          font-size: 9px;
          font-weight: 800;
          font-family: 'Space Grotesk', monospace;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 8px rgba(217,119,6,0.5);
        ">
          #${order.id}
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  // Build map of stops by order_id
  const orderStopInfo = {};
  routes.forEach((route) => {
    const color = driverColorMap[route.driver_id] || '#2563EB';
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

  // Popup style
  const popupStyle = `
    padding: 12px 14px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 12px;
    background: ${popupBg};
    color: ${popupText};
    border-radius: 12px;
    min-width: 170px;
  `;
  const labelStyle = `color: ${popupMuted}; font-size: 11px;`;
  const dividerStyle = `border-bottom: 1px solid ${popupBorder}; margin-bottom: 8px; padding-bottom: 6px;`;

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[DEFAULT_DEPOT.lat, DEFAULT_DEPOT.lng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        {/* Original full-color Leaflet tile layer (showing green grass, parks, water, roads) */}
        <NaturalMapTileLayer />

        {/* Auto invalidate size on resize */}
        <AutoInvalidateSize />

        {/* Fit map to all loaded data */}
        <FitBoundsToRoutes
          routes={routes}
          orders={orders}
          depot={DEFAULT_DEPOT}
        />

        {/* Central Depot Marker */}
        <Marker position={[DEFAULT_DEPOT.lat, DEFAULT_DEPOT.lng]} icon={depotIcon}>
          <Popup>
            <div style={popupStyle}>
              <div style={dividerStyle}>
                <strong>Polaris Central Depot</strong>
              </div>
              <span style={labelStyle}>Jalandhar-Phagwara Corridor</span>
            </div>
          </Popup>
        </Marker>

        {/* Route Polylines */}
        {routes.map((route) => {
          if (!route.geometry || route.geometry.length === 0) return null;

          const color = driverColorMap[route.driver_id] || '#2563EB';
          const isSelected = selectedDriverId === route.driver_id;
          const isDimmed = selectedDriverId !== null && selectedDriverId !== route.driver_id;

          return (
            <Polyline
              key={route.id || route.driver_id}
              positions={route.geometry}
              pathOptions={{
                color: color,
                weight: isSelected ? 6 : isDimmed ? 2 : 4,
                opacity: isSelected ? 1.0 : isDimmed ? 0.2 : 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{
                click: () => onSelectDriver(route.driver_id),
              }}
            >
              <Popup>
                <div style={popupStyle}>
                  <div style={dividerStyle}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        background: color,
                        marginRight: '6px',
                        verticalAlign: 'middle',
                        borderRadius: '50%',
                      }}
                    />
                    <strong>Driver #{route.driver_id} Route</strong>
                  </div>
                  <div style={`${labelStyle} display: flex; flex-direction: column; gap: 3px;`}>
                    <span>Distance: <strong style={`color: ${popupText};`}>{route.total_distance_km?.toFixed(1)} km</strong></span>
                    <span>Duration: <strong style={`color: ${popupText};`}>{Math.round(route.total_duration_min)} min</strong></span>
                  </div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Driver Markers */}
        {drivers.map((driver) => {
          const color = driverColorMap[driver.id] || '#2563EB';
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
                <div style={popupStyle}>
                  <div style={dividerStyle}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        background: color,
                        marginRight: '6px',
                        verticalAlign: 'middle',
                        borderRadius: '50%',
                      }}
                    />
                    <strong>{driver.name}</strong>
                  </div>
                  <div style={`${labelStyle} display: flex; flex-direction: column; gap: 3px;`}>
                    <span>Capacity: <strong style={`color: ${popupText};`}>{driver.vehicle_capacity_kg} kg</strong></span>
                    <span>Status: <strong style={`color: ${liveLoc && socketConnected ? '#059669' : popupText};`}>
                      {liveLoc ? (socketConnected ? 'Live tracking' : 'Stale ping') : 'At depot'}
                    </strong></span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Order Pins */}
        {orders.map((order) => {
          const stopInfo = orderStopInfo[order.id];
          const isAssigned = !!stopInfo;
          const icon = createOrderIcon(order, isAssigned, stopInfo?.color, stopInfo?.sequenceNo);

          return (
            <Marker
              key={`order-${order.id}`}
              position={[order.lat, order.lng]}
              icon={icon}
            >
              <Popup>
                <div style={popupStyle}>
                  <div style={dividerStyle}>
                    <strong>Order #{order.id}</strong>
                  </div>
                  <div style={`${labelStyle} display: flex; flex-direction: column; gap: 3px;`}>
                    <span style={`max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`}>
                      {order.address || `${order.lat}, ${order.lng}`}
                    </span>
                    <span>Weight: <strong style={`color: ${popupText};`}>{order.weight_kg} kg</strong></span>
                    {isAssigned && (
                      <span style="color: #059669;">
                        → Driver #{stopInfo.driverId}, Stop #{stopInfo.sequenceNo}
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}