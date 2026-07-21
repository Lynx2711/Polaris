import { useEffect, useRef, useState } from "react";
import "./HowItWorks.css";

const STEPS = [
  { number: "01", name: "Order Ingest", detail: "Integrate incoming stops" },
  { number: "02", name: "Compute Matrix", detail: "Resolve OSRM coordinates" },
  { number: "03", name: "AI Solve", detail: "Process through OR-Tools" },
  { number: "04", name: "Dispatcher Check", detail: "Verify sequence bounds" },
  { number: "05", name: "Driver Assign", detail: "Deploy live driver shifts" },
  { number: "06", name: "Track Execution", detail: "Real-time socket updates" },
];

export function HowItWorks() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section 
      className={`ps-how scroll-reveal ${visible ? "is-visible" : ""}`} 
      id="how-it-works" 
      ref={ref}
    >
      <div className="container">
        <div className="ps-how__header">
          <span className="ps-how__subtitle">Process Flow</span>
          <h2 className="ps-how__title">Unified Logistics Steps</h2>
        </div>

        <div className="ps-how__grid">
          {STEPS.map((step, idx) => (
            <div
              key={step.number}
              className="ps-how__step"
              style={{
                "--delay": visible ? `${idx * 0.4}s` : "0s",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(-40px)"
              }}
            >
              <div className="ps-how__num">{step.number}</div>
              <div className="ps-how__divider" />
              <h4 className="ps-how__name">{step.name}</h4>
              <p className="ps-how__detail">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
