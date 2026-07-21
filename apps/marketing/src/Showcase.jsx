import { useEffect, useRef, useState } from "react";
import "./Showcase.css";

const SHOWCASES = [
  {
    num: "01",
    title: "Dispatcher Workspace",
    desc: "A comprehensive control center rendering live routes, active vehicle fleets, order queues, and real-time alerts on a unified map canvas.",
  },
  {
    num: "02",
    title: "AI Route Solver",
    desc: "Calculate complex Capacitated Vehicle Routing Problems (CVRPTW) incorporating time windows, vehicle availability, and service priorities in seconds.",
  },
  {
    num: "03",
    title: "Live Tracking & Execution",
    desc: "Instant synchronization between dispatch controllers and active drivers via custom WebSocket protocols, with auto-recalculation upon delays.",
  },
];

export function Showcase() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section 
      className={`ps-showcase scroll-reveal ${visible ? "is-visible" : ""}`} 
      id="dashboard" 
      ref={ref}
    >
      <div className="container">
        <div className="ps-showcase__header">
          <span className="ps-showcase__subtitle">The Dashboard</span>
          <h2 className="ps-showcase__title">Designed for High Performance</h2>
        </div>

        <div className="ps-showcase__grid">
          {SHOWCASES.map((item, index) => (
            <div 
              key={item.num} 
              className="ps-showcase__card"
              style={{
                "--delay": `${index * 0.15}s`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)"
              }}
            >
              <div className="ps-showcase__media-container">
                <div className="ps-showcase__placeholder-bg" />
                <div className="ps-showcase__media-tag">{item.num}</div>
                <div className="ps-showcase__media-desc">
                  <span>Interactive Workspace View</span>
                </div>
              </div>
              <div className="ps-showcase__info">
                <h4 className="ps-showcase__card-title">{item.title}</h4>
                <p className="ps-showcase__card-desc">{item.desc}</p>
                <a href="#about" className="ps-showcase__link">
                  Discover Workspace
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ps-icon">
                    <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="12 5 19 12 12 19" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
