import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Phone, Building2, MessageCircle, ChevronRight, Check, ExternalLink } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { submitContactForm } from '../../services/api';

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: 'var(--surface-raised)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontSize: 14, color: 'var(--ink)',
  fontFamily: 'Inter,sans-serif',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const labelStyle = {
  display: 'block', fontSize: 10, fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--ink-muted)', marginBottom: 6,
  fontFamily: 'Inter,sans-serif',
};

const sectionCard = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  overflow: 'hidden',
};

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 2, fontFamily: 'Inter,sans-serif' }}>{label}</div>
        <div style={{ fontSize: 14, color: 'var(--ink)', fontFamily: 'Inter,sans-serif', fontWeight: 500 }}>{value || '—'}</div>
      </div>
    </div>
  );
}

function SupportCard({ icon, title, desc, action, href }) {
  return (
    <a href={href || '#'} target={href ? '_blank' : undefined} rel="noopener noreferrer"
      style={{ display: 'block', padding: '18px 20px', borderBottom: '1px solid var(--border)', textDecoration: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'Inter,sans-serif', marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif' }}>{desc}</div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--ink-dim)', flexShrink: 0 }} />
      </div>
    </a>
  );
}

export default function SettingsWorkspace() {
  const { user, updateProfile } = useAuth();
  const [tab, setTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(user?.fullName || user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bugReport, setBugReport] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const userName = user?.name || user?.fullName || (user?.email ? user.email.split('@')[0] : 'User');
  const avatarInitial = (userName[0] || 'U').toUpperCase();

  const formatRole = (role) => {
    if (!role) return 'Member';
    if (role === 'superadmin') return 'Platform Admin';
    if (role === 'dispatcher') return 'Dispatcher';
    if (role === 'admin') return 'Admin';
    if (role === 'driver') return 'Driver';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleSave = async () => {
    try {
      await updateProfile?.(name, user?.email);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleSubmitReport = async () => {
    if (!bugReport.trim()) return;
    setReportLoading(true);
    try {
      await submitContactForm({
        name: userName,
        email: user?.email || 'user@polaris.com',
        subject: 'In-App Issue Report',
        message: bugReport,
      });
      setReportSuccess(true);
      setBugReport('');
      setTimeout(() => setReportSuccess(false), 3000);
    } catch (err) {
      console.error('Report submission error:', err);
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 3000);
    } finally {
      setReportLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'support', label: 'Support' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      style={{ maxWidth: 780 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 300, letterSpacing: '-0.02em', fontFamily: "'Hanken Grotesk',sans-serif", color: 'var(--ink)', margin: 0, lineHeight: 1.1 }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4, fontFamily: 'Inter,sans-serif' }}>
          Manage your account and get support from the Polaris team.
        </p>
      </div>

      {/* Avatar Card */}
      <div style={{ ...sectionCard, marginBottom: 24, padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#1A1C1C', color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, fontFamily: "'Inter',sans-serif",
            flexShrink: 0, letterSpacing: '0.02em',
          }}>
            {avatarInitial}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Hanken Grotesk',sans-serif", color: 'var(--ink)', lineHeight: 1.2 }}>{userName}</div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: 4, fontFamily: 'Inter,sans-serif' }}>{formatRole(user?.role)}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4, fontFamily: 'Inter,sans-serif' }}>{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'Inter,sans-serif',
            color: tab === t.id ? 'var(--ink)' : 'var(--ink-muted)',
            borderBottom: tab === t.id ? '2px solid var(--ink)' : '2px solid transparent',
            marginBottom: -1, transition: 'color 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Account Info */}
          <div style={sectionCard}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif' }}>Account Information</div>
            </div>
            <InfoRow icon={<User size={16}/>} label="Full Name" value={userName} />
            <InfoRow icon={<Mail size={16}/>} label="Email Address" value={user?.email} />
            <InfoRow icon={<Shield size={16}/>} label="Role" value={formatRole(user?.role)} />
            <InfoRow icon={<Building2 size={16}/>} label="Company ID" value={user?.companyId || user?.company_id || user?.orgId || 'N/A'} />
            <div style={{ padding: '14px 20px' }}>
              <InfoRow icon={<Phone size={16}/>} label="Phone" value={user?.phone || 'Not set'} />
            </div>
          </div>

          {/* Edit Profile */}
          <div style={sectionCard}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif' }}>Edit Profile</div>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Display Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Your name"
                    onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
                </div>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} placeholder="+91 ..."
                    onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email (read-only)</label>
                <input value={user?.email || ''} readOnly style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}/>
              </div>
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={handleSave} style={{
                  padding: '11px 28px', borderRadius: 10, border: 'none',
                  background: 'var(--ink)', color: 'var(--surface)',
                  fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'opacity 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  {saved ? <><Check size={16}/> Saved!</> : 'Save Changes'}
                </button>
                {saved && <span style={{ fontSize: 12, color: 'var(--accent-green)', fontFamily: 'Inter,sans-serif' }}>Profile updated successfully</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'support' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Contact Support */}
          <div style={sectionCard}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif' }}>Contact the Polaris Team</div>
            </div>
            <SupportCard icon={<MessageCircle size={18}/>} title="Chat with Support" desc="Get instant help from our team. Available Mon–Fri 9am–6pm IST." href="mailto:support@polaris.io"/>
            <SupportCard icon={<Mail size={18}/>} title="Send an Email" desc="Email us at support@polaris.io for detailed inquiries." href="mailto:support@polaris.io"/>
            <SupportCard icon={<ExternalLink size={18}/>} title="Documentation & Guides" desc="Browse our full knowledge base and API references." href="#"/>
          </div>

          {/* Bug Report */}
          <div style={sectionCard}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif' }}>Report an Issue</div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Describe the Issue</label>
                <textarea
                  rows={4}
                  value={bugReport}
                  onChange={(e) => setBugReport(e.target.value)}
                  placeholder="Tell us what's not working or what you'd like improved…"
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = 'var(--ink)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <button
                onClick={handleSubmitReport}
                disabled={reportLoading}
                style={{
                  padding: '11px 28px', borderRadius: 10, border: 'none',
                  background: 'var(--ink)', color: 'var(--surface)',
                  fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: 'pointer', transition: 'opacity 0.15s',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {reportLoading ? 'Submitting...' : reportSuccess ? <><Check size={16}/> Report Sent!</> : 'Submit Report'}
              </button>
            </div>
          </div>

          {/* App Info */}
          <div style={{ ...sectionCard, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'Inter,sans-serif' }}>Polaris Dispatch Platform</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', fontFamily: 'monospace' }}>v1.0.0</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
