import { motion } from 'framer-motion';
import LoginAnimation from '../components/LoginAnimation';
import LoginForm from '../components/LoginForm';
import PolarisLogo from '../components/PolarisLogo';
import '../styles/login.css';

/**
 * Login page – split-screen layout.
 *
 * Desktop : left (58%) animated panel + right (42%) form
 * Tablet  : left (40%) animated panel + right (60%) form
 * Mobile  : left hidden, form fills screen
 */
export default function Login() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="flex h-screen w-screen overflow-hidden bg-[#081726] md:bg-white"
    >
      {/* ── Left panel (animation & custom branding) ── */}
      <section
        className="hidden flex-col bg-[#081726] p-6 md:flex md:w-[40%] lg:w-[58%] h-full overflow-hidden"
        aria-hidden="true"
      >
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-full flex-col"
        >
          {/* Top bar: logo lockup + live indicator */}
          <div className="mb-5 flex items-center justify-between shrink-0 px-2">
            <div className="flex items-center gap-3">
              <PolarisLogo size={36} dark={true} loop={true} showWord={false} />
              <div className="flex flex-col">
                <span 
                  className="font-bold text-white text-base tracking-[0.04em] leading-none" 
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  POLARIS
                </span>
                <span 
                  className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Route Optimization Platform
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.span
                className="flex h-2 w-2 rounded-full bg-[#10B981]"
                animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                Live Dispatch
              </span>
            </div>
          </div>

          {/* Animation fills remaining height */}
          <div className="flex-1 min-h-0">
            <LoginAnimation />
          </div>
        </motion.div>
      </section>

      {/* ── Right panel (clean white form card) ── */}
      <section className="relative flex flex-col flex-1 items-center justify-center bg-white p-6 sm:p-10 md:w-[60%] lg:w-[42%] h-full overflow-y-auto">
        
        {/* LoginForm container (centered card) */}
        <div className="w-full max-w-[460px] my-auto">
          <LoginForm />
        </div>
      </section>
    </motion.main>
  );
}
