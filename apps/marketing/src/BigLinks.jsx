import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogoLoop } from "./LogoLoop";
import { 
  SiReact, SiNodedotjs, SiFastapi, SiPostgresql, SiDocker, 
  SiRedis, SiNginx, SiPython, SiLeaflet, SiOpenstreetmap 
} from "react-icons/si";
import { TbPlugConnected } from "react-icons/tb";
import { FaRoute } from "react-icons/fa";
import "./BigLinks.css";

const TECH_ICONS = [
  { name: "React", icon: <SiReact /> },
  { name: "Node.js", icon: <SiNodedotjs /> },
  { name: "FastAPI", icon: <SiFastapi /> },
  { name: "PostgreSQL", icon: <SiPostgresql /> },
  { name: "Google OR-Tools", icon: <FaRoute /> },
  { name: "OSRM", icon: <SiOpenstreetmap /> },
  { name: "Leaflet", icon: <SiLeaflet /> },
  { name: "Docker", icon: <SiDocker /> },
  { name: "WebSockets", icon: <TbPlugConnected /> },
  { name: "Redis", icon: <SiRedis /> },
  { name: "Nginx", icon: <SiNginx /> },
  { name: "Python", icon: <SiPython /> },
];

export function BigLinks() {
  const [openId, setOpenId] = useState(null);
  const navigate = useNavigate();

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <section className="ps-biglinks">
      <div className="container">

        {/* ── "Get in touch" → navigates to /contact ── */}
        <div className="biglink-row">
          <button
            className="biglink-row__btn"
            onClick={() => navigate("/contact")}
          >
            <span className="biglink-row__label">Get in touch</span>
            <span className="biglink-row__chevron">›</span>
          </button>
        </div>

        {/* ── "Tech Stack" → expands accordion ── */}
        <div className={`biglink-row ${openId === "tech" ? "biglink-row--open" : ""}`}>
          <button
            className="biglink-row__btn"
            onClick={() => toggle("tech")}
            aria-expanded={openId === "tech"}
          >
            <span className="biglink-row__label">Tech Stack</span>
            <span className={`biglink-row__chevron ${openId === "tech" ? "biglink-row__chevron--open" : ""}`}>
              ›
            </span>
          </button>

          <div
            className="biglink-row__panel"
            style={{ maxHeight: openId === "tech" ? "500px" : "0px" }}
          >
            <div className="biglink-body biglink-body--tech">
              <p className="biglink-tech__intro">
                Polaris is built on a modern, production-grade open-source stack
                optimised for real-time fleet operations at scale.
              </p>
              <div className="biglink-tech__carousel" style={{ overflow: "hidden", padding: "64px 0 32px 0", width: "100%", color: "var(--color-text-main, currentColor)" }}>
                <LogoLoop 
                  logos={TECH_ICONS.map((t, idx) => ({ node: t.icon, name: t.name, key: idx }))}
                  speed={80}
                  direction="left"
                  logoHeight={80}
                  gap={120}
                  pauseOnHover={true}
                  renderItem={(item, key) => (
                    <div className="tech-logo-container" key={key}>
                      {item.node}
                      <div className="dock-label">{item.name}</div>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
