import React, { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

function CounterTicker({ target, duration = 1.8, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (value) => setCount(Math.round(value)),
    });
    return () => controls.stop();
  }, [target, duration]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function MetricCard({
  title,
  target,
  prefix = '',
  suffix = '',
  icon: Icon,
  floatClass = 'animate-float-1',
  iconColor = 'text-blue-400'
}) {
  return (
    <div className={`backdrop-blur-md bg-[#08111d]/50 border border-white/10 rounded-2xl p-4 flex flex-col justify-between h-24 shadow-xl select-none pointer-events-auto ${floatClass}`}>
      {/* Glow highlight */}
      <div className="absolute -right-2 -top-2 w-10 h-10 bg-[#00D4FF]/5 rounded-full blur-xl pointer-events-none" />
      
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
          {title}
        </span>
        <div className={`p-1.5 rounded-lg bg-white/5 border border-white/5 ${iconColor}`}>
          <Icon size={14} />
        </div>
      </div>
      
      <div className="mt-1">
        <h4 className="text-xl font-extrabold text-white tracking-tight leading-none">
          <CounterTicker target={target} prefix={prefix} suffix={suffix} />
        </h4>
        <span className="text-[8px] text-slate-500 font-bold block mt-1 uppercase tracking-wider">
          System Live Stream
        </span>
      </div>
    </div>
  );
}
