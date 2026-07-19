import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CityNode from './CityNode';
import DeliveryRoute from './DeliveryRoute';
import MovingTruck from './MovingTruck';
import { Box, CheckCircle } from 'lucide-react';

const cities = [
  { id: 'la', name: 'Los Angeles', cx: 80, cy: 120, delay: 0.2 },
  { id: 'ny', name: 'New York', cx: 140, cy: 110, delay: 0.8 },
  { id: 'lon', name: 'London', cx: 230, cy: 85, delay: 0.4 },
  { id: 'par', name: 'Paris', cx: 250, cy: 95, delay: 1.2 },
  { id: 'dxb', name: 'Dubai', cx: 315, cy: 145, delay: 0.6 },
  { id: 'bom', name: 'Mumbai', cx: 350, cy: 170, delay: 1.0 },
  { id: 'sin', name: 'Singapore', cx: 400, cy: 210, delay: 0.3 },
  { id: 'tyo', name: 'Tokyo', cx: 430, cy: 130, delay: 0.7 },
  { id: 'syd', name: 'Sydney', cx: 450, cy: 260, delay: 0.5 },
];

const routes = [
  { id: 'la-tyo', d: 'M 80 120 Q 255 45, 430 130', delay: 0 },
  { id: 'lon-dxb', d: 'M 230 85 Q 275 110, 315 145', delay: 1.5 },
  { id: 'dxb-bom', d: 'M 315 145 Q 330 155, 350 170', delay: 3.2 },
  { id: 'sin-syd', d: 'M 400 210 Q 425 230, 450 260', delay: 0.8 },
  { id: 'ny-lon', d: 'M 140 110 Q 185 90, 230 85', delay: 2.1 },
  { id: 'tyo-sin', d: 'M 430 130 Q 415 170, 400 210', delay: 4.0 },
];

const eventTypes = [
  { text: '✓ DELIVERED', type: 'delivered', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' },
  { text: 'OPTIMIZED ROUTE', type: 'optimized', color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10' },
];

export default function WorldMap() {
  const [events, setEvents] = useState([]);

  // Loop package pops and floating cards
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick a random city to spawn near
      const targetCity = cities[Math.floor(Math.random() * cities.length)];
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      // Add dynamic popup offset coordinates
      const eventX = targetCity.cx + (Math.random() - 0.5) * 40;
      const eventY = targetCity.cy + (Math.random() - 0.5) * 30 - 15;

      const newEvent = {
        id: Date.now(),
        x: eventX,
        y: eventY,
        text: randomEvent.text,
        type: randomEvent.type,
        color: randomEvent.color,
      };

      setEvents((prev) => [...prev.slice(-3), newEvent]); // Keep last 4 events active
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full aspect-[5/3.2] flex items-center justify-center pointer-events-none">
      {/* SVG Canvas wrapper */}
      <svg className="w-full h-full" viewBox="0 0 500 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="active-route-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#00D4FF" />
          </linearGradient>
          
          <filter id="route-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Continents glow filter */}
          <filter id="continent-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Minimal Stylized World Map Continents - Ultra Low Opacity Glow */}
        <g opacity="0.04" stroke="#00D4FF" strokeWidth="1" fill="#0c1d33" filter="url(#continent-glow)">
          {/* North America */}
          <path d="M 40 60 Q 90 40, 150 70 T 140 130 Q 100 120, 70 140 Z" />
          {/* South America */}
          <path d="M 110 150 Q 150 160, 140 190 T 110 270 Q 90 230, 100 170 Z" />
          {/* Eurasia */}
          <path d="M 190 50 Q 310 30, 430 50 T 420 140 Q 340 155, 250 130 T 190 80 Z" />
          {/* Africa */}
          <path d="M 220 140 Q 270 130, 300 160 T 270 250 Q 230 220, 230 170 Z" />
          {/* Australia */}
          <path d="M 390 220 Q 440 220, 450 250 T 410 275 Q 380 255, 380 230 Z" />
        </g>

        {/* Dynamic Delivery Routes */}
        {routes.map((route) => (
          <DeliveryRoute key={route.id} d={route.d} delay={route.delay} />
        ))}

        {/* Moving Trucks (Travelling at different speeds and delays) */}
        <MovingTruck d={routes[0].d} dur={8.5} delay={0} />
        <MovingTruck d={routes[1].d} dur={5.5} delay={1.5} />
        <MovingTruck d={routes[2].d} dur={4.5} delay={3.0} />
        <MovingTruck d={routes[3].d} dur={7.0} delay={0.5} />
        <MovingTruck d={routes[4].d} dur={6.0} delay={2.0} />
        <MovingTruck d={routes[5].d} dur={5.2} delay={3.8} />

        {/* City Hub Nodes */}
        {cities.map((city) => (
          <CityNode key={city.id} cx={city.cx} cy={city.cy} name={city.name} delay={city.delay} />
        ))}
      </svg>

      {/* Floating Action Event Notifications (HTML Overlay) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <AnimatePresence>
          {events.map((ev) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -15 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ left: `${ev.x}px`, top: `${ev.y}px` }}
              className={`absolute px-2.5 py-1 rounded-lg border text-[8px] font-bold tracking-wider uppercase backdrop-blur-md flex items-center gap-1.5 shadow-lg shadow-black/20`}
            >
              {ev.type === 'delivered' ? (
                <CheckCircle size={10} className={ev.color.split(' ')[0]} />
              ) : (
                <Box size={10} className={ev.color.split(' ')[0]} />
              )}
              <span className={ev.color.split(' ')[0]}>{ev.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
