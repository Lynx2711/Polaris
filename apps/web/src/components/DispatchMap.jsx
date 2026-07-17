import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

// Hardcoded — you're typing these coordinates by hand just to prove the map works.
// These are real points roughly in the Jalandhar–Phagwara corridor.
const HARDCODED_ORDERS = [
  { id: 1, address: "Test Stop 1", lat: 31.325, lng: 75.577 },
  { id: 2, address: "Test Stop 2", lat: 31.279, lng: 75.647 },
  { id: 3, address: "Test Stop 3", lat: 31.224, lng: 75.771 },
];

const DEPOT = { lat: 31.298, lng: 75.647 }; // roughly center of your corridor

export function DispatchMap() {
  return (
    <MapContainer
      center={[DEPOT.lat, DEPOT.lng]}
      zoom={12}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {HARDCODED_ORDERS.map(order => (
        <Marker
          key={order.id}
          position={[order.lat, order.lng]}
          alt={`Marker pin for ${order.address}`}
        >
          <Popup>{order.address}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}