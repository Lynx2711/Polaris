import { useEffect, useRef, useState } from "react";
import "./TechStrip.css";

const TECHS = [
  { name: "React", key: "react" },
  { name: "Node.js", key: "node" },
  { name: "FastAPI", key: "fastapi" },
  { name: "PostgreSQL", key: "postgres" },
  { name: "Docker", key: "docker" },
  { name: "Leaflet", key: "leaflet" },
  { name: "OR-Tools", key: "ortools" },
  { name: "OSRM", key: "osrm" },
  { name: "WebSockets", key: "websockets" },
];

export function TechStrip() {
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
      className={`ps-tech scroll-reveal ${visible ? "is-visible" : ""}`}
      id="tech"
      ref={ref}
    >
      <div className="container">
        <div className="ps-tech__inner">
          <div className="ps-tech__header">
            <span className="ps-tech__subtitle">Technical Excellence</span>
            <h3 className="ps-tech__title">Production Stack</h3>
          </div>
          <div className="ps-tech__grid">
            {TECHS.map((tech, i) => (
              <div
                key={tech.key}
                className="ps-tech__item"
                style={{
                  "--delay": `${i * 0.06}s`,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(16px)",
                }}
              >
                <span className="ps-tech__dot" />
                <span className="ps-tech__name">{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
