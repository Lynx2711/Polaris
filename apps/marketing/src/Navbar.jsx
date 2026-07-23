import { useState, useEffect, useRef } from "react";
import { PolarisLogo } from "./PolarisLogo";
import "./Navbar.css";

/* Counts from 0 → target over ~900ms whenever 'active' flips to true */
function useCountUp(target, active, duration = 900) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active) { setVal(0); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, target, duration]);

  return val;
}

export function Navbar() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Animated counters for the Platform Stats popup
  const countOrders  = useCountUp(248,  isStatsOpen, 1000);
  const countDrivers = useCountUp(18,   isStatsOpen, 700);
  const countETA     = useCountUp(14,   isStatsOpen, 600);
  const countUptime  = useCountUp(998,  isStatsOpen, 1200); // 99.8 shown as 998 then formatted

  // Toggle Dark Mode
  const toggleTheme = () => {
    const updatedMode = !isDarkMode;
    setIsDarkMode(updatedMode);
    if (updatedMode) {
      document.documentElement.classList.add("dark-theme");
    } else {
      document.documentElement.classList.remove("dark-theme");
    }
  };

  const toggleMore = () => {
    setIsMoreOpen(!isMoreOpen);
    if (isExploreOpen) setIsExploreOpen(false);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const toggleExplore = () => {
    setIsExploreOpen(!isExploreOpen);
    if (isMoreOpen) setIsMoreOpen(false);
    if (isStatsOpen) setIsStatsOpen(false);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const toggleStats = () => {
    setIsStatsOpen(!isStatsOpen);
    if (isMoreOpen) setIsMoreOpen(false);
    if (isExploreOpen) setIsExploreOpen(false);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isMoreOpen) setIsMoreOpen(false);
    if (isExploreOpen) setIsExploreOpen(false);
    if (isStatsOpen) setIsStatsOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMoreOpen(false);
        setIsExploreOpen(false);
        setIsStatsOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <nav className="ps-nav">
        <div className="ps-nav__container">
          {/* Logo on Left */}
          <div className="ps-nav__brand">
            <PolarisLogo />
          </div>

          {/* All links aligned on the right, as requested */}
          <div className="ps-nav__right-wrapper">
            <div className="ps-nav__menu">
              <a href="#about" className="ps-nav__link">About</a>
              <a href="#features" className="ps-nav__link">Features</a>
              <a href="http://localhost:5174/login" className="ps-nav__link">Dashboard</a>
              <button 
                onClick={toggleMore} 
                className={`ps-nav__link ps-nav__link--more ${isMoreOpen ? "is-active" : ""}`}
              >
                More
              </button>
            </div>

            {/* Utility Controls */}
            <div className="ps-nav__actions">
              {/* 📍 Location Pin — opens Explore Polaris demo drawer */}
              <button 
                onClick={toggleExplore} 
                className={`ps-nav__action-btn ${isExploreOpen ? "is-active" : ""}`}
                aria-label="Explore Polaris demo"
                title="Explore Polaris"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ps-icon">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="9" r="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* 🌐 Globe — opens Platform Stats popup */}
              <div className="ps-stats-wrap">
                <button 
                  onClick={toggleStats} 
                  className={`ps-nav__action-btn ${isStatsOpen ? "is-active" : ""}`}
                  aria-label="Platform stats"
                  title="Platform Stats"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ps-icon">
                    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 2a14.5 14.5 0 000 20M12 2a14.5 14.5 0 010 20M2 12h20" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Stats popup */}
                <div className={`ps-stats-popup ${isStatsOpen ? "is-open" : ""}`}>
                  <div className="ps-stats-popup__head">
                    <span className="ps-stats-popup__title">Platform Status</span>
                    <span className="ps-stats-live"><span className="ps-stats-live__dot"/>Live</span>
                  </div>
                  <div className="ps-stats-popup__grid">
                    <div className="ps-stat-item">
                      <span className="ps-stat-item__val">{countOrders}</span>
                      <span className="ps-stat-item__key">Orders today</span>
                    </div>
                    <div className="ps-stat-item">
                      <span className="ps-stat-item__val">{countDrivers}</span>
                      <span className="ps-stat-item__key">Drivers online</span>
                    </div>
                    <div className="ps-stat-item">
                      <span className="ps-stat-item__val">{countETA}m</span>
                      <span className="ps-stat-item__key">Avg ETA</span>
                    </div>
                    <div className="ps-stat-item">
                      <span className="ps-stat-item__val">{(countUptime / 10).toFixed(1)}%</span>
                      <span className="ps-stat-item__key">Uptime</span>
                    </div>
                  </div>
                  <div className="ps-stats-popup__links">
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="ps-stats-link">GitHub →</a>
                    <a href="/contact" className="ps-stats-link">API Docs →</a>
                    <a href="/contact" className="ps-stats-link">Contact →</a>
                  </div>
                </div>
              </div>

              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className="ps-nav__action-btn ps-nav__theme-toggle"
                aria-label="Toggle theme mode"
              >
                {isDarkMode ? (
                  /* Sun Icon */
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ps-icon">
                    <circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  /* Moon Icon */
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ps-icon">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              {/* Sign In / Sign Up toggle link */}
              <a href="http://localhost:5174/login" className="ps-nav__link ps-nav__auth-btn">
                Sign In
              </a>

              {/* Mobile Menu Toggle Button */}
              <button 
                onClick={toggleMobileMenu}
                className={`ps-nav__hamburger ${isMobileMenuOpen ? "is-open" : ""}`}
                aria-label="Toggle menu"
              >
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </div>

        {/* Full-width "More" Dropdown Panel */}
        <div className={`ps-more-panel ${isMoreOpen ? "is-open" : ""}`}>
          <div className="ps-more-panel__container container">
            <div className="ps-more-panel__grid">
              <div className="ps-more-panel__col">
                <h4 className="ps-more-panel__title">Platform</h4>
                <a href="#about" onClick={() => setIsMoreOpen(false)}>About Polaris</a>
                <a href="#features" onClick={() => setIsMoreOpen(false)}>Optimization Engine</a>
                <a href="http://localhost:5174/login" onClick={() => setIsMoreOpen(false)}>Dispatcher Dashboard</a>
                <a href="#how-it-works" onClick={() => setIsMoreOpen(false)}>How it works</a>
                <a href="#results" onClick={() => setIsMoreOpen(false)}>Operational Metrics</a>
              </div>
              <div className="ps-more-panel__col">
                <h4 className="ps-more-panel__title">Resources</h4>
                <a href="#documentation" onClick={() => setIsMoreOpen(false)}>Documentation</a>
                <a href="https://github.com" target="_blank" rel="noreferrer">GitHub Repository</a>
                <a href="#tech" onClick={() => setIsMoreOpen(false)}>Technology Stack</a>
                <a href="#newsletter" onClick={() => setIsMoreOpen(false)}>Newsletter sign up</a>
                <a href="/contact" onClick={() => setIsMoreOpen(false)}>Contact support</a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Explore Polaris Drawer — replaces the old market/region selector */}
      <div className={`ps-market-drawer ${isExploreOpen ? "is-open" : ""}`}>
        <div className="ps-market-drawer__overlay" onClick={toggleExplore} />
        <div className="ps-market-drawer__content">
          <div className="ps-market-drawer__header">
            <h3 className="ps-market-drawer__title">Explore Polaris</h3>
            <button className="ps-market-drawer__close" onClick={toggleExplore} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ps-icon">
                <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="ps-market-drawer__body">
            <p className="ps-explore-intro">
              A live preview of the platform — no account needed.
            </p>

            <div className="ps-explore-items">
              <a href="/demo?tab=fleet" className="ps-explore-item" onClick={toggleExplore}>
                <span className="ps-explore-item__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                </span>
                <div className="ps-explore-item__body">
                  <span className="ps-explore-item__label">Fleet Operations</span>
                  <span className="ps-explore-item__desc">Manage orders and drivers</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ps-explore-item__arrow">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>

              <a href="/demo?tab=tracking" className="ps-explore-item" onClick={toggleExplore}>
                <span className="ps-explore-item__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                  </svg>
                </span>
                <div className="ps-explore-item__body">
                  <span className="ps-explore-item__label">Live Tracking</span>
                  <span className="ps-explore-item__desc">Monitor deliveries in real time</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ps-explore-item__arrow">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>

              <a href="/demo?tab=routes" className="ps-explore-item" onClick={toggleExplore}>
                <span className="ps-explore-item__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M5 8v4c0 2.21 1.79 4 4 4h6c2.21 0 4 1.79 4 4"/><path d="M19 4l-4 4 4 4"/>
                  </svg>
                </span>
                <div className="ps-explore-item__body">
                  <span className="ps-explore-item__label">AI Route Planner</span>
                  <span className="ps-explore-item__desc">Generate optimized routes</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ps-explore-item__arrow">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>

              <a href="/demo?tab=analytics" className="ps-explore-item" onClick={toggleExplore}>
                <span className="ps-explore-item__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
                  </svg>
                </span>
                <div className="ps-explore-item__body">
                  <span className="ps-explore-item__label">Analytics</span>
                  <span className="ps-explore-item__desc">Measure operational performance</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ps-explore-item__arrow">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>

            <div className="ps-explore-footer">
              <a href="http://localhost:5174/signup" className="ps-explore-cta">
                Get full access — Sign up free
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div className={`ps-mobile-drawer ${isMobileMenuOpen ? "is-open" : ""}`}>
        <div className="ps-mobile-drawer__content">
          <a href="#about" className="ps-mobile-drawer__link" onClick={toggleMobileMenu}>About</a>
          <a href="#features" className="ps-mobile-drawer__link" onClick={toggleMobileMenu}>Features</a>
          <a href="http://localhost:5174/login" className="ps-mobile-drawer__link" onClick={toggleMobileMenu}>Dashboard</a>
          <a href="http://localhost:5174/login" className="ps-mobile-drawer__link" onClick={toggleMobileMenu}>Sign In / Sign Up</a>
          
          <div className="ps-mobile-drawer__separator" />
          
          <h4 className="ps-mobile-drawer__section-title">Platform</h4>
          <a href="#how-it-works" className="ps-mobile-drawer__sublink" onClick={toggleMobileMenu}>How It Works</a>
          <a href="#results" className="ps-mobile-drawer__sublink" onClick={toggleMobileMenu}>Operational Metrics</a>
          
          <h4 className="ps-mobile-drawer__section-title" style={{ marginTop: "24px" }}>Resources</h4>
          <a href="#documentation" className="ps-mobile-drawer__sublink" onClick={toggleMobileMenu}>Documentation</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="ps-mobile-drawer__sublink" onClick={toggleMobileMenu}>GitHub</a>
        </div>
      </div>
    </>
  );
}
