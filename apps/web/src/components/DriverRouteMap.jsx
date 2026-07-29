import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function SmoothFlyToController({ focusPosition, zoom = 15 }) {
  const map = useMap();
  useEffect(() => {
    if (focusPosition && focusPosition[0] && focusPosition[1]) {
      map.flyTo(focusPosition, zoom, { duration: 1.0, animate: true });
    }
  }, [focusPosition, zoom, map]);
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

export default function DriverRouteMap({
  driverLocation,
  depotLocation,
  stops = [],
  nextStop,
  onSelectNextStop,
  centerPosition,
}) {
  const [focusPos, setFocusPos] = useState(centerPosition || [driverLocation.lat, driverLocation.lng]);

  useEffect(() => {
    if (centerPosition) {
      setFocusPos(centerPosition);
    }
  }, [centerPosition]);

  // Icons
  const gpsIcon = L.divIcon({
    className: 'gps-driver-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="width: 28px; height: 28px; border-radius: 50%; background: #2563EB; border: 3px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <span class="material-symbols-outlined" style="font-size: 16px; color: #FFFFFF;">navigation</span>
        </div>
        <div style="position: absolute; inset: -6px; border-radius: 50%; border: 2px solid #2563EB; opacity: 0.6; animation: pulse 2s infinite;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const depotIcon = L.divIcon({
    className: 'depot-marker',
    html: `
      <div style="width: 32px; height: 32px; background: #1A1C1C; color: #FFFFFF; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
        <span class="material-symbols-outlined" style="font-size: 18px;">hub</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const createStopIcon = (seq, isNext, isDelivered) => {
    const bg = isDelivered ? '#059669' : isNext ? '#2563EB' : '#1A1C1C';
    return L.divIcon({
      className: 'stop-marker',
      html: `
        <div style="width: 28px; height: 28px; background: ${bg}; color: #FFFFFF; border-radius: 50%; border: 2px solid #FFFFFF; font-weight: 700; font-size: 11px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.25); transform: ${isNext ? 'scale(1.25)' : 'scale(1)'}; transition: transform 0.2s;">
          ${isDelivered ? '✓' : seq}
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  // Build polyline coordinates: Driver GPS -> Stops in order
  const polylinePoints = [];
  if (driverLocation && driverLocation.lat && driverLocation.lng) {
    polylinePoints.push([driverLocation.lat, driverLocation.lng]);
  }
  if (depotLocation && depotLocation.lat && depotLocation.lng) {
    polylinePoints.push([depotLocation.lat, depotLocation.lng]);
  }
  if (Array.isArray(stops)) {
    stops.forEach(s => {
      if (s.lat && s.lng) {
        polylinePoints.push([s.lat, s.lng]);
      }
    });
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer
        center={focusPos}
        zoom={14}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          maxZoom={19}
        />
        <AutoInvalidateSize />
        <SmoothFlyToController focusPosition={focusPos} />

        {/* Route Polyline */}
        {polylinePoints.length > 1 && (
          <Polyline
            positions={polylinePoints}
            pathOptions={{
              color: '#1A1C1C',
              weight: 4,
              opacity: 0.8,
              dashArray: '6, 6',
            }}
          />
        )}

        {/* GPS Driver Location */}
        {driverLocation && driverLocation.lat && driverLocation.lng && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={gpsIcon}>
            <Popup>
              <div style={{ padding: 6, fontSize: 12, fontWeight: 600 }}>
                Your Current Location<br />
                <span style={{ fontSize: 10, color: '#666' }}>Accuracy: ±5m · Live Tracking Active</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Depot Location (Optional) */}
        {depotLocation && depotLocation.lat && depotLocation.lng && (
          <Marker position={[depotLocation.lat, depotLocation.lng]} icon={depotIcon}>
            <Popup>
              <div style={{ padding: 6, fontSize: 12, fontWeight: 600 }}>
                Central Depot (Warehouse Origin)<br />
                <span style={{ fontSize: 10, color: '#666' }}>Company Logistics Hub</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Delivery Stops */}
        {stops.map((stop, index) => {
          const isNext = nextStop?.id === stop.id;
          const isDelivered = stop.status === 'delivered';
          return (
            <Marker
              key={stop.id}
              position={[stop.lat, stop.lng]}
              icon={createStopIcon(index + 1, isNext, isDelivered)}
              eventHandlers={{
                click: () => setFocusPos([stop.lat, stop.lng])
              }}
            >
              <Popup>
                <div style={{ padding: 8, fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#666' }}>
                    Stop #{index + 1} {isNext ? '• NEXT DESTINATION' : ''}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1C1C', marginTop: 2 }}>
                    {stop.customerName}
                  </div>
                  <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>
                    {stop.address}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isDelivered ? '#059669' : '#2563EB', marginTop: 4 }}>
                    Status: {stop.status} | ETA {stop.eta || '09:30 AM'}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Map Controls overlay */}
      <div style={{
        position: 'absolute', top: 16, right: 16, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <button
          onClick={() => setFocusPos([driverLocation.lat, driverLocation.lng])}
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer',
          }}
          title="Center on My Location"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>my_location</span>
        </button>

        {nextStop && (
          <button
            onClick={() => setFocusPos([nextStop.lat, nextStop.lng])}
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--ink)', color: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer',
            }}
            title="Focus Next Stop"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>flag</span>
          </button>
        )}
      </div>
    </div>
  );
}
