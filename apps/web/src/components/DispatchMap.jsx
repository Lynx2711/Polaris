import { useEffect, useState, useRef } from 'react';
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

// Tile layer component displaying natural full-detail map tiles
function NaturalMapTileLayer() {
  const map = useMap();

  useEffect(() => {
    map.eachLayer((l) => {
      if (l instanceof L.TileLayer) map.removeLayer(l);
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
  }, [map]);

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

// Smooth camera transitions with map.flyTo()
function SmoothFlyToController({ focusPosition, zoom = 14 }) {
  const map = useMap();

  useEffect(() => {
    if (focusPosition && focusPosition[0] && focusPosition[1]) {
      map.flyTo(focusPosition, zoom, {
        duration: 0.8,
        animate: true,
      });
    }
  }, [focusPosition, zoom, map]);

  return null;
}

// Fits the map to all loaded data: depot + order pins + full route geometry
function FitBoundsToRoutes({ routes, orders, depot }) {
  const map = useMap();

  useEffect(() => {
    const allPoints = [];
    if (depot) allPoints.push([depot.lat, depot.lng]);
    orders.forEach((o) => allPoints.push([o.lat, o.lng]));
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

// Custom Zoom Control Component inside Leaflet
function MapZoomButtons() {
  const map = useMap();
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-pure-white border border-border-subtle flex items-center justify-center hover:bg-surface-container cursor-pointer transition-colors shadow-sm"
        title="Zoom in"
      >
        <span className="material-symbols-outlined text-on-surface">add</span>
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-pure-white border border-border-subtle flex items-center justify-center hover:bg-surface-container cursor-pointer transition-colors shadow-sm"
        title="Zoom out"
      >
        <span className="material-symbols-outlined text-on-surface">remove</span>
      </button>
    </div>
  );
}

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

  // ── Custom CSS L.divIcon Markers ──

  // Depot Icon — Vector HTML styled with soft drop shadow
  const depotIcon = L.divIcon({
    className: 'depot-marker-div',
    html: `
      <div class="w-8 h-8 bg-primary flex items-center justify-center text-on-primary shadow-lg cursor-pointer transition-transform hover:scale-110">
        <span class="material-symbols-outlined text-base">hub</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  // User GPS Location Icon — Vector HTML styled with CSS pulse ring
  const userLocIcon = L.divIcon({
    className: 'user-loc-div',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
          <div class="w-2 h-2 rounded-full bg-white"></div>
        </div>
        <div class="absolute -inset-2 rounded-full border-2 border-blue-500 marker-pulse pointer-events-none"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Driver marker icon matching Stitch style with live pulse animation
  const createDriverIcon = (driver, color, isLive, isSelected) => {
    return L.divIcon({
      className: 'driver-marker-div',
      html: `
        <div class="relative cursor-pointer">
          <div class="w-8 h-8 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow-lg transition-transform ${isSelected ? 'scale-125 ring-2 ring-black' : 'hover:scale-110'}">
            <span class="material-symbols-outlined text-xs text-white">local_shipping</span>
          </div>
          ${isLive ? '<div class="absolute -inset-1.5 rounded-full border-2 border-primary marker-pulse pointer-events-none"></div>' : ''}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Order marker icon
  const createOrderIcon = (order, isAssigned, driverColor, sequenceNo) => {
    if (isAssigned) {
      return L.divIcon({
        className: 'assigned-stop-icon',
        html: `
          <div class="w-6 h-6 bg-pure-white border-2 border-primary text-primary font-mono-data text-[10px] font-bold flex items-center justify-center shadow-md hover:scale-110 transition-transform">
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
        <div class="w-4 h-4 bg-secondary rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform"></div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  };

  // ── Handle Two-Tier Geolocation Detection ──
  const handleDetectLocation = () => {
    setIsLocating(true);
    captureUserLocation(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        setFocusPosition([lat, lng]);
        setIsLocating(false);

        // Reverse geocode to get readable address string
        try {
          const addr = await reverseGeocode(lat, lng);
          setUserAddress(addr);
        } catch (e) {
          console.warn('Reverse geocode failed:', e);
          setUserAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Two-tier location detection failed:', err);
        alert('Could not detect location. Please use manual address search.');
      }
    );
  };

  // ── Reverse Geocode Route Start Points ──
  useEffect(() => {
    routes.forEach(async (route) => {
      if (route.geometry && route.geometry.length > 0 && !routeStartAddresses[route.id]) {
        const startPoint = route.geometry[0];
        try {
          const addr = await reverseGeocode(startPoint[0], startPoint[1]);
          setRouteStartAddresses((prev) => ({ ...prev, [route.id]: addr }));
        } catch (e) {
          // ignore
        }
      }
    });
  }, [routes]);

  // Handle driver/order focus with smooth flyTo
  useEffect(() => {
    if (selectedDriverId) {
      const driver = drivers.find((d) => d.id === selectedDriverId);
      const liveLoc = liveLocations[selectedDriverId];
      if (liveLoc) {
        setFocusPosition([liveLoc.lat, liveLoc.lng]);
      } else if (driver) {
        setFocusPosition([driver.home_lat, driver.home_lng]);
      }
    }
  }, [selectedDriverId, drivers, liveLocations]);

  useEffect(() => {
    if (selectedOrderId) {
      const order = orders.find((o) => o.id === selectedOrderId);
      if (order) {
        setFocusPosition([order.lat, order.lng]);
      }
    }
  }, [selectedOrderId, orders]);

  // Map of stops by order_id
  const orderStopInfo = {};
  routes.forEach((route) => {
    const color = driverColorMap[route.driver_id] || '#000000';
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

  const popupStyle = `
    padding: 12px;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    background: #FFFFFF;
    color: #1A1C1C;
    min-width: 180px;
  `;

  return (
    <div className="w-full h-full relative group">
      {/* ── Top-Left Stitch Overlay: Search, Layers & Geolocation GPS ── */}
      <div className="absolute top-6 left-6 z-[400] flex flex-wrap gap-2">
        <div className="flex bg-pure-white shadow-sm border border-border-subtle p-2 items-center gap-2">
          <span className="material-symbols-outlined text-text-secondary text-sm">search</span>
          <input
            className="bg-transparent border-none text-body-sm focus:ring-0 p-0 w-48 outline-none text-on-surface"
            placeholder="Search operational area..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="bg-pure-white shadow-sm border border-border-subtle px-3 py-2 flex items-center gap-2">
          <span className="font-label-caps text-[10px] text-text-secondary">LAYERS:</span>
          <span className="font-body-sm font-semibold">Drivers &amp; Depots</span>
        </div>

        {/* Two-Tier GPS Location Detection Button */}
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isLocating}
          className="bg-pure-white shadow-sm border border-border-subtle px-3 py-2 flex items-center gap-2 hover:bg-surface-container cursor-pointer transition-colors active:scale-95 text-xs font-semibold"
          title="Detect current location with two-tier fallback"
        >
          <span className={`material-symbols-outlined text-sm text-blue-600 ${isLocating ? 'animate-spin' : ''}`}>
            {isLocating ? 'refresh' : 'my_location'}
          </span>
          <span>{isLocating ? 'Locating...' : 'My Location'}</span>
        </button>
      </div>

      {/* ── Bottom-Right Stitch Overlay: Legend & Zoom Controls ── */}
      <div className="absolute bottom-6 right-6 z-[400] flex flex-col gap-2 pointer-events-auto">
        <div className="bg-white/90 backdrop-blur border border-border-subtle p-2.5 mb-1 shadow-sm">
          <div className="flex items-center gap-3 text-[10px] font-label-caps text-text-secondary uppercase">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-primary rounded-full"></span> Driver
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-secondary rounded-full"></span> Order
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-black flex items-center justify-center w-3 h-3 text-white">
                <span className="material-symbols-outlined text-[8px]">hub</span>
              </span> Depot
            </span>
          </div>
        </div>
      </div>

      {/* ── Leaflet Map Container ── */}
      <MapContainer
        center={[DEFAULT_DEPOT.lat, DEFAULT_DEPOT.lng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <NaturalMapTileLayer />
        <AutoInvalidateSize />
        <FitBoundsToRoutes routes={routes} orders={orders} depot={DEFAULT_DEPOT} />
        <SmoothFlyToController focusPosition={focusPosition} />

        {/* Custom Zoom Buttons */}
        <div className="leaflet-bottom leaflet-right z-[400] mb-6 mr-6 pointer-events-auto">
          <MapZoomButtons />
        </div>

        {/* User GPS Location Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocIcon}>
            <Popup>
              <div style={popupStyle}>
                <div className="font-label-caps text-[10px] text-blue-600 uppercase font-bold mb-1">
                  CURRENT LOCATION
                </div>
                <div className="text-[11px] text-text-secondary leading-relaxed">
                  {userAddress || `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Central Depot Marker */}
        <Marker position={[DEFAULT_DEPOT.lat, DEFAULT_DEPOT.lng]} icon={depotIcon}>
          <Popup>
            <div style={popupStyle}>
              <div className="font-label-caps text-[10px] text-text-secondary uppercase mb-1">MAIN DEPOT 01</div>
              <div className="font-body-sm font-bold text-primary">Polaris Central Depot</div>
              <div className="text-[11px] text-text-secondary mt-0.5">Jalandhar-Phagwara Corridor</div>
            </div>
          </Popup>
        </Marker>

        {/* Route Polylines & Origin Reverse Geocode Display */}
        {routes.map((route) => {
          if (!route.geometry || route.geometry.length === 0) return null;
          const isSelected = selectedDriverId === route.driver_id;
          const isDimmed = selectedDriverId !== null && selectedDriverId !== route.driver_id;
          const originAddress = routeStartAddresses[route.id] || 'Depot / Origin';

          return (
            <Polyline
              key={route.id || route.driver_id}
              positions={route.geometry}
              pathOptions={{
                color: '#000000',
                weight: isSelected ? 5 : isDimmed ? 2 : 3,
                opacity: isSelected ? 1.0 : isDimmed ? 0.2 : 0.7,
                dashArray: '4, 4',
                lineCap: 'square',
              }}
              eventHandlers={{
                click: () => onSelectDriver(route.driver_id),
              }}
            >
              <Popup>
                <div style={popupStyle}>
                  <div className="font-label-caps text-[10px] text-text-secondary uppercase mb-1">
                    DRIVER #{route.driver_id} ROUTE
                  </div>
                  <div className="text-[11px] text-text-secondary mb-1">
                    Origin: <b className="text-primary truncate block">{originAddress}</b>
                  </div>
                  <div className="flex justify-between text-[11px]">
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
          const color = driverColorMap[driver.id] || '#000000';
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
                  <div className="font-label-caps text-[10px] text-primary uppercase font-bold mb-1">
                    DRIVER: {driver.name.toUpperCase()}
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    Capacity: <b className="text-primary">{driver.vehicle_capacity_kg} kg</b>
                  </div>
                  <div className="text-[11px] text-text-secondary mt-0.5">
                    Status: <b className={liveLoc && socketConnected ? 'text-green-600' : 'text-primary'}>
                      {liveLoc ? (socketConnected ? 'Live tracking' : 'Stale ping') : 'At depot'}
                    </b>
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
                  <div className="font-label-caps text-[10px] text-secondary uppercase font-bold mb-1">
                    #ORDER-{order.id}
                  </div>
                  <div className="text-[11px] text-text-secondary truncate max-w-[180px]">
                    {order.address || `${order.lat}, ${order.lng}`}
                  </div>
                  <div className="text-[11px] text-text-secondary mt-1">
                    Weight: <b className="text-primary">{order.weight_kg} kg</b>
                  </div>
                  {isAssigned && (
                    <div className="text-[10px] text-primary font-bold mt-1">
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