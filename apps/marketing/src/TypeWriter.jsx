import { useEffect, useRef, useState } from 'react';
import './TypeWriter.css';

/**
 * TypeWriter — Types text character by character when it enters the viewport.
 */
export function TypeWriter({
  text,
  tag: Tag = 'p',
  className = '',
  speed = 35,       // ms per character
  startDelay = 400, // ms before typing begins
  showCursor = true,
}) {
  const ref = useRef(null);
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let charIndex = 0;
    let interval;

    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        charIndex++;
        setDisplayed(text.slice(0, charIndex));
        if (charIndex >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      clearInterval(interval);
    };
  }, [started, text, speed, startDelay]);

  return (
    <Tag ref={ref} className={`typewriter-text ${className}`}>
      {displayed}
      {showCursor && !done && started && (
        <span className="typewriter-cursor" aria-hidden="true">|</span>
      )}
    </Tag>
  );
}
