import React from 'react';
import { motion } from 'framer-motion';

export default function CityNode({ cx, cy, name, delay = 0 }) {
  return (
    <g>
      {/* Expanding outer pulse */}
      <motion.circle
        cx={cx}
        cy={cy}
        r="14"
        fill="#00D4FF"
        opacity="0.12"
        initial={{ scale: 0.6, opacity: 0.4 }}
        animate={{ scale: [0.6, 2, 0.6], opacity: [0.05, 0.35, 0.05] }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay,
        }}
      />
      {/* Secondary glow pulse */}
      <motion.circle
        cx={cx}
        cy={cy}
        r="8"
        fill="#2563EB"
        opacity="0.2"
        initial={{ scale: 0.8, opacity: 0.5 }}
        animate={{ scale: [0.8, 1.5, 0.8], opacity: [0.1, 0.4, 0.1] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: delay + 0.6,
        }}
      />
      {/* Node center hub */}
      <circle
        cx={cx}
        cy={cy}
        r="4"
        fill="#08111d"
        stroke="#00D4FF"
        strokeWidth="1.5"
        style={{ filter: 'drop-shadow(0 0 3px rgba(0, 212, 255, 0.8))' }}
      />
      <circle cx={cx} cy={cy} r="1.5" fill="#ffffff" />

      {/* City name label */}
      <text
        x={cx}
        y={cy - 10}
        fill="#64748B"
        fontSize="7.5"
        fontWeight="700"
        textAnchor="middle"
        className="font-mono select-none tracking-widest uppercase opacity-85"
      >
        {name}
      </text>
    </g>
  );
}
