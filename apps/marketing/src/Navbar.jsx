import { useState, useEffect } from "react";
import { PolarisLogo } from "./PolarisLogo";
import "./Navbar.css";

export function Navbar() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
    if (isMarketOpen) setIsMarketOpen(false);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const toggleMarket = () => {
    setIsMarketOpen(!isMarketOpen);
    if (isMoreOpen) setIsMoreOpen(false);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isMoreOpen) setIsMoreOpen(false);
    if (isMarketOpen) setIsMarketOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMoreOpen(false);
        setIsMarketOpen(false);
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
              <a href="http://localhost:5173/" className="ps-nav__link">Dashboard</a>
              <button 
                onClick={toggleMore} 
                className={`ps-nav__link ps-nav__link--more ${isMoreOpen ? "is-active" : ""}`}
              >
                More
              </button>
            </div>

            {/* Utility Controls */}
            <div className="ps-nav__actions">
              {/* Location Pin Icon */}
              <button 
                onClick={toggleMarket} 
                className={`ps-nav__action-btn ${isMarketOpen ? "is-active" : ""}`}
                aria-label="Select location"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ps-icon">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="9" r="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Globe Icon */}
              <button 
                onClick={toggleMarket} 
                className="ps-nav__action-btn"
                aria-label="Select language"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ps-icon">
                  <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2a14.5 14.5 0 000 20M12 2a14.5 14.5 0 010 20M2 12h20" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

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
              <a href="#signin" className="ps-nav__link ps-nav__auth-btn">
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
                <a href="http://localhost:5173/" onClick={() => setIsMoreOpen(false)}>Dispatcher Dashboard</a>
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

      {/* Slide-over Market Selection Drawer */}
      <div className={`ps-market-drawer ${isMarketOpen ? "is-open" : ""}`}>
        <div className="ps-market-drawer__overlay" onClick={toggleMarket} />
        <div className="ps-market-drawer__content">
          <div className="ps-market-drawer__header">
            <h3 className="ps-market-drawer__title">Select your market</h3>
            <button className="ps-market-drawer__close" onClick={toggleMarket} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ps-icon">
                <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="ps-market-drawer__body">
            <div className="ps-market-group">
              <h4 className="ps-market-group__title">Asia-Pacific</h4>
              <div className="ps-market-links">
                <a href="#market-global" onClick={toggleMarket}>Global / English</a>
                <a href="#market-india" onClick={toggleMarket}>India / English</a>
                <a href="#market-aus" onClick={toggleMarket}>Australia / English</a>
                <a href="#market-jp" onClick={toggleMarket}>Japan / 日本語</a>
                <a href="#market-kr" onClick={toggleMarket}>South Korea / 한국어</a>
              </div>
            </div>

            <div className="ps-market-group">
              <h4 className="ps-market-group__title">Europe</h4>
              <div className="ps-market-links">
                <a href="#market-uk" onClick={toggleMarket}>United Kingdom / English</a>
                <a href="#market-de" onClick={toggleMarket}>Deutschland / Deutsch</a>
                <a href="#market-fr" onClick={toggleMarket}>France / Français</a>
                <a href="#market-se" onClick={toggleMarket}>Sverige / Svenska</a>
                <a href="#market-nl" onClick={toggleMarket}>Nederland / Nederlands</a>
              </div>
            </div>

            <div className="ps-market-group">
              <h4 className="ps-market-group__title">North America</h4>
              <div className="ps-market-links">
                <a href="#market-us" onClick={toggleMarket}>United States / English</a>
                <a href="#market-ca" onClick={toggleMarket}>Canada / English</a>
                <a href="#market-ca-fr" onClick={toggleMarket}>Canada / Français</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div className={`ps-mobile-drawer ${isMobileMenuOpen ? "is-open" : ""}`}>
        <div className="ps-mobile-drawer__content">
          <a href="#about" className="ps-mobile-drawer__link" onClick={toggleMobileMenu}>About</a>
          <a href="#features" className="ps-mobile-drawer__link" onClick={toggleMobileMenu}>Features</a>
          <a href="http://localhost:5173/" className="ps-mobile-drawer__link" onClick={toggleMobileMenu}>Dashboard</a>
          <a href="#signin" className="ps-mobile-drawer__link" onClick={toggleMobileMenu}>Sign In / Sign Up</a>
          
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
