import { useEffect, useRef } from "react";
import { SplitText } from "./SplitText";
import "./Features.css";

const FEATURES = [
  {
    id: "optimize",
    tag: "Optimize",
    title: "AI-Powered Optimization Engine",
    desc: "Calculate routing scenarios utilizing high-performance algorithms. Consolidate driver shifts, time windows, and multi-stop requirements instantly, matching vehicle capacities to reduce unnecessary mileage.",
    bullets: [
      "Capacitated routing options",
      "Dynamic shift planning solver",
      "Punjab-wide road matrix (OSRM)",
    ],
    reverse: false,
    image: "/optimize-orders.png",
  },
  {
    id: "dispatch",
    tag: "Dispatch",
    title: "Sleek Controller Console",
    desc: "Oversee operational statuses, assign drivers, queue upcoming schedules, and direct fleets in real time. Maintain structured logistics sequences with zero desktop complexity.",
    bullets: [
      "Unified operational views",
      "One-click driver assigning",
      "Live task list statuses",
    ],
    reverse: true,
    image: "/dispatch-users.png",
  },
  {
    id: "track",
    tag: "Track",
    title: "Instant GPS Tracking",
    desc: "Monitor ongoing operations down to the exact block. Real-time updates push live driver logs, delivery schedules, and estimated arrival windows continuously.",
    bullets: [
      "Leaflet-powered maps",
      "Automatic ETA computation",
      "Low latency client sockets",
    ],
    reverse: false,
    image: "/track-map.png",
  },
  {
    id: "analyze",
    tag: "Analyze",
    title: "Strategic Fleet Insights",
    desc: "Export optimization metrics, monitor active driver hours, evaluate route efficiency levels, and uncover operational bottlenecks through automated analytics tracking.",
    bullets: [
      "Operational mileage reviews",
      "Performance scoring metrics",
      "Fulfillment reports",
    ],
    reverse: true,
    image: "/analyze-shift.png",
  },
];

export function Features() {
  const elementsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    elementsRef.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="ps-features" id="features">
      <div className="container">
        <div className="ps-features__header scroll-reveal">
          <span className="ps-features__subtitle">The Features</span>
          {/* SplitText character animation on heading */}
          <SplitText
            text="Operational Precision"
            tag="h2"
            className="ps-features__title"
            charDelay={0.03}
            threshold={0.3}
          />
        </div>

        <div className="ps-features__list">
          {FEATURES.map((item, idx) => (
            <div
              key={item.id}
              ref={(el) => (elementsRef.current[idx] = el)}
              className={`ps-feature-row ${item.reverse ? "ps-feature-row--reverse" : ""} scroll-reveal`}
            >
              <div className="ps-feature-row__media">
                <div className="ps-feature-row__frame" style={{ padding: 0, overflow: 'hidden' }}>
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div className="ps-feature-row__placeholder-label">
                      <span>Visualization Screen</span>
                    </div>
                  )}
                  <div className="ps-feature-row__tag" style={{ 
                    position: 'absolute', 
                    top: 16, 
                    left: 16,
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '4px 8px',
                    borderRadius: 4,
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {item.tag}
                  </div>
                </div>
              </div>

              <div className="ps-feature-row__text">
                <span className="ps-feature-row__bullet-label">{item.tag}</span>
                <h3 className="ps-feature-row__title">{item.title}</h3>
                <p className="ps-feature-row__desc">{item.desc}</p>
                <ul className="ps-feature-row__bullets">
                  {item.bullets.map((b) => (
                    <li key={b}>
                      <span className="ps-feature-row__bullet-dot" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
