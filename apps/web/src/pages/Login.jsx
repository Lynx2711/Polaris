import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from '../components/LoginForm';
import PolarisLogo from '../components/PolarisLogo';
import PlatformAdminAnimation from '../components/PlatformAdminAnimation';
import { useTheme } from '../context/ThemeContext';
import '../styles/login.css';

const COMPANY_SCENES = [
  {
    title: 'Optimize Every Request',
    subtitle: 'Place an Order',
    description: 'Customers create delivery requests through their company workspace. Polaris instantly records every order and prepares it for dispatch.',
    bgImage: "url('/delivery_scenes.png')",
    bgPos: '0% 0%', // Top-Left
    bgSize: '200% 200%',
    stat: { value: '500+', label: 'Orders Today' },
    stepLabel: 'Orders'
  },
  {
    title: 'Dispatch with Intelligence',
    subtitle: 'Intelligent Dispatch',
    description: 'AI-powered route optimization assigns deliveries to the right drivers, reducing travel distance and improving delivery efficiency.',
    bgImage: "url('/delivery_scenes.png')",
    bgPos: '100% 0%', // Top-Right
    bgSize: '200% 200%',
    stat: { value: '+35%', label: 'Mileage Saved' },
    stepLabel: 'Dispatch'
  },
  {
    title: 'Track in Real Time',
    subtitle: 'Track Every Delivery',
    description: 'Dispatchers and customers can monitor deliveries in real time while drivers update statuses directly from their portal.',
    bgImage: "url('/delivery_scenes.png')",
    bgPos: '100% 100%', // Bottom-Right
    bgSize: '200% 200%',
    stat: { value: '24', label: 'Active Drivers' },
    stepLabel: 'Tracking'
  },
  {
    title: 'Deliver with Confidence',
    subtitle: 'Delivery Complete',
    description: 'Successful deliveries are recorded automatically, providing analytics, performance insights, and complete delivery history.',
    bgImage: "url('/delivery_scenes.png')",
    bgPos: '0% 100%', // Bottom-Left
    bgSize: '200% 200%',
    stat: { value: '98%', label: 'Delivery Accuracy' },
    stepLabel: 'Analytics'
  }
];

const DRIVER_SCENES = [
  {
    title: "Receive Today's Assignments",
    subtitle: 'Receive Assignments',
    description: 'View all deliveries assigned for your shift instantly.',
    bgImage: "url('/driver_slide1.png')",
    bgPos: 'center',
    bgSize: 'contain',
    stat: { value: '12', label: 'Assigned Stops' },
    stepLabel: 'Assignments'
  },
  {
    title: 'Navigate Smarter',
    subtitle: 'Navigate Smarter',
    description: 'AI-powered routes help reduce travel time and fuel costs.',
    bgImage: "url('/driver_slide2.png')",
    bgPos: 'center',
    bgSize: 'contain',
    stat: { value: '96%', label: 'On-Time Deliveries' },
    stepLabel: 'Navigate'
  },
  {
    title: 'Track Every Delivery',
    subtitle: 'Track Every Delivery',
    description: 'Keep dispatchers updated with real-time status changes.',
    bgImage: "url('/driver_slide3.png')",
    bgPos: 'center',
    bgSize: 'contain',
    stat: { value: '08:30 AM', label: 'Shift Started' },
    stepLabel: 'Deliver'
  },
  {
    title: 'Complete with Confidence',
    subtitle: 'Complete with Confidence',
    description: 'Finish deliveries and sync trip history automatically.',
    bgImage: "url('/driver_slide4.png')",
    bgPos: 'center top',
    bgSize: '100% 90%',
    stat: { value: '4h 25m', label: 'Driving Time' },
    stepLabel: 'Complete'
  }
];

const PLATFORM_ADMIN_SCENES = [
  {
    title: 'Manage Every Organization',
    subtitle: 'Organizations',
    description: 'Create and oversee company workspaces, assign administrators, and maintain complete tenant isolation—all from a centralized platform.',
    bgImage: "url('/admin_slide1.jpg')",
    bgPos: 'center',
    bgSize: 'contain',
    stat: { value: '126', label: 'Organizations' },
    stepLabel: 'Organizations'
  },
  {
    title: 'Configure Workspaces',
    subtitle: 'Workspace Configuration',
    description: 'Set up new organizations, manage workspace settings, and provision secure access for company administrators with just a few clicks.',
    bgImage: "url('/admin_slide2.jpg')",
    bgPos: 'center',
    bgSize: 'contain',
    stat: { value: '42', label: 'Active Workspaces' },
    stepLabel: 'Workspaces'
  },
  {
    title: 'Monitor Platform Activity',
    subtitle: 'Platform Oversight',
    description: 'Track organization growth, platform usage, and administrative activity while maintaining the security and performance of Polaris.',
    bgImage: "url('/admin_slide3.jpg')",
    bgPos: 'center',
    bgSize: 'contain',
    stat: { value: '99.98%', label: 'Platform Uptime' },
    stepLabel: 'Uptime'
  }
];

export default function Login() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [currentScene, setCurrentScene] = useState(0);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [dayStr, setDayStr] = useState('');
  const [searchParams] = useSearchParams();

  const rawPortal = searchParams.get('portal') || 'company';
  const portal = rawPortal === 'developer' ? 'platform-admin' : rawPortal;
  const isDriver = portal === 'driver';
  const isPlatformAdmin = portal === 'platform-admin';
  
  const portalName = isDriver 
    ? 'Driver Workspace' 
    : (isPlatformAdmin ? 'Platform Admin' : 'Company Workspace');
    
  const loginTitle = isDriver 
    ? 'Start Your Shift' 
    : (isPlatformAdmin ? 'Platform Admin' : 'Welcome Back');
    
  const scenes = isDriver 
    ? DRIVER_SCENES 
    : (isPlatformAdmin ? PLATFORM_ADMIN_SCENES : COMPANY_SCENES);

  // Reset active scene index if portal type changes
  useEffect(() => {
    setCurrentScene(0);
  }, [portal]);

  // Update time and date
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setDateStr(now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }));
      setDayStr(now.toLocaleDateString('en-US', { weekday: 'long' }));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotate scenes every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % scenes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [scenes.length]);

  const scene = scenes[currentScene] || scenes[0];

  return (
    <div className={`login-page-container ${isDark ? 'dark-theme' : ''}`}>
      {/* Background Dot Grid Pattern */}
      <div className="login-bg-dots" />

      {/* ── Top Header Bar ── */}
      <header className="login-header">
        <div className="login-header__brand">
          <PolarisLogo size={32} dark={isDark} />
        </div>

        {/* Live Date/Time clock */}
        <div className="login-header__clock">
          <span className="clock-day">{dayStr}</span>
          <span className="clock-divider">|</span>
          <span className="clock-date">{dateStr}</span>
          <span className="clock-divider">|</span>
          <span className="clock-time">{timeStr}</span>
        </div>

        <button
          onClick={toggleTheme}
          className="login-header__toggle"
          aria-label="Toggle theme mode"
        >
          {isDark ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="theme-toggle-icon">
              <circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="theme-toggle-icon">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </header>

      {/* ── Main Layout ── */}
      <main className="login-main-grid">
        {/* Left column: Login form */}
        <section className="login-form-section">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="login-form-wrapper"
          >
            <LoginForm loginTitle={loginTitle} portalName={portalName} isDriver={isDriver} />
          </motion.div>
        </section>

        {/* Right column: Animated Product Showcase */}
        <section className="login-showcase-section">
          <div className="login-showcase-container">
            
            {/* Sliced Image Viewer (Statically rendered to prevent white flashes due to mix-blend opacity layering) */}
            <div className="showcase-image-frame">
              <div
                className={`showcase-illustration ${isDark ? 'inverted-illustration' : ''}`}
                style={{
                  backgroundImage: scene.bgImage,
                  backgroundPosition: scene.bgPos,
                  backgroundSize: scene.bgSize
                }}
              />

              {/* Floating Stripe-style KPI Card */}
              <div className="showcase-floating-card">
                <div className="floating-card__value">{scene.stat.value}</div>
                <div className="floating-card__label">{scene.stat.label}</div>
              </div>
            </div>

            {/* Rotating Text Details (Animated) */}
            <div className="showcase-details-frame">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${portal}-${currentScene}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="showcase-text-block"
                >
                  <span className="showcase-tagline">{scene.subtitle}</span>
                  <h3 className="showcase-heading">{scene.title}</h3>
                  <p className="showcase-desc">{scene.description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Steps Workflow Timeline or Dot Navigation */}
            {isPlatformAdmin ? (
              <div className="flex justify-center items-center gap-2.5 mt-4 mb-2 select-none">
                {scenes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentScene(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 border focus:outline-none cursor-pointer ${
                      index === currentScene
                        ? 'bg-neutral-900 border-neutral-900 dark:bg-white dark:border-white scale-110'
                        : 'bg-transparent border-neutral-400 dark:border-neutral-700 hover:border-neutral-950 dark:hover:border-neutral-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            ) : (
              <div className="showcase-timeline">
                {scenes.map((s, index) => (
                  <div key={index} className="timeline-step-container">
                    <button
                      onClick={() => setCurrentScene(index)}
                      className={`timeline-step-label ${index === currentScene ? 'is-active' : ''}`}
                    >
                      {s.stepLabel}
                    </button>
                    {index < scenes.length - 1 && (
                      <span className="timeline-connector" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quote details */}
            <div className="showcase-quote">
              {isDriver 
                ? '"Built for every mile. Trusted for every delivery."' 
                : (isPlatformAdmin 
                    ? '"Scale infrastructure. Control access. Power logistics."' 
                    : '"One platform. Every route. Every delivery."')}
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
