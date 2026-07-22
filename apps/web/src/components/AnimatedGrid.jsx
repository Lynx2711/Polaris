import { motion } from 'framer-motion';

/**
 * AnimatedGrid – subtle dark blue SVG grid with a sweeping cyan scanline.
 * Sits as an absolute layer behind all other animation elements.
 */
export default function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none grid-mask opacity-40">
      {/* SVG grid lines */}
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#2563EB" strokeWidth="0.6" strokeOpacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Cyan scanline sweeping top → bottom */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-50 sweep"
        style={{ top: 0 }}
      />
    </div>
  );
}
