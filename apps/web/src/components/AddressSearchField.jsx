import { useState, useRef, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, Loader2, MapPin, AlertCircle } from 'lucide-react';
import { geocodeAddress } from '../services/places';

// Leaflet icon fix
if (L.Icon.Default.prototype._getIconUrl) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

function DraggableMarker({ position, onDragEnd }) {
  const markerRef = useRef(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const { lat, lng } = marker.getLatLng();
        onDragEnd(lat, lng);
      }
    },
  };

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function AddressSearchField({
  onSelect,
  initialLat = 31.298,
  initialLng = 75.647,
  placeholder = 'Type full address, e.g. Model Town Market, Jalandhar, Punjab',
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [pinPosition, setPinPosition] = useState([initialLat, initialLng]);
  const [showMap, setShowMap] = useState(false);

  const abortControllerRef = useRef(null);

  // Single search with AbortController cancellation & exponential backoff retry
  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;

    // Abort previous in-flight request if user triggers a new search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setSearching(true);
    setSearchError('');
    setResults([]);
    setSelectedResult(null);
    setShowMap(false);

    try {
      const data = await geocodeAddress(q, {
        signal: abortControllerRef.current.signal,
        limit: 5,
      });

      if (!data.length) {
        setSearchError(
          'No results found. Try a more specific address — include the city or area name (e.g. "Guru Nanak Market, Phagwara, Punjab").'
        );
      } else {
        setResults(data);
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // Cancelled intentionally
      setSearchError('Search failed. Check your internet connection and try again.');
      console.error('Nominatim search error:', err);
    } finally {
      setSearching(false);
    }
  }, [query]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handlePickResult = (result) => {
    const lat = result.lat;
    const lng = result.lng;
    setSelectedResult({ lat, lng, display_name: result.display_name });
    setPinPosition([lat, lng]);
    setResults([]);
    setShowMap(true);
    onSelect({ lat, lng, display_name: result.display_name });
  };

  const handlePinMove = (lat, lng) => {
    const updated = { ...selectedResult, lat, lng };
    setSelectedResult(updated);
    setPinPosition([lat, lng]);
    onSelect(updated);
  };

  const inputBase = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    color: 'var(--ink)',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    borderRadius: '12px',
    fontSize: '13px',
    width: '100%',
  };

  return (
    <div className="space-y-2 select-none">
      <div className="flex gap-2">
        <div
          className="flex items-center flex-1 gap-2 px-3"
          style={{ ...inputBase, padding: '0 12px' }}
        >
          <MapPin size={14} style={{ color: 'var(--ink-dim)', flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--ink)',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              padding: '10px 0',
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:opacity-90"
          style={{ background: 'var(--ink)', color: 'var(--bg)', whiteSpace: 'nowrap' }}
        >
          {searching ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Search size={13} />
          )}
          <span>{searching ? 'Searching…' : 'Search'}</span>
        </button>
      </div>

      <p className="text-[11px]" style={{ color: 'var(--ink-dim)' }}>
        Tip: Include city / area name for better results — Indian streets are more accurate with a fuller address.
      </p>

      {searchError && (
        <div
          className="flex items-start gap-2 p-3 text-xs rounded-xl"
          style={{
            background: 'color-mix(in srgb, var(--accent-amber) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent-amber) 30%, transparent)',
            color: 'var(--accent-amber)',
          }}
        >
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {results.length > 0 && (
        <div
          className="rounded-xl border overflow-hidden shadow-md"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p
            className="px-3 py-2 text-[11px] font-semibold uppercase tracking-widest"
            style={{
              color: 'var(--ink-dim)',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}
          >
            {results.length} result{results.length > 1 ? 's' : ''} — pick the correct one
          </p>
          {results.map((r) => (
            <button
              key={r.place_id}
              type="button"
              onClick={() => handlePickResult(r)}
              className="w-full text-left px-4 py-3 text-xs transition cursor-pointer hover:bg-[var(--bg-secondary)] border-b last:border-b-0"
              style={{ borderColor: 'var(--border-light)', color: 'var(--ink)' }}
            >
              <div className="flex items-start gap-2">
                <MapPin size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-blue)' }} />
                <span className="leading-relaxed">{r.display_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {showMap && selectedResult && (
        <div className="rounded-xl overflow-hidden border shadow-md" style={{ borderColor: 'var(--border)', height: '180px' }}>
          <MapContainer
            key={`${selectedResult.lat}-${selectedResult.lng}`}
            center={pinPosition}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <DraggableMarker position={pinPosition} onDragEnd={handlePinMove} />
            <MapClickHandler onMapClick={handlePinMove} />
          </MapContainer>
        </div>
      )}

      {selectedResult && (
        <div
          className="flex items-start gap-2 p-3 rounded-xl text-xs"
          style={{
            background: 'color-mix(in srgb, var(--accent-green) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent-green) 25%, transparent)',
            color: 'var(--ink-muted)',
          }}
        >
          <MapPin size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-green)' }} />
          <div>
            <p className="font-semibold mb-0.5" style={{ color: 'var(--ink)' }}>Location confirmed</p>
            <p className="leading-relaxed">{selectedResult.display_name}</p>
            <p className="mt-0.5 font-mono text-[10px]" style={{ color: 'var(--ink-dim)' }}>
              {selectedResult.lat.toFixed(6)}, {selectedResult.lng.toFixed(6)}
              <span className="ml-2 italic">— drag the pin on the map to fine-tune</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
