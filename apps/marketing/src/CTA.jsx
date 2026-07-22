import { useEffect, useRef, useState } from "react";
import "./CTA.css";

export function CTA() {
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
      className={`ps-cta scroll-reveal ${visible ? "is-visible" : ""}`}
      id="newsletter"
      ref={ref}
    >
      <div className="container">
        <div className="ps-cta__inner">
          <div className="ps-cta__header">
            <span className="ps-cta__subtitle">Newsletter</span>
            <h2 className="ps-cta__title">Ready to Optimize Your Fleet?</h2>
            <p className="ps-cta__desc">
              Subscribe to get details on our latest algorithmic updates,
              microservice features, and deployment guides.
            </p>
          </div>

          <div className="ps-cta__form">
            <div className="ps-cta__field">
              <input
                type="email"
                placeholder="Enter your email address"
                className="ps-cta__input"
              />
              <button className="ps-cta__submit-btn">
                Subscribe
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="ps-icon"
                >
                  <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="12 5 19 12 12 19" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="ps-cta__disclaimer">
              By subscribing, you agree to our privacy policy and operational terms.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
