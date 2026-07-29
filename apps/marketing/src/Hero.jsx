import { useEffect, useState } from "react";
import "./Hero.css";

function useLineStyle(scrollY, isLoaded, loadDelay, scrollStart, scrollEnd) {
  const scrollProgress =
    scrollY <= scrollStart ? 0
    : scrollY >= scrollEnd ? 1
    : (scrollY - scrollStart) / (scrollEnd - scrollStart);

  const scrollHappened = scrollY > 4;

  if (!isLoaded) {
    return {
      opacity: 0,
      transform: "translateY(28px)",
      transitionProperty: "opacity, transform",
      transitionDuration: "1.6s",
      transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      transitionDelay: `${loadDelay}s`,
    };
  }

  if (!scrollHappened) {
    return {
      opacity: 1,
      transform: "translateX(0px)",
      transitionProperty: "opacity, transform",
      transitionDuration: "1.6s",
      transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      transitionDelay: `${loadDelay}s`,
    };
  }

  const x = scrollProgress * 500;
  const op = Math.max(0, 1 - scrollProgress * 1.3);
  return {
    opacity: op,
    transform: `translateX(${x}px)`,
    transitionProperty: "none",
  };
}

export function Hero({ ready = false }) {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Don't start entrance animations until the loader is gone
    if (!ready) return;

    const timer = setTimeout(() => setIsLoaded(true), 80);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [ready]);

  const line1Style = useLineStyle(scrollY, isLoaded, 0.05, 10, 200);
  const line2Style = useLineStyle(scrollY, isLoaded, 0.22, 75, 275);
  const line3Style = useLineStyle(scrollY, isLoaded, 0.38, 140, 340);

  const bodyProgress =
    scrollY <= 100 ? 0
    : scrollY >= 320 ? 1
    : (scrollY - 100) / 220;

  const bodyStyle = {
    opacity: isLoaded ? Math.max(0, 1 - bodyProgress * 1.2) : 0,
    transitionProperty: "opacity",
    transitionDuration: !isLoaded ? "1.6s" : bodyProgress > 0 ? "0ms" : "1.6s",
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    transitionDelay: isLoaded ? "0s" : "0.58s",
  };

  return (
    <section className="ps-hero" id="hero">
      {/* Decorative grid + pin panel — right side, behind content */}
      <div className={`rd-grid${ready ? " rd-grid--ready" : ""}`} aria-hidden="true">
        {/* Two separate layers inside the radial-fade mask wrapper */}
        <div className="rd-grid-mask">
          <div className="rd-h-lines" />
          <div className="rd-v-lines" />
        </div>
        <div className="rd-blur-corner" />

        {/* Pin cluster centered within the visible grid panel */}
        <div className="rd-pin rd-pin-1" style={{ left: "55%", top: "36%" }}>
          <svg className="rd-pin-icon" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" overflow="visible">
            <ellipse className="rd-pin-shadow" cx="17" cy="40" rx="13" ry="4" style={{ transformOrigin: "17px 40px" }} />
            <path className="rd-pin-body" d="M17,1 C25.8,1 33,8 33,16.3 C33,27.5 17,43 17,43 C17,43 1,27.5 1,16.3 C1,8 8.2,1 17,1 Z" />
            <circle className="rd-pin-hole" cx="17" cy="16.3" r="6.4" />
          </svg>
        </div>

        <div className="rd-pin rd-pin-2" style={{ left: "41%", top: "52%", width: "22px", height: "29px" }}>
          <svg className="rd-pin-icon" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" overflow="visible">
            <ellipse className="rd-pin-shadow" cx="17" cy="40" rx="13" ry="4" style={{ transformOrigin: "17px 40px" }} />
            <path className="rd-pin-body" d="M17,1 C25.8,1 33,8 33,16.3 C33,27.5 17,43 17,43 C17,43 1,27.5 1,16.3 C1,8 8.2,1 17,1 Z" />
            <circle className="rd-pin-hole" cx="17" cy="16.3" r="6.4" />
          </svg>
        </div>

        <div className="rd-pin rd-pin-3" style={{ left: "67%", top: "22%", width: "20px", height: "26px" }}>
          <svg className="rd-pin-icon" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" overflow="visible">
            <ellipse className="rd-pin-shadow" cx="17" cy="40" rx="13" ry="4" style={{ transformOrigin: "17px 40px" }} />
            <path className="rd-pin-body" d="M17,1 C25.8,1 33,8 33,16.3 C33,27.5 17,43 17,43 C17,43 1,27.5 1,16.3 C1,8 8.2,1 17,1 Z" />
            <circle className="rd-pin-hole" cx="17" cy="16.3" r="6.4" />
          </svg>
        </div>
      </div>

      <div className="ps-hero__container container">
        <div className="ps-hero__content">
          <h1 className="ps-hero__title">
            <span className="ps-hero__line" style={line1Style}>
              Optimize Every Route.
            </span>
            <span className="ps-hero__line" style={line2Style}>
              Dispatch Every Driver.
            </span>
            <span className="ps-hero__line" style={line3Style}>
              Deliver On Time.
            </span>
          </h1>

          <div style={bodyStyle} className="ps-hero__body">
            <p className="ps-hero__description">
              A modern AI-powered platform that simplifies fleet management through
              intelligent route optimization, live dispatching, and real-time tracking.
            </p>
            <div className="ps-hero__actions">
              <a href="http://localhost:5173/login" className="ps-btn ps-btn--primary">
                Launch Dashboard
              </a>
              <a href="#features" className="ps-btn ps-btn--secondary">
                Explore Features
              </a>
            </div>
          </div>
        </div>

        {/* Scroll hint at bottom */}
        <div className={`ps-hero__scroll-hint ${isLoaded ? "ps-hero__scroll-hint--visible" : ""}`}>
          <div className="ps-hero__scroll-line" />
          <span className="ps-hero__scroll-label">Scroll</span>
        </div>
      </div>
    </section>
  );
}
