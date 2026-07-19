import React from 'react';
import { motion } from 'framer-motion';

export default function DeliveryRoute({ d, delay = 0 }) {
  return (
    <g>
      {/* Glow path overlay underneath */}
      <motion.path
        d={d}
        stroke="#00D4FF"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.08"
        style={{ filter: 'drop-shadow(0 0 4px rgba(0, 212, 255, 0.7))' }}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.08, 0.08, 0] }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
          delay,
        }}
      />
      
      {/* Thin solid animated line */}
      <motion.path
        d={d}
        stroke="url(#active-route-grad)"
        strokeWidth="1.25"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.5, 0.5, 0] }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
          delay,
        }}
      />
    </g>
  );
}
