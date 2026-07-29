import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { captureUserLocation } from '../utils/geolocation';
import { reverseGeocode } from '../services/places';

// Center of Jalandhar-Phagwara corridor depot
const DEFAULT_DEPOT = { lat: 31.298, lng: 75.647 };

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Module-level stable icon factories (not recreated on each render) ──

// Depot Icon
const depotIcon = L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;background:#1A1C1C;display:flex;align-items:center;justify-content:center;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer;">
    <span class="material-symbols-outlined" style="color:#fff;font-size:16px;line-height:1;">hub</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// User GPS location icon
const userLocIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
    <div style="width:16px;height:16px;border-radius:50%;background:#2563EB;border:2px solid #fff;box-shadow:0 0 0 3px rgba(37,99,235,0.25);"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Driver icon factory — uses the driver's actual color from the palette
function makeDriverIcon(color, isLive, isSelected) {
  const size = isSelected ? 38 : 32;
  const ring = isSelected ? `box-shadow:0 0 0 3px ${color},0 0 0 5px rgba(0,0,0,0.15);` : '';
  const pulse = isLive
    ? `<div class="marker-pulse" style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${color};pointer-events:none;"></div>`
    : '';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${size}px;height:${size}px;">
      <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;${ring}transition:transform 0.2s;">
        <span class="material-symbols-outlined" style="color:#fff;font-size:${isSelected ? 18 : 14}px;line-height:1;">local_shipping</span>
      </div>
      ${pulse}
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Order icon factory
function makeOrderIcon(isAssigned, driverColor, sequenceNo) {
  if (isAssigned && driverColor) {
    return L.divIcon({
      className: '',
      html: `<div style="width:24px;height:24px;border-radius:50%;background:${driverColor};border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.25);font-size:9px;font-weight:700;color:#fff;font-family:Inter,monospace;">
        ${sequenceNo || '·'}
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#9b4500;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.2);cursor:pointer;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// ── Inner sub-components ──

function NaturalMapTileLayer() {
  const map = useMap();
  useEffect(() => {
    map.eachLayer((l) => { if (l instanceof L.TileLayer) map.removeLayer(l); });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
  }, [map]);
  return null;
}

function AutoInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function SmoothFlyToController({ focusPosition, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (focusPosition && focusPosition[0] && focusPosition[1]) {
      map.flyTo(focusPosition, zoom, { duration: 0.8, animate: true });
    }
  }, [focusPosition, zoom, map]);
  return null;
}

function FitBoundsToRoutes({ routes, orders, depot, selectedDriverId }) {
  const map = useMap();
  useEffect(() => {
    const allPoints = [];
    if (depot && typeof depot.lat === 'number' && typeof depot.lng === 'number') {
      allPoints.push([depot.lat, depot.lng]);
    }
    const activeRoutes = selectedDriverId
      ? routes.filter((r) => String(r.driver_id) === String(selectedDriverId))
      : routes;
    const activeOrders = selectedDriverId
      ? orders.filter((o) => activeRoutes.some((r) => r.stops?.some((s) => String(s.order_id) === String(o.id))))
      : orders;
    activeOrders.forEach((o) => {
      const lat = parseFloat(o.lat); const lng = parseFloat(o.lng);
      if (!isNaN(lat) && !isNaN(lng)) allPoints.push([lat, lng]);
    });
    activeRoutes.forEach((r) => {
      if (Array.isArray(r.geometry)) {
        r.geometry.forEach((point) => {
          if (Array.isArray(point) && point.length >= 2) {
            const lat = parseFloat(point[0]); const lng = parseFloat(point[1]);
            if (!isNaN(lat) && !isNaN(lng)) allPoints.push([lat, lng]);
          }
        });
      }
    });
    if (allPoints.length > 1) {
      map.fitBounds(allPoints, { padding: [40, 40], maxZoom: 15 });
    }
  }, [routes, orders, depot, selectedDriverId, map]);
  return null;
}

function MapZoomButtons() {
  const map = useMap();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button type="button" onClick={() => map.zoomIn()}
        style={{ width: 36, height: 36, background: '#fff', border: '1px solid #E5E5E5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
      </button>
      <button type="button" onClick={() => map.zoomOut()}
        style={{ width: 36, height: 36, background: '#fff', border: '1px solid #E5E5E5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
      </button>
    </div>
  );
}

// ── Error boundary to prevent full-page crash on Leaflet errors ──
class MapErrorBoundary extends Error {}

// ── Main DispatchMap component ──
export default function DispatchMap({
  theme = 'light',
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
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [focusPosition, setFocusPosition] = useState(null);
  const [routeStartAddresses, setRouteStartAddresses] = useState({});
  const [mapError, setMapError] = useState(null);

  // ── Memoized icon maps — icons are only recreated when the relevant state changes ──
  const driverIconMap = useMemo(() => {
    const map = {};
    drivers.forEach((driver) => {
      const color = driverColorMap[driver.id] || '#2B5D4F';
      const liveLoc = liveLocations[driver.id];
      const isSelected = selectedDriverId === driver.id;
      map[driver.id] = makeDriverIcon(color, !!liveLoc, isSelected);
    });
    return map;
  }, [drivers, driverColorMap, liveLocations, selectedDriverId]);

  // Build order stop info map (which route/driver/sequence each order belongs to)
  const orderStopInfo = useMemo(() => {
    const info = {};
    routes.forEach((route) => {
      const color = driverColorMap[route.driver_id] || '#2B5D4F';
      if (route.stops) {
        route.stops.forEach((stop) => {
          info[stop.order_id] = {
            driverId: route.driver_id,
            sequenceNo: stop.sequence_no,
            color,
            eta: stop.eta,
          };
        });
      }
    });
    return info;
  }, [routes, driverColorMap]);

  // Memoized order icons
  const orderIconMap = useMemo(() => {
    const map = {};
    orders.forEach((order) => {
      const stopInfo = orderStopInfo[order.id];
      map[order.id] = makeOrderIcon(!!stopInfo, stopInfo?.color, stopInfo?.sequenceNo);
    });
    return map;
  }, [orders, orderStopInfo]);

  // ── Geolocation ──
  const handleDetectLocation = useCallback(() => {
    setIsLocating(true);
    captureUserLocation(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        setFocusPosition([lat, lng]);
        setIsLocating(false);
        try {
          const addr = await reverseGeocode(lat, lng);
          setUserAddress(addr);
        } catch (e) {
          setUserAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Two-tier location detection failed:', err);
        alert('Could not detect location. Please use manual address search.');
      }
    );
  }, []);

  // ── Reverse Geocode Route Start Points ──
  useEffect(() => {
    routes.forEach(async (route) => {
      if (route.geometry && route.geometry.length > 0 && !routeStartAddresses[route.id]) {
        const startPoint = route.geometry[0];
        try {
          const addr = await reverseGeocode(startPoint[0], startPoint[1]);
          setRouteStartAddresses((prev) => ({ ...prev, [route.id]: addr }));
        } catch (e) { /* ignore */ }
      }
    });
  }, [routes]);

  // ── Focus flyTo when driver/order selected ──
  useEffect(() => {
    if (selectedDriverId) {
      const driver = drivers.find((d) => d.id === selectedDriverId);
      const liveLoc = liveLocations[selectedDriverId];
      if (liveLoc) setFocusPosition([liveLoc.lat, liveLoc.lng]);
      else if (driver && driver.home_lat && driver.home_lng) setFocusPosition([parseFloat(driver.home_lat), parseFloat(driver.home_lng)]);
    }
  }, [selectedDriverId, drivers, liveLocations]);

  useEffect(() => {
    if (selectedOrderId) {
      const order = orders.find((o) => o.id === selectedOrderId);
      if (order && order.lat && order.lng) setFocusPosition([parseFloat(order.lat), parseFloat(order.lng)]);
    }
  }, [selectedOrderId, orders]);

  if (mapError) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9F9F9', flexDirection: 'column', gap: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#8C8C8C' }}>map_off</span>
        <p style={{ fontSize: 13, color: '#666', fontFamily: 'Inter, sans-serif' }}>Map failed to load. Refresh to retry.</p>
        <button onClick={() => setMapError(null)} style={{ padding: '8px 16px', background: '#1A1C1C', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Retry</button>
      </div>
    );
  }

  const popupStyle = { padding: '12px', fontFamily: "'Inter', sans-serif", fontSize: '12px', background: '#FFFFFF', color: '#1A1C1C', minWidth: '180px' };

  return (
    <div className="w-full h-full relative group rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 dark:shadow-black/50 border border-border-subtle z-0">
      {/* ── Top-Left Overlay ── */}
      <div className="absolute top-4 left-4 z-[30] flex flex-wrap gap-2.5">
        <div className="flex bg-pure-white/95 backdrop-blur shadow-md border border-border-subtle rounded-xl p-2 items-center gap-2">
          <span className="material-symbols-outlined text-text-secondary text-sm">search</span>
          <input
            className="bg-transparent border-none text-body-sm focus:ring-0 p-0 w-44 outline-none text-on-surface"
            placeholder="Search operational area..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="bg-pure-white/95 backdrop-blur shadow-md border border-border-subtle rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="font-label-caps text-[10px] text-text-secondary">LAYERS:</span>
          <span className="font-body-sm font-semibold">Drivers &amp; Depots</span>
        </div>

        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isLocating}
          className="bg-pure-white/95 backdrop-blur shadow-md border border-border-subtle rounded-xl px-3 py-2 flex items-center gap-2 hover:bg-surface-container cursor-pointer transition-all active:scale-95 text-xs font-semibold"
        >
          <span className={`material-symbols-outlined text-sm text-blue-600 ${isLocating ? 'animate-spin' : ''}`}>
            {isLocating ? 'refresh' : 'my_location'}
          </span>
          <span>{isLocating ? 'Locating...' : 'My Location'}</span>
        </button>
      </div>

      {/* ── Bottom-Right Overlay: Legend + Zoom ── */}
      <div className="absolute bottom-4 right-4 z-[30] flex flex-col gap-2 pointer-events-auto">
        <div className="bg-white/90 backdrop-blur border border-border-subtle rounded-xl p-2.5 mb-1 shadow-md">
          <div className="flex items-center gap-3 text-[10px] font-label-caps text-text-secondary uppercase">
            <span className="flex items-center gap-1">
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2B5D4F', display: 'inline-block' }} /> Driver
            </span>
            <span className="flex items-center gap-1">
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#9b4500', display: 'inline-block' }} /> Order
            </span>
            <span className="flex items-center gap-1">
              <span style={{ width: 10, height: 10, background: '#1A1C1C', display: 'inline-block', borderRadius: 2 }} /> Depot
            </span>
          </div>
        </div>
      </div>

      {/* ── Leaflet Map ── */}
      <MapContainer
        center={[DEFAULT_DEPOT.lat, DEFAULT_DEPOT.lng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <NaturalMapTileLayer />
        <AutoInvalidateSize />
        <FitBoundsToRoutes routes={routes} orders={orders} depot={DEFAULT_DEPOT} selectedDriverId={selectedDriverId} />
        <SmoothFlyToController focusPosition={focusPosition} />

        {/* Custom Zoom Buttons */}
        <div className="leaflet-bottom leaflet-right z-[400] mb-6 mr-6 pointer-events-auto">
          <MapZoomButtons />
        </div>

        {/* User GPS Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocIcon}>
            <Popup>
              <div style={popupStyle}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', marginBottom: 4 }}>CURRENT LOCATION</div>
                <div style={{ fontSize: 11, color: '#666' }}>{userAddress || `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Central Depot Marker */}
        <Marker position={[DEFAULT_DEPOT.lat, DEFAULT_DEPOT.lng]} icon={depotIcon}>
          <Popup>
            <div style={popupStyle}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#8C8C8C', textTransform: 'uppercase', marginBottom: 4 }}>MAIN DEPOT</div>
              <div style={{ fontWeight: 700, color: '#1A1C1C' }}>Polaris Central Depot</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Jalandhar-Phagwara Corridor</div>
            </div>
          </Popup>
        </Marker>

        {/* Route Polylines */}
        {routes.map((route) => {
          if (!route.geometry || route.geometry.length === 0) return null;
          const color = driverColorMap[route.driver_id] || '#2B5D4F';
          const isSelected = String(selectedDriverId) === String(route.driver_id);
          const isDimmed = selectedDriverId !== null && selectedDriverId !== undefined && !isSelected;
          const originAddress = routeStartAddresses[route.id] || 'Depot / Origin';

          return (
            <Polyline
              key={route.id || route.driver_id}
              positions={route.geometry}
              pathOptions={{
                color,
                weight: isSelected ? 5 : isDimmed ? 2 : 3.5,
                opacity: isSelected ? 1.0 : isDimmed ? 0.2 : 0.75,
                dashArray: isSelected ? null : '6 4',
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{
                click: () => onSelectDriver && onSelectDriver(route.driver_id),
              }}
            >
              <Popup>
                <div style={popupStyle}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#8C8C8C', textTransform: 'uppercase', marginBottom: 4 }}>DRIVER #{route.driver_id} ROUTE</div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                    Origin: <b style={{ color: '#1A1C1C', display: 'block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{originAddress}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span>Distance: <b>{route.total_distance_km?.toFixed(1)} km</b></span>
                    <span>Duration: <b>{Math.round(route.total_duration_min)} min</b></span>
                  </div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Driver Markers */}
        {drivers.map((driver) => {
          const liveLoc = liveLocations[driver.id];
          const lat = liveLoc ? liveLoc.lat : parseFloat(driver.home_lat);
          const lng = liveLoc ? liveLoc.lng : parseFloat(driver.home_lng);
          const isSelected = selectedDriverId === driver.id;
          const color = driverColorMap[driver.id] || '#2B5D4F';

          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker
              key={`driver-${driver.id}`}
              position={[lat, lng]}
              icon={driverIconMap[driver.id] || makeDriverIcon(color, !!liveLoc, isSelected)}
              eventHandlers={{
                click: () => onSelectDriver && onSelectDriver(isSelected ? null : driver.id),
              }}
            >
              <Popup>
                <div style={popupStyle}>
                  <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', marginBottom: 4 }}>
                    {driver.name.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, color: '#666' }}>Capacity: <b style={{ color: '#1A1C1C' }}>{driver.vehicle_capacity_kg} kg</b></div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                    Status: <b style={{ color: liveLoc && socketConnected ? '#059669' : '#8C8C8C' }}>
                      {liveLoc ? (socketConnected ? 'Live tracking' : 'Stale ping') : 'At depot'}
                    </b>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Order Markers */}
        {orders.map((order) => {
          const lat = parseFloat(order.lat);
          const lng = parseFloat(order.lng);
          if (isNaN(lat) || isNaN(lng)) return null;
          const stopInfo = orderStopInfo[order.id];

          return (
            <Marker
              key={`order-${order.id}`}
              position={[lat, lng]}
              icon={orderIconMap[order.id] || makeOrderIcon(!!stopInfo, stopInfo?.color, stopInfo?.sequenceNo)}
            >
              <Popup>
                <div style={popupStyle}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9b4500', textTransform: 'uppercase', marginBottom: 4 }}>
                    #ORDER-{order.id}
                  </div>
                  <div style={{ fontSize: 11, color: '#666', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.address || `${order.lat}, ${order.lng}`}
                  </div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                    Weight: <b style={{ color: '#1A1C1C' }}>{order.weight_kg} kg</b>
                  </div>
                  {stopInfo && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: stopInfo.color, marginTop: 4 }}>
                      → Driver #{stopInfo.driverId}, Stop #{stopInfo.sequenceNo}
                    </div>
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