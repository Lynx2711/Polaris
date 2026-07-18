// LandingPage.jsx
// Polaris marketing landing page — wires react-bits components with real project content.

import LogoLoop from '../components/LogoLoop';
import ScrollStack from '../components/ScrollStack';
import AnimatedList from '../components/AnimatedList';
import Carousel from '../components/Carousel';
import { PolarisLogo } from '../PolarisLogo';
import './LandingPage.css';

const TECH_STACK = [
  "OR-Tools", "OSRM", "React", "Node.js", "PostgreSQL", "Redis", "Socket.io", "Leaflet",
].map(name => ({
  node: (
    <span className="text-lg font-bold px-6 py-2 mx-2 bg-neutral-200/50 dark:bg-neutral-800/50 border border-neutral-300/30 rounded-lg text-neutral-800 dark:text-neutral-100 shadow-sm">
      {name}
    </span>
  )
}));

const FEATURE_BULLETS = [
  { id: 1, title: "Real drive times", desc: "Routes calculated on actual roads via self-hosted OSRM, not straight-line distance." },
  { id: 2, title: "Multi-driver optimization", desc: "OR-Tools solves capacity and time-window constraints across your whole fleet at once." },
  { id: 3, title: "Live tracking", desc: "Watch drivers move on the dispatch map in real time as they complete stops." },
  { id: 4, title: "Instant re-optimization", desc: "New order comes in mid-day? Re-solve without starting the whole plan over." },
];

const SCREENSHOTS = [
  { image: "/screenshots/dashboard-placeholder.png", caption: "Live dispatch map" },
  { image: "/screenshots/optimize-placeholder.png", caption: "One-click route optimization" },
  { image: "/screenshots/driver-placeholder.png", caption: "Simplified driver view" },
];

export default function LandingPage() {
  return (
    <div className="landing-page">

      {/* ---------- NAV ---------- */}
      <nav className="nav">
        <PolarisLogo />
        <div className="nav-links">
          <span>Product</span>
          <span>Pricing</span>
          <span>About</span>
          <span>Contact</span>
        </div>
      </nav>

      {/* ---------- HERO ---------- */}
      <section className="hero grid-overlay">
        <h1>Route optimization, built for real fleets.</h1>
        <p className="hero-subhead">
          Polaris plans your drivers' routes the way Amazon and DPD do — real roads,
          real constraints, solved in seconds.
        </p>
        <button className="cta-button">See it in action</button>
      </section>

      {/* ---------- LOGO LOOP: tech stack ---------- */}
      <section className="logo-loop-section">
        <p className="section-label">Built with</p>
        <LogoLoop logos={TECH_STACK} speed={80} />
      </section>

      {/* ---------- SCROLL STACK: feature sections ---------- */}
      <ScrollStack useWindowScroll={true}>
        <div className="stack-panel grid-overlay scroll-stack-card">
          <h2>Real roads, not straight lines</h2>
          <p>
            Every drive time comes from a self-hosted OSRM instance running on real
            OpenStreetMap data — the same road-network data behind most modern map apps.
          </p>
        </div>
        <div className="stack-panel grid-overlay scroll-stack-card">
          <h2>Solves what Amazon solves</h2>
          <p>
            Assign orders across your fleet and sequence every driver's stops at once,
            respecting vehicle capacity and delivery time windows — not just one driver,
            one route.
          </p>
        </div>
        <div className="stack-panel grid-overlay scroll-stack-card">
          <h2>Live, not static</h2>
          <p>
            Dispatchers see drivers move on the map in real time, and can drag a stop
            to a different driver mid-day without starting the whole plan over.
          </p>
        </div>
      </ScrollStack>

      {/* ---------- ANIMATED LIST: feature bullets ---------- */}
      <section className="features-list-section">
        <h2>Everything a dispatcher needs</h2>
        <AnimatedList items={FEATURE_BULLETS} />
      </section>

      {/* ---------- CAROUSEL: product screenshots ---------- */}
      <section className="carousel-section grid-overlay">
        <h2>See the dashboard</h2>
        <Carousel items={SCREENSHOTS} baseWidth={600} />
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="footer">
        <PolarisLogo />
        <p>&copy; 2026 Polaris. Built as a portfolio project.</p>
      </footer>

    </div>
  );
}
