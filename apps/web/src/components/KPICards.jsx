import { useEffect, useRef, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { Package, Truck, Clock, Gauge } from 'lucide-react';

/**
 * Custom Counter Ticker for animated numbers
 */
function CounterTicker({ target, duration = 1.6, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (value) => setCount(Math.round(value)),
    });
    return () => controls.stop();
  }, [target, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const KPIS = [
  { label: 'Orders Today', value: 1248, suffix: '',    prefix: '',   icon: Package, color: '#2563EB', glowColor: 'rgba(37, 99, 235, 0.15)', floatClass: 'float-a' },
  { label: 'Drivers Online', value: 186,  suffix: '',    prefix: '',   icon: Truck,   color: '#00D4FF', glowColor: 'rgba(0, 212, 255, 0.15)',  floatClass: 'float-b' },
  { label: 'Average ETA',    value: 14,   suffix: 'm',   prefix: '',   icon: Clock,   color: '#10B981', glowColor: 'rgba(16, 185, 129, 0.15)', floatClass: 'float-c' },
  { label: 'Fuel Saved',     value: 24,   suffix: '%',   prefix: '+',  icon: Gauge,   color: '#F59E0B', glowColor: 'rgba(245, 158, 11, 0.15)', floatClass: 'float-d' },
];

export default function KPICards() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 w-full pointer-events-auto">
      {KPIS.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6, scale: 1.02, borderColor: 'rgba(255, 255, 255, 0.2)' }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              delay: 0.3 + index * 0.1,
            }}
            className={`${kpi.floatClass} relative overflow-hidden backdrop-blur-md bg-[#081726]/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between h-24 shadow-xl select-none group`}
            style={{
              boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05)`,
            }}
          >
            {/* Soft background glow */}
            <div
              className="absolute -right-4 -top-4 w-12 h-12 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none"
              style={{ backgroundColor: kpi.color }}
            />

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                {kpi.label}
              </span>
              <div
                className="p-1.5 rounded-lg bg-white/5 border border-white/5 transition-colors duration-300 group-hover:bg-white/10"
                style={{ color: kpi.color }}
              >
                <Icon size={14} />
              </div>
            </div>

            <div className="mt-2">
              <h4 className="text-xl font-extrabold text-white tracking-tight leading-none">
                <CounterTicker target={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} />
              </h4>
              <span className="text-[8px] text-slate-500 font-bold block mt-1.5 uppercase tracking-wider">
                System Live Stream
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
