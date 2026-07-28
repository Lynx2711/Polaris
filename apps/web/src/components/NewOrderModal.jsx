import { useState } from 'react';
import { X, Package, Scale, Clock } from 'lucide-react';
import AddressSearchField from './AddressSearchField';

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '700',
  color: 'var(--ink-muted)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontFamily: 'Inter, sans-serif',
};

const inputContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  background: 'var(--surface-raised)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '0 12px',
  height: '44px',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const inputFieldStyle = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'var(--ink)',
  fontFamily: 'Inter, sans-serif',
  fontSize: '13px',
  paddingLeft: '10px',
};

export default function NewOrderModal({ isOpen, onClose, onSubmit }) {
  const [location, setLocation] = useState(null);
  const [weightKg, setWeightKg] = useState('100');
  const [deadlineMins, setDeadlineMins] = useState('120');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location) {
      setError('Please search for and select the delivery address.');
      return;
    }
    if (!weightKg) {
      setError('Please specify the parcel weight.');
      return;
    }

    setLoading(true);
    setError('');

    const now = new Date();
    const deadlineEnd = new Date(now.getTime() + parseInt(deadlineMins) * 60 * 1000);

    try {
      await onSubmit({
        address: location.display_name,
        lat: location.lat,
        lng: location.lng,
        weight_kg: parseFloat(weightKg),
        deadline_start: now.toISOString(),
        deadline_end: deadlineEnd.toISOString(),
      });
      setLocation(null); setWeightKg('100'); setDeadlineMins('120');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        userSelect: 'none',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%', maxWidth: '520px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'var(--surface-raised)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink)',
            }}>
              <Package size={20} />
            </div>
            <div>
              <h3 style={{
                fontSize: '16px', fontWeight: 700,
                fontFamily: "'Hanken Grotesk', sans-serif",
                color: 'var(--ink)', margin: 0, lineHeight: 1.2,
              }}>
                Add Delivery Order
              </h3>
              <p style={{
                fontSize: '12px', color: 'var(--ink-muted)',
                margin: '2px 0 0 0', fontFamily: 'Inter, sans-serif',
              }}>
                Create a new package order for fleet assignment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: 'none', background: 'var(--surface-raised)',
              color: 'var(--ink-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--ink)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-raised)'; e.currentTarget.style.color = 'var(--ink-muted)'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              padding: '12px 16px', marginBottom: '20px', borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444', fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Delivery Location */}
            <div>
              <label style={labelStyle}>Delivery Destination Address *</label>
              <AddressSearchField
                onSelect={setLocation}
                initialLat={31.315}
                initialLng={75.585}
                placeholder="Type delivery destination address..."
              />
            </div>

            {/* Weight & Deadline Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Cargo Weight (kg) *</label>
                <div style={inputContainerStyle}>
                  <Scale size={16} style={{ color: 'var(--ink-dim)' }} />
                  <input
                    type="number"
                    min="1"
                    step="5"
                    placeholder="100"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    style={inputFieldStyle}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Delivery Window (Mins)</label>
                <div style={inputContainerStyle}>
                  <Clock size={16} style={{ color: 'var(--ink-dim)' }} />
                  <input
                    type="number"
                    min="15"
                    step="15"
                    placeholder="120"
                    value={deadlineMins}
                    onChange={(e) => setDeadlineMins(e.target.value)}
                    style={inputFieldStyle}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)',
              marginTop: '8px',
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--surface-raised)',
                  color: 'var(--ink)', fontSize: '13px', fontWeight: 600,
                  fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-raised)'}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !location}
                style={{
                  padding: '10px 24px', borderRadius: '10px',
                  border: 'none', background: 'var(--ink)',
                  color: 'var(--surface)', fontSize: '13px', fontWeight: 700,
                  fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                  opacity: loading || !location ? 0.45 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {loading ? 'Creating…' : 'Add Order'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
