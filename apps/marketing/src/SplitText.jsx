import { useEffect, useRef, useState } from 'react';
import './SplitText.css';

/**
 * SplitText — Pure React character-by-character reveal animation.
 * No GSAP required. Triggered by IntersectionObserver.
 */
export function SplitText({
  text,
  tag: Tag = 'p',
  className = '',
  charDelay = 0.025,   // seconds per character
  startDelay = 0,      // initial delay before first char
  threshold = 0.3,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin: '-20px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  // Split words first, then chars — preserves word wrapping
  const words = text.split(' ');
  let globalIdx = 0;

  return (
    <Tag ref={ref} className={`split-parent ${className}`} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} className="split-word">
          {[...word].map((char) => {
            const delay = startDelay + globalIdx++ * charDelay;
            return (
              <span
                key={delay}
                className={`split-char ${visible ? 'split-char--visible' : ''}`}
                style={{ '--char-delay': `${delay}s` }}
                aria-hidden="true"
              >
                {char}
              </span>
            );
          })}
          {/* Space between words */}
          {wi < words.length - 1 && (
            <span
              className={`split-char split-char--space ${visible ? 'split-char--visible' : ''}`}
              style={{ '--char-delay': `${startDelay + globalIdx++ * charDelay}s` }}
              aria-hidden="true"
            >
              {'\u00A0'}
            </span>
          )}
        </span>
      ))}
    </Tag>
  );
}
