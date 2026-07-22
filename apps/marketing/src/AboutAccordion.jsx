import { useState, useEffect, useRef } from "react";
import "./BigLinks.css";
import "./AboutAccordion.css";

export function AboutAccordion() {
  const [isOpen, setIsOpen] = useState(false);
  const [animate, setAnimate] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const openIfHash = () => {
      if (window.location.hash === "#about") {
        setIsOpen(true);
        setTimeout(() => {
          sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
    };
    openIfHash();
    window.addEventListener("hashchange", openIfHash);
    return () => window.removeEventListener("hashchange", openIfHash);
  }, []);

  // When opened, trigger animations; when closed, reset them
  useEffect(() => {
    if (isOpen) {
      // Small delay so panel starts opening first
      const t = setTimeout(() => setAnimate(true), 80);
      return () => clearTimeout(t);
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  return (
    <section className="ps-biglinks ps-biglinks--standalone" id="about" ref={sectionRef}>
      <div className="container">
        <div className={`biglink-row biglink-row--noborder-top ${isOpen ? "biglink-row--open" : ""}`}>
          <button
            className="biglink-row__btn"
            onClick={() => setIsOpen((p) => !p)}
            aria-expanded={isOpen}
          >
            <span className="biglink-row__label">About Polaris</span>
            <span className={`biglink-row__chevron ${isOpen ? "biglink-row__chevron--open" : ""}`}>
              ›
            </span>
          </button>

          <div
            className="biglink-row__panel"
            style={{ maxHeight: isOpen ? "800px" : "0px" }}
          >
            <div className="biglink-body about-new">
              {/* Big heading */}
              <h2 className={`about-new__heading ${animate ? "about-anim--in" : ""}`}
                  style={{ transitionDelay: "0ms" }}>
                Designed for Modern Logistics.
              </h2>

              {/* Subheading */}
              <p className={`about-new__sub ${animate ? "about-anim--in" : ""}`}
                 style={{ transitionDelay: "80ms" }}>
                Not built to manage deliveries. Built to simplify every decision behind them.
              </p>

              {/* Divider */}
              <div className={`about-new__divider ${animate ? "about-anim--in" : ""}`}
                   style={{ transitionDelay: "160ms" }} />

              {/* Two columns */}
              <div className="about-new__cols">
                <div className={`about-new__col ${animate ? "about-anim--in" : ""}`}
                     style={{ transitionDelay: "240ms" }}>
                  <span className="about-new__col-label">Our Purpose</span>
                  <p className="about-new__col-body">
                    Polaris was created to simplify the entire dispatch lifecycle.
                    Instead of relying on manual planning, the platform brings
                    optimization, dispatching, and real-time fleet visibility into
                    one seamless experience—helping logistics teams work faster,
                    make better decisions, and deliver with confidence.
                  </p>
                </div>

                <div className={`about-new__col ${animate ? "about-anim--in" : ""}`}
                     style={{ transitionDelay: "340ms" }}>
                  <span className="about-new__col-label">Our Principles</span>
                  <ul className="about-new__principles">
                    {["Simplicity over complexity", "Intelligence over manual work", "Visibility over uncertainty", "Efficiency over wasted miles"].map((p, i) => (
                      <li key={i}
                          className={animate ? "about-anim--in" : ""}
                          style={{ transitionDelay: `${400 + i * 70}ms` }}>
                        <span className="about-new__check">✓</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom divider */}
              <div className={`about-new__divider ${animate ? "about-anim--in" : ""}`}
                   style={{ transitionDelay: "640ms" }} />

              {/* Quote */}
              <blockquote className={`about-new__quote ${animate ? "about-anim--in" : ""}`}
                          style={{ transitionDelay: "720ms" }}>
                "Every optimized route begins with a better decision."
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
