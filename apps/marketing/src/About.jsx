import { useEffect, useRef } from "react";
import "./About.css";

export function About() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    }, { threshold: 0.2 });

    const reveals = sectionRef.current.querySelectorAll(".reveal");
    reveals.forEach(el => observer.observe(el));

    const counters = sectionRef.current.querySelectorAll(".counter");
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          if (counter.dataset.animated) return;
          counter.dataset.animated = "true";
          const target = +counter.dataset.target;
          let value = 0;
          const speed = 25;
          const update = () => {
            value += Math.ceil(target / 60);
            if (value >= target) {
              value = target;
            }
            counter.innerHTML = value + "<span>" + (counter.dataset.suffix || "%") + "</span>";
            if (value < target) {
              setTimeout(update, speed);
            }
          };
          update();
          counterObserver.unobserve(counter);
        }
      });
    });

    counters.forEach(c => counterObserver.observe(c));

    // Cleanup
    return () => {
      observer.disconnect();
      counterObserver.disconnect();
    };
  }, []);

  return (
    <section className="about" id="about" ref={sectionRef}>
      <h1 className="heading reveal">About Polaris</h1>
      <p className="sub reveal">
        Polaris transforms complex logistics into intelligent automated dispatching.
        Instead of manually assigning routes and drivers, dispatchers simply upload
        orders while Polaris handles optimization, assignments and live tracking.
      </p>

      <div className="grid">
        <div className="left">
          <div className="card reveal">
            <div className="no">01</div>
            <h2>The Challenge</h2>
            <p>
              Managing hundreds of deliveries across multiple drivers is difficult.
              Traffic, vehicle capacity, delivery deadlines and changing orders make
              manual planning slow and inefficient. Dispatchers often spend hours
              creating routes that may still waste fuel and time.
            </p>
          </div>

          <div className="card reveal">
            <div className="no">02</div>
            <h2>The Solution</h2>
            <p>
              Polaris automatically ingests orders, evaluates constraints,
              optimizes delivery routes, assigns drivers and continuously
              updates schedules whenever new deliveries arrive.
            </p>
          </div>

          <div className="card reveal">
            <div className="no">03</div>
            <h2>The Impact</h2>
            <div className="stats">
              <div className="stat">
                <h1 className="counter" data-target="35" data-suffix="%">0</h1>
                <p>Less Mileage</p>
              </div>
              <div className="stat">
                <h1 className="counter" data-target="90" data-suffix="%">0</h1>
                <p>Planning Time Saved</p>
              </div>
              <div className="stat">
                <h1 className="counter" data-target="100" data-suffix="%">0</h1>
                <p>Live Visibility</p>
              </div>
            </div>
          </div>
        </div>

        <div className="timeline">
          <div className="step reveal">
            <div className="dot"></div>
            <h3>Order Upload</h3>
            <p>Orders are imported from the business dashboard.</p>
          </div>
          <div className="step reveal">
            <div className="dot"></div>
            <h3>AI Optimization</h3>
            <p>Vehicle capacity, delivery windows and traffic are analyzed.</p>
          </div>
          <div className="step reveal">
            <div className="dot"></div>
            <h3>Driver Assignment</h3>
            <p>Optimized routes are assigned instantly to available drivers.</p>
          </div>
          <div className="step reveal">
            <div className="dot"></div>
            <h3>Live Tracking</h3>
            <p>Dispatchers monitor deliveries and receive real-time updates.</p>
          </div>
          <div className="step reveal">
            <div className="dot"></div>
            <h3>Completed Delivery</h3>
            <p>Analytics are generated for future route improvements.</p>
          </div>
        </div>
      </div>

      <div className="footer reveal">
        <div>
          <h2>Smarter Dispatch.<br/>Faster Deliveries.</h2>
        </div>
        <button onClick={() => window.location.href = "http://localhost:5173/"}>
          Explore Dashboard
        </button>
      </div>
    </section>
  );
}
