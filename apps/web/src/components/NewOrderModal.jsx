import { useState } from 'react';
import { X, Package, MapPin, Scale, Clock } from 'lucide-react';

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

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  color: 'var(--ink-muted)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

export default function NewOrderModal({ isOpen, onClose, onSubmit }) {
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('31.315');
  const [lng, setLng] = useState('75.585');
  const [weightKg, setWeightKg] = useState('100');
  const [deadlineMinutes, setDeadlineMinutes] = useState('120');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address || !lat || !lng || !weightKg) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + parseInt(deadlineMinutes) * 60 * 1000).toISOString();

    try {
      await onSubmit({
        address,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        weight_kg: parseFloat(weightKg),
        deadline_start: start,
        deadline_end: end,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 select-none backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl p-6 relative polaris-transition border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--bg-secondary)] transition cursor-pointer"
          style={{ color: 'var(--ink-muted)' }}
        >
          <X size={18} />
        </button>

        <div
          className="flex items-center gap-2.5 pb-4 mb-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <Package size={20} style={{ color: 'var(--accent-amber)' }} />
          <h3 className="font-bold text-base" style={{ color: 'var(--ink)' }}>
            Add delivery order
          </h3>
        </div>

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
          <div>
            <label style={labelStyle}>Delivery address</label>
            <div className="flex items-center" style={{ ...inputStyle, padding: 0 }}>
              <MapPin size={14} style={{ color: 'var(--ink-dim)', marginLeft: '12px', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="e.g. Model Town Market, Jalandhar"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ ...inputStyle, border: 'none', background: 'transparent', flex: 1, paddingLeft: '10px' }}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Latitude</label>
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
              <label style={labelStyle}>Longitude</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Weight (kg)</label>
              <div className="flex items-center" style={{ ...inputStyle, padding: 0 }}>
                <Scale size={14} style={{ color: 'var(--ink-dim)', marginLeft: '12px', flexShrink: 0 }} />
                <input
                  type="number"
                  placeholder="100"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  style={{ ...inputStyle, border: 'none', background: 'transparent', flex: 1, paddingLeft: '10px' }}
                  required
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Deadline (mins)</label>
              <div className="flex items-center" style={{ ...inputStyle, padding: 0 }}>
                <Clock size={14} style={{ color: 'var(--ink-dim)', marginLeft: '12px', flexShrink: 0 }} />
                <input
                  type="number"
                  placeholder="120"
                  value={deadlineMinutes}
                  onChange={(e) => setDeadlineMinutes(e.target.value)}
                  style={{ ...inputStyle, border: 'none', background: 'transparent', flex: 1, paddingLeft: '10px' }}
                  required
                />
              </div>
            </div>
          </div>

          <div
            className="flex justify-end gap-2 pt-4"
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
              disabled={loading}
              className="px-5 py-2 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 shadow-md hover:opacity-90"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            >
              {loading ? 'Creating...' : 'Create order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
