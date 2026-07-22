import { useEffect, useRef, useState } from "react";
import "./Results.css";

const STATS = [
  { val: 500, label: "Orders / Day", desc: "Managed dynamically across drivers" },
  { val: 98, suffix: "%", label: "Accuracy Rate", desc: "Guaranteed calculation window bounds" },
  { val: 35, suffix: "%", label: "Mileage Saved", desc: "Average reduction in manual trip planning" },
  { val: 24, label: "Live Connections", desc: "Constant" },
];

function AnimatedNumber({ target, suffix = "", active }) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    // Cancel any running animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const duration = 2000;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, target]);

  return (
    <span>
      {val}
      {suffix}
    </span>
  );
}

export function Results() {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      className={`ps-results scroll-reveal ${active ? "is-visible" : ""}`}
      id="results"
      ref={ref}
    >
      <div className="container">
        <div className="ps-results__header">
          <span className="ps-results__subtitle">Metrics</span>
          <h2 className="ps-results__title">System Performance</h2>
        </div>

        <div className="ps-results__grid">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="ps-results__card"
              style={{
                "--delay": `${i * 0.12}s`,
                opacity: active ? 1 : 0,
                transform: active ? "translateY(0)" : "translateY(24px)",
              }}
            >
              <div className="ps-results__value">
                <AnimatedNumber
                  target={stat.val}
                  suffix={stat.suffix || ""}
                  active={active}
                />
              </div>
              <div className="ps-results__divider" />
              <h4 className="ps-results__label">{stat.label}</h4>
              <p className="ps-results__desc">{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
