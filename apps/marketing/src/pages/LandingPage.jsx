import React, { useEffect } from 'react';
import LogoLoop from '../components/LogoLoop';
import ScrollStack from '../components/ScrollStack';
import AnimatedList from '../components/AnimatedList';
import Carousel from '../components/Carousel';
import { PolarisLogo } from '../PolarisLogo';
import PremiumHero from '../components/PremiumHero';
import SplitShowcase from '../components/SplitShowcase';
import './LandingPage.css';

const TECH_STACK = [
  "OR-Tools", "OSRM", "React", "Node.js", "PostgreSQL", "Redis", "Socket.io", "Leaflet", "Docker", "FastAPI", "Python"
].map(name => ({
  node: (
    <span className="tech-pill">{name}</span>
  )
}));

const HOW_IT_WORKS = [
  { title: "Upload your map", desc: "Crop an OpenStreetMap extract for your target city. OSRM builds a routing graph in seconds." },
  { title: "Add drivers & orders", desc: "Enter your fleet details (capacity, home base) and the day's delivery orders with time windows." },
  { title: "Hit Solve", desc: "OR-Tools runs the CVRPTW solver using real drive times from OSRM. Routes are assigned and sequenced." },
  { title: "Dispatch & track", desc: "Drivers follow their optimized routes. Dispatchers watch live GPS positions on the map." },
  { title: "Re-optimize on the fly", desc: "New order? Driver called in sick? Re-solve with one click. The system adapts." },
];

const SCREENSHOTS = [
  { image: "/screenshots/dashboard-placeholder.png", caption: "Live dispatch map" },
  { image: "/screenshots/optimize-placeholder.png", caption: "One-click route optimization" },
  { image: "/screenshots/driver-placeholder.png", caption: "Simplified driver view" },
];

export default function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      <nav className="nav">
        <PolarisLogo />
        <div className="nav-links">
          <span>Product</span>
          <span>Pricing</span>
          <span>About</span>
          <span>Contact</span>
        </div>
        <button className="nav-cta" onClick={() => window.location.href = '/app'}>Get Started</button>
      </nav>

      <PremiumHero 
        title="Route optimization, built for real fleets."
        subtitle="Polaris plans your drivers' routes the way Amazon and DPD do — real roads, real constraints, solved in seconds."
        ctaText="See it in action"
        onCtaClick={() => window.location.href = '/app'}
        imageSrc="/screenshots/image.png"
      />

      <section className="logo-loop-section">
        <p className="section-label">Built with</p>
        <LogoLoop logos={TECH_STACK} speed={80} pauseOnHover />
      </section>

      <ScrollStack useWindowScroll={true}>
        <div className="stack-panel grid-overlay scroll-stack-card">
          <div className="stack-content">
            <div className="stack-text">
              <h2>Real roads, not straight lines</h2>
              <p>Every drive time comes from a self-hosted OSRM instance running on real OpenStreetMap data — the same road-network data behind most modern map apps.</p>
            </div>
            <div className="stack-image">
              <img src="/screenshots/dashboard-placeholder.png" alt="Dashboard map showing real roads" />
            </div>
          </div>
        </div>
        <div className="stack-panel grid-overlay scroll-stack-card">
          <div className="stack-content">
            <div className="stack-text">
              <h2>Solves what Amazon solves</h2>
              <p>Assign orders across your fleet and sequence every driver's stops at once, respecting vehicle capacity and delivery time windows — not just one driver, one route.</p>
            </div>
            <div className="stack-image">
              <img src="/screenshots/optimize-placeholder.png" alt="Route optimization results" />
            </div>
          </div>
        </div>
        <div className="stack-panel grid-overlay scroll-stack-card">
          <div className="stack-content">
            <div className="stack-text">
              <h2>Live, not static</h2>
              <p>Dispatchers see drivers move on the map in real time, and can drag a stop to a different driver mid-day without starting the whole plan over.</p>
            </div>
            <div className="stack-image">
              <img src="/screenshots/driver-placeholder.png" alt="Live driver tracking" />
            </div>
          </div>
        </div>
      </ScrollStack>

      <SplitShowcase 
        tagline="Multi-Driver Capacity Constraints"
        title="Solve delivery schedules at industrial scale"
        description="Polaris leverages Google OR-Tools to solve the Capacitated Vehicle Routing Problem with Time Windows (CVRPTW). It maps out optimized driver schedules, vehicle load distributions, and arrival ETA sequences on real-road data."
        imageSrc="/screenshots/image copy.png"
        reverse={false}
      />

      <section className="feature-grid-section fade-in-up">
        <h2>Everything a dispatcher needs</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <span className="feature-icon">🛣️</span>
            <h3>Real drive times</h3>
            <p>Routes calculated on actual roads via self-hosted OSRM, not straight-line distance.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🚛</span>
            <h3>Multi-driver optimization</h3>
            <p>OR-Tools solves capacity and time-window constraints across your whole fleet at once.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📍</span>
            <h3>Live tracking</h3>
            <p>Watch drivers move on the dispatch map in real time as they complete stops.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Instant re-optimization</h3>
            <p>New order comes in mid-day? Re-solve without starting the whole plan over.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works-section">
        <h2>How Polaris works</h2>
        <AnimatedList items={HOW_IT_WORKS} showGradients={false} displayScrollbar={false} />
      </section>

      <section className="carousel-section grid-overlay">
        <h2>See the dashboard</h2>
        <Carousel items={SCREENSHOTS} baseWidth={700} autoplay autoplayDelay={4000} loop />
      </section>

      <section className="cta-banner">
        <h2>Ready to optimize your fleet?</h2>
        <p>Get started with Polaris in minutes. No credit card required.</p>
        <button className="cta-banner-button">Get started free</button>
      </section>

      <footer className="footer">
        <PolarisLogo />
        <div className="footer-links">
          <span>Product</span>
          <span>Pricing</span>
          <span>About</span>
          <span>Contact</span>
        </div>
        <p>&copy; 2026 Polaris. Built as a portfolio project.</p>
      </footer>
    </div>
  );
}
