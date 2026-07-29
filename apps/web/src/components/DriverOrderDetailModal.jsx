import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DriverOrderDetailModal({ order, isOpen, onClose, onUpdateStatus }) {
  if (!isOpen || !order) return null;

  const [currentStep, setCurrentStep] = useState(() => {
    if (order.status === 'completed' || order.status === 'delivered') return 5;
    if (order.status === 'arrived') return 2;
    if (order.status === 'in_transit') return 1;
    return 0; // assigned
  });

  const [photoUrl, setPhotoUrl] = useState(order.photo || null);
  const [signatureText, setSignatureText] = useState(order.signature || '');
  const [isSigning, setIsSigning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleStartDraw = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleDraw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'var(--ink)';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleStopDraw = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureText('');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
    }
  };

  const samplePhotos = [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300&auto=format&fit=crop&q=80',
  ];

  const handleStepAction = async (nextStep) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setCurrentStep(nextStep);
      setIsSubmitting(false);

      if (nextStep === 5) {
        onUpdateStatus(order.id, 'delivered', { photoUrl, signatureText: signatureText || 'Signed electronically' });
      }
    }, 400);
  };

  const STEPS = [
    { label: 'Assigned', icon: 'assignment' },
    { label: 'Navigate', icon: 'near_me' },
    { label: 'Arrived', icon: 'location_on' },
    { label: 'Delivered', icon: 'inventory_2' },
    { label: 'Upload Photo', icon: 'photo_camera' },
    { label: 'Completed', icon: 'check_circle' },
  ];

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(5px)',
      }} onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 540,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            maxHeight: 'calc(100vh - 40px)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'between',
            background: 'var(--surface-raised)',
          }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                Order #{order.id}
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{order.customerName}</h3>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', marginLeft: 'auto',
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Delivery Workflow Stepper */}
            <div style={{
              background: 'var(--surface-raised)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 16,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', uppercase: true, letterSpacing: '0.04em' }}>
                Delivery Workflow Progress
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, position: 'relative' }}>
                {STEPS.map((s, idx) => {
                  const done = idx <= currentStep;
                  const active = idx === currentStep;
                  return (
                    <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 2 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: done ? 'var(--ink)' : 'var(--surface)',
                        border: active ? '2px solid var(--accent-blue)' : '1px solid var(--border)',
                        color: done ? 'var(--surface)' : 'var(--ink-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700,
                        transition: 'all 0.2s',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{s.icon}</span>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? 'var(--ink)' : 'var(--ink-muted)', textAlign: 'center' }}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Phone</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--accent-blue)' }}>call</span>
                  <a href={`tel:${order.phone}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>{order.phone}</a>
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Package Weight</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>scale</span>
                  {order.weight_kg} kg
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, gridColumn: 'span 2' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Delivery Address</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 2, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--accent-red)', marginTop: 2 }}>location_on</span>
                  <span><strong style={{ color: '#2563EB' }}>[Order #{order.id}]</strong> {order.address}</span>
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Delivery Window</span>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>
                  {order.window || '09:00 AM - 11:30 AM'}
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Current Status</span>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginTop: 2, textTransform: 'capitalize' }}>
                  ● {order.status}
                </div>
              </div>

              <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, gridColumn: 'span 2' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Special Instructions</span>
                <p style={{ fontSize: 12, color: 'var(--ink)', marginTop: 2, fontStyle: 'italic' }}>
                  "{order.instructions || 'Handle with care. Call customer 5 mins before arrival.'}"
                </p>
              </div>
            </div>

            {/* Proof of Delivery Workflow Section */}
            {currentStep >= 3 && (
              <div style={{
                border: '1px solid var(--border)', borderRadius: 14, padding: 16,
                background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Proof of Delivery (POD)</h4>

                {/* Photo Upload */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>
                    1. Package Photo
                  </label>
                  {photoUrl ? (
                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: 120 }}>
                      <img src={photoUrl} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        onClick={() => setPhotoUrl(null)}
                        style={{
                          position: 'absolute', top: 6, right: 6, padding: '4px 8px',
                          background: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: 6,
                          fontSize: 10, border: 'none', cursor: 'pointer',
                        }}
                      >
                        Change Photo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        id="photo-input"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <label
                          htmlFor="photo-input"
                          style={{
                            flex: 1, height: 44, borderRadius: 10, border: '1px dashed var(--border)',
                            background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--ink)', cursor: 'pointer',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>photo_camera</span>
                          Upload Delivery Photo
                        </label>
                        {samplePhotos.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => setPhotoUrl(url)}
                            style={{
                              padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
                              background: 'var(--surface)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
                            }}
                          >
                            Sample {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Signature */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>
                    2. Customer Signature (Optional)
                  </label>
                  <div style={{
                    border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)',
                    padding: 8, display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <canvas
                      ref={canvasRef}
                      width={460}
                      height={90}
                      onMouseDown={handleStartDraw}
                      onMouseMove={handleDraw}
                      onMouseUp={handleStopDraw}
                      onTouchStart={handleStartDraw}
                      onTouchMove={handleDraw}
                      onTouchEnd={handleStopDraw}
                      style={{
                        width: '100%', height: 90, background: 'var(--surface-raised)',
                        borderRadius: 6, border: '1px border-subtle', cursor: 'crosshair',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Or type customer name..."
                        value={signatureText}
                        onChange={e => setSignatureText(e.target.value)}
                        style={{
                          flex: 1, border: 'none', outline: 'none', background: 'transparent',
                          fontSize: 12, color: 'var(--ink)', marginRight: 10,
                        }}
                      />
                      <button
                        onClick={clearSignature}
                        style={{
                          fontSize: 11, color: 'var(--ink-muted)', background: 'none', border: 'none',
                          cursor: 'pointer', textDecoration: 'underline',
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div style={{
            padding: '16px 20px', borderTop: '1px solid var(--border)',
            background: 'var(--surface-raised)', display: 'flex', gap: 10,
          }}>
            {currentStep === 0 && (
              <button
                onClick={() => handleStepAction(1)}
                disabled={isSubmitting}
                style={{
                  flex: 1, height: 44, borderRadius: 12, background: 'var(--ink)', color: 'var(--surface)',
                  fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>near_me</span>
                Start Navigation
              </button>
            )}

            {currentStep === 1 && (
              <button
                onClick={() => handleStepAction(2)}
                disabled={isSubmitting}
                style={{
                  flex: 1, height: 44, borderRadius: 12, background: 'var(--ink)', color: 'var(--surface)',
                  fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>location_on</span>
                Mark Arrived at Stop
              </button>
            )}

            {currentStep === 2 && (
              <button
                onClick={() => handleStepAction(3)}
                disabled={isSubmitting}
                style={{
                  flex: 1, height: 44, borderRadius: 12, background: 'var(--ink)', color: 'var(--surface)',
                  fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>inventory_2</span>
                Mark Delivered & Upload POD
              </button>
            )}

            {currentStep >= 3 && currentStep < 5 && (
              <button
                onClick={() => handleStepAction(5)}
                disabled={isSubmitting}
                style={{
                  flex: 1, height: 44, borderRadius: 12, background: 'var(--ink)', color: 'var(--surface)',
                  fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                Complete Delivery
              </button>
            )}

            {currentStep === 5 && (
              <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent-green)', padding: 10 }}>
                ✓ Delivery Completed & Verified
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
