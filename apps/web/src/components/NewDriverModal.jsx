import { useState } from 'react';
import { X, Truck, Phone, Scale, Mail } from 'lucide-react';
import AddressSearchField from './AddressSearchField';

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  color: 'var(--ink-muted)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const inputStyle = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  color: 'var(--ink)',
  padding: '10px 14px',
  width: '100%',
  fontSize: '13px',
  borderRadius: '12px',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
};

export default function NewDriverModal({ isOpen, onClose, onSubmit }) {
  const [name,          setName]         = useState('');
  const [email,         setEmail]        = useState('');
  const [phone,         setPhone]        = useState('');
  const [capacity,      setCapacity]     = useState('500');
  const [homeLocation,  setHomeLocation] = useState(null); // { lat, lng, display_name }
  const [loading,       setLoading]      = useState(false);
  const [error,         setError]        = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name) {
      setError('Please enter the driver\'s full name.');
      return;
    }
    if (!homeLocation) {
      setError('Please search for and confirm the driver\'s home/depot location on the map.');
      return;
    }
    if (!capacity) {
      setError('Please enter vehicle capacity.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit({
        name,
        email:                email || null,
        phone:                phone || null,
        vehicle_capacity_kg:  parseFloat(capacity),
        home_lat:             homeLocation.lat,
        home_lng:             homeLocation.lng,
      });
      // Reset & close
      setName(''); setEmail(''); setPhone(''); setCapacity('500'); setHomeLocation(null);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add driver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[1000] p-4 select-none backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl p-6 relative polaris-transition border max-h-[92vh] overflow-y-auto"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--bg-secondary)] transition cursor-pointer"
          style={{ color: 'var(--ink-muted)' }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div
          className="flex items-center gap-2.5 pb-4 mb-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <Truck size={20} style={{ color: 'var(--accent-blue)' }} />
          <h3 className="font-bold text-base uppercase font-hanken tracking-tight" style={{ color: 'var(--ink)' }}>
            Add fleet driver
          </h3>
        </div>

        {/* Error */}
        {error && (
          <div
            className="p-3 mb-4 text-xs font-medium rounded-xl"
            style={{
              background: 'color-mix(in srgb, var(--accent-red) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-red) 30%, transparent)',
              color: 'var(--accent-red)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Full Name ── */}
          <div>
            <label style={labelStyle}>Driver full name</label>
            <div className="flex items-center" style={{ ...inputStyle, padding: 0 }}>
              <Truck size={13} style={{ color: 'var(--ink-dim)', marginLeft: '12px', flexShrink: 0 }} />
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

          {/* ── Email (Optional Driver Account Login) ── */}
          <div>
            <label style={labelStyle}>Email (Optional - Driver App Login)</label>
            <div className="flex items-center" style={{ ...inputStyle, padding: 0 }}>
              <Mail size={13} style={{ color: 'var(--ink-dim)', marginLeft: '12px', flexShrink: 0 }} />
              <input
                type="email"
                placeholder="driver@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...inputStyle, border: 'none', background: 'transparent', flex: 1, paddingLeft: '8px' }}
              />
            </div>
            <p className="text-[10px] mt-1 italic" style={{ color: 'var(--ink-dim)' }}>
              Provisions a driver login account with default password <span className="font-mono font-semibold text-primary">"password123"</span>
            </p>
          </div>

          {/* ── Phone & Capacity ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Phone (optional)</label>
              <div className="flex items-center" style={{ ...inputStyle, padding: 0 }}>
                <Phone size={13} style={{ color: 'var(--ink-dim)', marginLeft: '12px', flexShrink: 0 }} />
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
              <label style={labelStyle}>Vehicle capacity (kg)</label>
              <div className="flex items-center" style={{ ...inputStyle, padding: 0 }}>
                <Scale size={13} style={{ color: 'var(--ink-dim)', marginLeft: '12px', flexShrink: 0 }} />
                <input
                  type="number"
                  min="1"
                  step="10"
                  placeholder="500"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  style={{ ...inputStyle, border: 'none', background: 'transparent', flex: 1, paddingLeft: '8px' }}
                  required
                />
              </div>
            </div>
          </div>

          {/* ── Home / Depot location via Nominatim search ── */}
          <div>
            <label style={labelStyle}>Home / depot starting location</label>
            <p className="text-[11px] mb-2" style={{ color: 'var(--ink-dim)' }}>
              Where does this driver start their route each day?
            </p>
            <AddressSearchField
              onSelect={setHomeLocation}
              initialLat={31.298}
              initialLng={75.647}
              placeholder="Type depot address — e.g. Nakodar Road, Jalandhar, Punjab"
            />
          </div>

          {/* ── Actions ── */}
          <div
            className="flex justify-end gap-2 pt-2"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer hover:bg-[var(--bg-secondary)]"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--ink-muted)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !homeLocation}
              className="px-5 py-2 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:opacity-90"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            >
              {loading ? 'Adding…' : 'Add driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
