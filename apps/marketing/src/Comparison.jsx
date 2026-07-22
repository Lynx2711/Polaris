import { useEffect, useRef, useState } from "react";
import "./Comparison.css";

const WITHOUT = [
  "Manual spreadsheet route plotting",
  "Higher vehicle emissions and fuel waste",
  "Zero active driver GPS tracking",
  "Delays in time window schedules",
  "Sub-optimal fleet utilization",
];

const WITH = [
  "Algorithmic optimization in seconds",
  "Up to 35% reduction in mileage",
  "Live real-time driver coordinates",
  "Strict delivery window enforcement",
  "Full fleet capacity utilization",
];

export function Comparison() {
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
      className={`ps-compare scroll-reveal ${visible ? "is-visible" : ""}`}
      ref={ref}
    >
      <div className="container">
        <div className="ps-compare__header">
          <span className="ps-compare__subtitle">Comparison</span>
          <h2 className="ps-compare__title">Traditional vs. Polaris</h2>
        </div>

        <div className="ps-compare__grid">
          {/* Without Polaris */}
          <div
            className="ps-compare__card ps-compare__card--without"
            style={{
              "--delay": "0s",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(24px)",
            }}
          >
            <h4 className="ps-compare__card-title">Traditional Logistics</h4>
            <div className="ps-compare__divider" />
            <ul className="ps-compare__list">
              {WITHOUT.map((item) => (
                <li key={item} className="ps-compare__item">
                  <span className="ps-compare__item-status ps-compare__item-status--no">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* With Polaris */}
          <div
            className="ps-compare__card ps-compare__card--with"
            style={{
              "--delay": "0.15s",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(24px)",
            }}
          >
            <h4 className="ps-compare__card-title">Polaris Workspace</h4>
            <div className="ps-compare__divider" />
            <ul className="ps-compare__list">
              {WITH.map((item) => (
                <li key={item} className="ps-compare__item">
                  <span className="ps-compare__item-status ps-compare__item-status--yes">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
