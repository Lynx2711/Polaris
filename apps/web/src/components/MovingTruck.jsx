import React from 'react';

export default function MovingTruck({ d, dur = 8, delay = 0 }) {
  return (
    <g>
      {/* Light aura glow */}
      <circle cx="0" cy="0" r="8" fill="#00D4FF" opacity="0.35" filter="url(#route-glow-filter)" />
      
      {/* Sleek Delivery Truck Vector Shape */}
      <g transform="translate(-6.5, -4.5) scale(0.7)">
        {/* Cargo Box */}
        <rect x="0.5" y="2" width="10" height="5.5" rx="0.5" fill="#00D4FF" />
        {/* Cab */}
        <path d="M10.5 2.5 C10.5 2.5 12 3 13 4.25 L13 7.5 L10.5 7.5 Z" fill="#ffffff" />
        {/* Cab window */}
        <path d="M10.5 3.5 L11.8 4 L11.8 5.5 L10.5 5.5 Z" fill="#08111d" opacity="0.8" />
        {/* Wheels */}
        <circle cx="3" cy="8.2" r="1.3" fill="#08111d" />
        <circle cx="9.5" cy="8.2" r="1.3" fill="#08111d" />
      </g>
      
      <animateMotion
        path={d}
        dur={`${dur}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
        rotate="auto"
      />
    </g>
  );
}
