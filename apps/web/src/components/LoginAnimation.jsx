import { motion } from 'framer-motion';
import WorldMap from './WorldMap';
import FloatingParticles from './FloatingParticles';
import KPICards from './KPICards';

/**
 * LoginAnimation – the left-panel logistics visualization.
 * Matches the required design specifications.
 */
export default function LoginAnimation() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[32px] border border-white/10 bg-[#081726] flex flex-col justify-between p-6">
      
      {/* Soft blue radial glow overlays */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#2563EB]/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#00D4FF]/12 blur-[140px]" />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-[#10B981]/8 blur-[100px]" />
      </div>

      {/* Slowly moving thin grid overlay */}
      <motion.div
        className="absolute inset-0 opacity-[0.25] pointer-events-none z-0 grid-mask"
        animate={{
          backgroundPosition: ['0px 0px', '48px 48px'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M 48 0 L 0 0 0 48' fill='none' stroke='%2300D4FF' stroke-width='0.6' stroke-opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating glowing particles */}
      <div className="absolute inset-0 z-0">
        <FloatingParticles />
      </div>

      {/* Centered Logistics visualization (World Map) */}
      <div className="relative z-10 flex-1 flex items-center justify-center min-h-0 w-full">
        <div className="w-full max-w-[580px] relative">
          <WorldMap />

          {/* Center Status Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 px-4">
            <h2 className="text-[15px] sm:text-[18px] md:text-[20px] lg:text-[23px] font-black text-center text-white tracking-[0.18em] leading-snug font-sans drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              CONNECTING DELIVERIES WORLDWIDE.
            </h2>
            <span 
              className="mt-2 text-[9px] sm:text-[10px] md:text-[11px] font-extrabold tracking-[0.45em] text-[#00D4FF] uppercase drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]"
            >
              OPTIMIZING ROUTES
            </span>
          </div>
        </div>
      </div>

      {/* Bottom KPI Cards */}
      <div className="relative z-10 shrink-0 w-full mt-4">
        <KPICards />
      </div>
    </div>
  );
}
