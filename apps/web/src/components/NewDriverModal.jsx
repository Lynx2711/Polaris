import { useState } from 'react';
import { X, Truck, Phone, Scale, Mail } from 'lucide-react';
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

export default function NewDriverModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState('500');
  const [homeLocation, setHomeLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name) {
      setError("Please enter the driver's full name.");
      return;
    }
    if (!homeLocation) {
      setError("Please search for and confirm the driver's depot location.");
      return;
    }
    if (!capacity) {
      setError("Please enter vehicle capacity.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit({
        name,
        email: email || null,
        phone: phone || null,
        vehicle_capacity_kg: parseFloat(capacity),
        home_lat: homeLocation.lat,
        home_lng: homeLocation.lng,
      });
      setName(''); setEmail(''); setPhone(''); setCapacity('500'); setHomeLocation(null);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add driver.');
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
              <Truck size={20} />
            </div>
            <div>
              <h3 style={{
                fontSize: '16px', fontWeight: 700,
                fontFamily: "'Hanken Grotesk', sans-serif",
                color: 'var(--ink)', margin: 0, lineHeight: 1.2,
              }}>
                Add Fleet Driver
              </h3>
              <p style={{
                fontSize: '12px', color: 'var(--ink-muted)',
                margin: '2px 0 0 0', fontFamily: 'Inter, sans-serif',
              }}>
                Register driver details and starting depot location
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
            
            {/* Driver Full Name */}
            <div>
              <label style={labelStyle}>Driver Full Name *</label>
              <div style={inputContainerStyle}>
                <Truck size={16} style={{ color: 'var(--ink-dim)' }} />
                <input
                  type="text"
                  placeholder="e.g. Rajwinder Singh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputFieldStyle}
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label style={labelStyle}>Email (Optional — Driver App Login)</label>
              <div style={inputContainerStyle}>
                <Mail size={16} style={{ color: 'var(--ink-dim)' }} />
                <input
                  type="email"
                  placeholder="driver@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputFieldStyle}
                />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--ink-dim)', margin: '6px 0 0 0', fontFamily: 'Inter, sans-serif' }}>
                Generates driver login account with initial password: <code style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--ink)' }}>password123</code>
              </p>
            </div>

            {/* Phone & Capacity Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <div style={inputContainerStyle}>
                  <Phone size={16} style={{ color: 'var(--ink-dim)' }} />
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputFieldStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Vehicle Capacity (kg) *</label>
                <div style={inputContainerStyle}>
                  <Scale size={16} style={{ color: 'var(--ink-dim)' }} />
                  <input
                    type="number"
                    min="1"
                    step="10"
                    placeholder="500"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    style={inputFieldStyle}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Depot Location Search */}
            <div>
              <label style={labelStyle}>Depot / Starting Location *</label>
              <AddressSearchField
                onSelect={setHomeLocation}
                initialLat={31.298}
                initialLng={75.647}
                placeholder="Type depot address — e.g. Nakodar Road, Jalandhar, Punjab"
              />
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
                disabled={loading || !homeLocation}
                style={{
                  padding: '10px 24px', borderRadius: '10px',
                  border: 'none', background: 'var(--ink)',
                  color: 'var(--surface)', fontSize: '13px', fontWeight: 700,
                  fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                  opacity: loading || !homeLocation ? 0.45 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {loading ? 'Adding…' : 'Add Fleet Driver'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
