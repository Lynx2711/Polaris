import { useState } from 'react';
import { X, Package, Scale, Clock } from 'lucide-react';
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

export default function NewOrderModal({ isOpen, onClose, onSubmit }) {
  const [location, setLocation]   = useState(null); // { lat, lng, display_name }
  const [weightKg, setWeightKg]   = useState('100');
  const [deadlineMins, setDeadlineMins] = useState('120');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location) {
      setError('Please search for and confirm the delivery location on the map.');
      return;
    }
    if (!weightKg) {
      setError('Please enter the parcel weight.');
      return;
    }

    setLoading(true);
    setError('');

    const now = new Date();
    const deadlineEnd = new Date(now.getTime() + parseInt(deadlineMins) * 60 * 1000);

    try {
      await onSubmit({
        address:        location.display_name,
        lat:            location.lat,
        lng:            location.lng,
        weight_kg:      parseFloat(weightKg),
        deadline_start: now.toISOString(),
        deadline_end:   deadlineEnd.toISOString(),
      });
      // Reset & close
      setLocation(null);
      setWeightKg('100');
      setDeadlineMins('120');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create order. Please try again.');
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
          <Package size={20} style={{ color: 'var(--accent-amber)' }} />
          <h3 className="font-bold text-base" style={{ color: 'var(--ink)' }}>
            Add delivery order
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

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Address Search (Nominatim, no autocomplete) ── */}
          <div>
            <label style={labelStyle}>Delivery location</label>
            <AddressSearchField
              onSelect={setLocation}
              initialLat={31.315}
              initialLng={75.585}
              placeholder="Type address — e.g. Guru Nanak Market, Phagwara, Punjab"
            />
          </div>

          {/* ── Parcel details ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Parcel weight (kg)</label>
              <div
                className="flex items-center"
                style={{ ...inputStyle, padding: 0 }}
              >
                <Scale size={14} style={{ color: 'var(--ink-dim)', marginLeft: '12px', flexShrink: 0 }} />
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="100"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  style={{ ...inputStyle, border: 'none', background: 'transparent', flex: 1, paddingLeft: '10px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Deadline (minutes from now)</label>
              <div
                className="flex items-center"
                style={{ ...inputStyle, padding: 0 }}
              >
                <Clock size={14} style={{ color: 'var(--ink-dim)', marginLeft: '12px', flexShrink: 0 }} />
                <input
                  type="number"
                  min="15"
                  step="15"
                  placeholder="120"
                  value={deadlineMins}
                  onChange={(e) => setDeadlineMins(e.target.value)}
                  style={{ ...inputStyle, border: 'none', background: 'transparent', flex: 1, paddingLeft: '10px' }}
                  required
                />
              </div>
            </div>
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
              disabled={loading || !location}
              className="px-5 py-2 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:opacity-90"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            >
              {loading ? 'Creating…' : 'Create order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
