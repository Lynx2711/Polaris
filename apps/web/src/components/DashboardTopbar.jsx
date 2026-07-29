import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

/* ─────────────────────────────────────────────────────────────
   Polaris Logo
   ───────────────────────────────────────────────────────────── */
function LogoBrand({ onClick }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showWord, setShowWord] = useState(false);

  const play = () => {
    setIsAnimating(false);
    requestAnimationFrame(() => setIsAnimating(true));
  };

  useEffect(() => {
    const t1 = setTimeout(() => {
      play();
      setTimeout(() => setShowWord(true), 400);
    }, 300);
    const t2 = setTimeout(() => {
      const id = setInterval(play, 10000);
      return () => clearInterval(id);
    }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: 0 }}>
      <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{
          width: '100%', height: '100%',
          transformOrigin: 'center',
          animation: isAnimating ? 'dash-nav-spin 1.2s cubic-bezier(0.25,1,0.5,1)' : 'none',
        }}>
          <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', display: 'block' }}>
            <path d="M101,42 L101,98 L157,96 C144,88 122,66 101,42 Z" style={{ fill: 'var(--ink)' }} />
            <path d="M43,102 L98,102 L98,158 C93,135 66,118 43,102 Z" style={{ fill: 'var(--ink)' }} />
          </svg>
        </div>
      </div>
      <div style={{
        overflow: 'hidden',
        maxWidth: showWord ? 120 : 0,
        transition: 'max-width 0.75s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <span style={{
          display: 'block',
          paddingLeft: 10,
          fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.10em',
          color: 'var(--ink)', whiteSpace: 'nowrap',
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          transform: showWord ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.75s cubic-bezier(0.16,1,0.3,1)',
        }}>
          POLARIS
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Expandable Search Bar
   ───────────────────────────────────────────────────────────── */
function SearchBar() {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const expand = () => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const collapse = () => {
    if (!query) setExpanded(false);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      height: 38,
      width: expanded ? 280 : 38,
      borderRadius: 10,
      border: expanded ? '1px solid var(--border)' : '1px solid transparent',
      background: expanded ? 'var(--surface-raised)' : 'none',
      transition: 'width 0.35s cubic-bezier(0.16,1,0.3,1), background 0.2s, border-color 0.2s',
      overflow: 'hidden',
      cursor: expanded ? 'text' : 'pointer',
      position: 'relative',
    }}
      onClick={!expanded ? expand : undefined}
    >
      {/* Search icon */}
      <div style={{
        width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: expanded ? 'var(--ink-muted)' : 'var(--ink-muted)',
        cursor: 'pointer',
      }} onClick={expand}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 17, height: 17 }}>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onBlur={collapse}
        placeholder="Search drivers, orders..."
        style={{
          flex: 1, border: 'none', background: 'none', outline: 'none',
          fontSize: 13, color: 'var(--ink)', fontFamily: 'Inter, sans-serif',
          paddingRight: 12,
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? 'auto' : 'none',
          transition: 'opacity 0.2s',
        }}
      />

      {/* Clear button */}
      {expanded && query && (
        <button
          onClick={() => { setQuery(''); inputRef.current?.focus(); }}
          style={{
            width: 24, height: 24, borderRadius: '50%', border: 'none',
            background: 'var(--border)', color: 'var(--ink-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', marginRight: 6, fontSize: 12, flexShrink: 0,
          }}
        >✕</button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DashboardTopbar — Minimalist macOS/SaaS vibe
   ───────────────────────────────────────────────────────────── */
export default function DashboardTopbar({ riskCount = 0, onTabChange }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const userName = user?.name || user?.fullName || (user?.email ? user.email.split('@')[0] : 'User');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const formatRole = (role) => {
    if (!role) return 'Member';
    if (role === 'superadmin') return 'Platform Admin';
    if (role === 'dispatcher') return 'Dispatcher';
    if (role === 'admin') return 'Admin';
    if (role === 'driver') return 'Driver';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };
  const userRole = formatRole(user?.role);
  const avatarInitial = (userName[0] || 'U').toUpperCase();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    height: 64,
    background: scrolled ? 'var(--glass-bg, rgba(255,255,255,0.85))' : 'var(--bg)',
    backdropFilter: scrolled ? 'blur(12px) saturate(180%)' : 'none',
    WebkitBackdropFilter: scrolled ? 'blur(12px) saturate(180%)' : 'none',
    borderBottom: '1px solid var(--border)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    userSelect: 'none',
    transition: 'background 0.3s, backdrop-filter 0.3s',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  };

  const btnStyle = {
    background: 'none', border: 'none',
    width: 38, height: 38,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--ink-muted)',
    cursor: 'pointer',
    transition: 'color 0.15s, background 0.15s',
    borderRadius: 10,
    flexShrink: 0,
  };

  return (
    <>
      <style>{`
        @keyframes dash-nav-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .dash-nav-btn:hover { background: var(--surface-raised) !important; color: var(--ink) !important; }
        .dash-nav-btn:active { transform: scale(0.93); }
        .dash-nav-avatar:hover { background: var(--surface-raised) !important; border-color: var(--border) !important; }
      `}</style>

      <nav style={navStyle}>
        <div style={{ width: '100%', padding: '0 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', gap: 16 }}>
          {/* LEFT: Logo */}
          <LogoBrand onClick={() => navigate('/dashboard')} />

          {/* RIGHT: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

            {/* Expandable Search */}
            <SearchBar />

            {/* Notifications */}
            <button className="dash-nav-btn" style={btnStyle} title="Notifications" aria-label="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 18, height: 18 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {riskCount > 0 && (
                <span style={{
                  position: 'absolute', top: 7, right: 7,
                  width: 7, height: 7,
                  background: '#EF4444',
                  borderRadius: '50%',
                  border: '2px solid var(--bg)',
                }} />
              )}
            </button>

            {/* Theme toggle */}
            <button className="dash-nav-btn" style={btnStyle} onClick={toggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              aria-label="Toggle theme">
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 18, height: 18 }}>
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 18, height: 18 }}>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Logout button */}
            <button
              className="dash-nav-btn animate-fade-in"
              style={{ ...btnStyle, color: 'var(--accent-red, #BA1A1A)' }}
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
            </button>

            {/* Divider */}
            <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }} />

            {/* Profile — avatar uses ink bg + surface text so it works in both modes */}
            <button
              className="dash-nav-avatar"
              onClick={() => (onTabChange ? onTabChange('settings') : navigate('/profile'))}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'transparent', border: '1px solid transparent', cursor: 'pointer',
                padding: '4px 6px 4px 10px',
                borderRadius: 24,
                transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
              }}
              aria-label="Profile"
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, letterSpacing: '0.01em',
                  color: 'var(--ink)', lineHeight: 1.2,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {userName}
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 500, letterSpacing: '0.04em',
                  textTransform: 'uppercase', color: 'var(--ink-muted)', lineHeight: 1.2,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {userRole}
                </div>
              </div>

              {/* Avatar circle — explicitly contrast-safe */}
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                /* Always dark bg + white text regardless of theme */
                background: '#1A1C1C',
                color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                fontFamily: "'Inter', sans-serif",
                flexShrink: 0,
                letterSpacing: '0.02em',
              }}>
                {avatarInitial}
              </div>
            </button>

          </div>
        </div>
      </nav>
    </>
  );
}
