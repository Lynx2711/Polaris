import { useState } from 'react';
import { X, Truck, Phone, Scale, MapPin } from 'lucide-react';

const inputStyle = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  color: 'var(--ink)',
  padding: '8px 12px',
  width: '100%',
  fontSize: '13px',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '500',
  color: 'var(--ink-muted)',
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

export default function NewDriverModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState('500');
  const [lat, setLat] = useState('31.298');
  const [lng, setLng] = useState('75.647');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !capacity || !lat || !lng) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit({
        name,
        phone: phone || null,
        vehicle_capacity_kg: parseFloat(capacity),
        home_lat: parseFloat(lat),
        home_lng: parseFloat(lng),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create driver.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 select-none"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md shadow-2xl p-6 relative polaris-transition"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 hover:opacity-60 transition cursor-pointer"
          style={{ color: 'var(--ink-muted)' }}
        >
          <X size={18} />
        </button>

        <div
          className="flex items-center gap-2.5 pb-4 mb-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <Truck size={18} style={{ color: 'var(--accent-blue)' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
            Add fleet driver
          </h3>
        </div>

        {error && (
          <div
            className="p-3 mb-4 text-sm"
            style={{
              background: 'color-mix(in srgb, var(--accent-red) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-red) 30%, transparent)',
              color: 'var(--accent-red)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={labelStyle}>Driver full name</label>
            <div className="flex items-center" style={{ ...inputStyle, padding: 0 }}>
              <Truck size={13} style={{ color: 'var(--ink-dim)', marginLeft: '10px', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="e.g. Rajwinder Singh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ ...inputStyle, border: 'none', background: 'transparent', flex: 1, paddingLeft: '8px' }}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Phone (optional)</label>
              <div className="flex items-center" style={{ ...inputStyle, padding: 0 }}>
                <Phone size={13} style={{ color: 'var(--ink-dim)', marginLeft: '10px', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="+91 98765 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ ...inputStyle, border: 'none', background: 'transparent', flex: 1, paddingLeft: '8px' }}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Capacity (kg)</label>
              <div className="flex items-center" style={{ ...inputStyle, padding: 0 }}>
                <Scale size={13} style={{ color: 'var(--ink-dim)', marginLeft: '10px', flexShrink: 0 }} />
                <input
                  type="number"
                  placeholder="500"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  style={{ ...inputStyle, border: 'none', background: 'transparent', flex: 1, paddingLeft: '8px' }}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Home depot lat</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Home depot lng</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div
            className="flex justify-end gap-2 pt-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium border transition cursor-pointer polaris-transition"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--ink-muted)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold transition cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            >
              {loading ? 'Adding...' : 'Add driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
