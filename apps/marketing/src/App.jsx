import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import './index.css';

/* Landing page sections */
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { AboutAccordion } from './AboutAccordion';
import { Features } from './Features';
import { HowItWorks } from './HowItWorks';
import { Results } from './Results';
import { BigLinks } from './BigLinks';
import { Footer } from './Footer';
import { PolarisLoader } from './PolarisLoader';

/* Contact route */
import { Contact } from './Contact';

/* Demo route */
import { ExploreDemo } from './ExploreDemo';



// Module-level flag — false on real page load/refresh (JS reloads from scratch),
// but stays true during SPA navigation (module stays in memory).
// This means: loader shows on load/refresh, but NOT when navigating back from /contact.
let loaderShown = false;

/* Landing page — slim & focused */
function Landing() {
  // If the loader already ran this session, skip it and go straight to ready.
  const [showLoader, setShowLoader] = useState(!loaderShown);
  const [heroReady, setHeroReady] = useState(loaderShown);

  // Called by PolarisLoader once its exit-fade completes.
  const handleLoaderDone = () => {
    loaderShown = true;   // prevent loader on any future in-session visit to "/"
    setShowLoader(false);
    setHeroReady(true);
  };
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    const targets = document.querySelectorAll('.scroll-reveal');
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []); // ← [] is critical: run once only

  return (
    <>
      {/* Loading overlay — only on "/", removed from DOM once animation ends */}
      {showLoader && (
        <PolarisLoader onDone={handleLoaderDone} />
      )}

      <Navbar />
      <main>
        {/* 1. Hero — full viewport, Aethon scroll effect */}
        <Hero ready={heroReady} />

        {/* 2. About Accordion — standalone before Features */}
        <AboutAccordion />

        {/* 3. Features — left/right directional slide animations (Operational Precision) */}
        <Features />

        {/* 4. How It Works — step sequence */}
        <HowItWorks />

        {/* 5. Results — numbers counting animation */}
        <Results />

        {/* 6. Polestar big-link accordion section + navigation to Contact */}
        <BigLinks />
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/demo" element={<ExploreDemo />} />
    </Routes>
  );
}

export default App;
