import { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

/**
 * PolarisLogo – the official Polaris mark + wordmark.
 *
 * Replicates the blade-spin animation from the brand reference:
 *   - Two SVG arrow blades rotate 0 → 180 → 0 deg on cue
 *   - "POLARIS" wordmark slides in from the left after the first spin
 *   - Loops every 10 seconds (matching the original script.js)
 *
 * Props:
 *   size        – icon size in px (default 32)
 *   showWord    – whether to show the "POLARIS" wordmark (default true)
 *   wordClass   – extra classes for the wordmark text
 *   dark        – if true renders blades + text in white (for dark backgrounds)
 *   loop        – if true keeps re-triggering the spin every 10 s (default true)
 */
export default function PolarisLogo({
  size = 32,
  showWord = true,
  wordClass = '',
  dark = false,
  loop = true,
}) {
  const blade1Controls = useAnimation();
  const blade2Controls = useAnimation();
  const wordControls   = useAnimation();
  const hasIntro       = useRef(false);

  const color = dark ? '#ffffff' : '#15171B';

  // Spin both blades 0 → 180 → 0
  async function spinBlades() {
    await Promise.all([
      blade1Controls.start({
        rotate: [0, 180, 0],
        transition: { duration: 1, ease: 'easeInOut' },
      }),
      blade2Controls.start({
        rotate: [0, 180, 0],
        transition: { duration: 1, ease: 'easeInOut' },
      }),
    ]);
  }

  useEffect(() => {
    if (hasIntro.current) return;
    hasIntro.current = true;

    // Intro: wait 1 s → spin → slide word in after 1 s
    const introTimer = setTimeout(async () => {
      await spinBlades();

      if (showWord) {
        wordControls.start({
          opacity: 1,
          x: 0,
          transition: { duration: 0.8, ease: 'easeOut' },
        });
      }

      // Start loop after intro (matches original 3 s head-start + 10 s interval)
      if (loop) {
        const loopTimer = setTimeout(() => {
          const interval = setInterval(spinBlades, 10000);
          return () => clearInterval(interval);
        }, 2000);
        return () => clearTimeout(loopTimer);
      }
    }, 1000);

    return () => clearTimeout(introTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center select-none">
      {/* ── Mark ── */}
      <div
        style={{ width: size, height: size, overflow: 'hidden', flexShrink: 0 }}
      >
        <svg
          viewBox="0 0 200 200"
          width={size}
          height={size}
          style={{ display: 'block' }}
          aria-hidden="true"
        >
          {/* Top-right blade */}
          <motion.path
            animate={blade1Controls}
            initial={{ rotate: 0 }}
            style={{ originX: '50%', originY: '50%' }}
            d="M101,42 L101,98 L157,96 C144,88 122,66 101,42 Z"
            fill={color}
          />
          {/* Bottom-left blade */}
          <motion.path
            animate={blade2Controls}
            initial={{ rotate: 0 }}
            style={{ originX: '50%', originY: '50%' }}
            d="M43,102 L98,102 L98,158 C93,135 66,118 43,102 Z"
            fill={color}
          />
        </svg>
      </div>

      {/* ── Wordmark ── */}
      {showWord && (
        <motion.span
          animate={wordControls}
          initial={{ opacity: 0, x: -24 }}
          className={[
            'ml-[10px] font-bold tracking-[0.04em]',
            dark ? 'text-white' : 'text-[#15171B]',
            wordClass,
          ].join(' ')}
          style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: '0.04em' }}
        >
          POLARIS
        </motion.span>
      )}
    </div>
  );
}
