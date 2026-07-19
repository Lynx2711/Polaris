import { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * FloatingParticles – generates N tiny glowing dots that drift
 * randomly across the dark left panel, looping forever.
 */
const COUNT = 28;

function seeded(seed) {
  // Simple deterministic "random" so SSR/hydration is stable
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export default function FloatingParticles() {
  const particles = useMemo(() =>
    Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      x: seeded(i * 3.1) * 100,
      y: seeded(i * 5.7) * 100,
      size: seeded(i * 7.3) * 3 + 1.5,       // 1.5 – 4.5 px
      duration: seeded(i * 11.1) * 8 + 6,    // 6 – 14 s
      delay: seeded(i * 13.9) * -10,          // stagger across full loop
      dx: (seeded(i * 17.3) - 0.5) * 16,     // drift X
      dy: (seeded(i * 19.7) - 0.5) * 16,     // drift Y
      color: i % 3 === 0 ? '#00D4FF' : i % 3 === 1 ? '#2563EB' : '#10B981',
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          animate={{
            x: [0, p.dx, 0],
            y: [0, p.dy, 0],
            opacity: [0.15, 0.7, 0.15],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
