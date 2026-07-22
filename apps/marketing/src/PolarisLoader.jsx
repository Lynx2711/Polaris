import { useEffect, useRef, useState } from "react";
import "./PolarisLoader.css";

/**
 * PolarisLoader
 *
 * A full-screen overlay that plays the burst-and-shrink logo animation,
 * then reveals the POLARIS wordmark, subtitle, and a loading bar.
 *
 * Props:
 *   onDone  — callback fired when the exit transition is complete
 *             (parent should hide/unmount the loader or reveal its content)
 */
export function PolarisLoader({ onDone }) {
  const logoRef     = useRef(null);
  const wordRef     = useRef(null);
  const subRef      = useRef(null);
  const barTrackRef = useRef(null);
  const barFillRef  = useRef(null);

  // Tracks whether the exit-fade is happening so the overlay stays in
  // the DOM long enough for the CSS transition to finish.
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const logo     = logoRef.current;
    const word     = wordRef.current;
    const sub      = subRef.current;
    const barTrack = barTrackRef.current;
    const barFill  = barFillRef.current;

    // 1) Burst-and-shrink the mark
    logo.classList.remove("pl-animate");
    void logo.offsetWidth; // force reflow to restart animation
    logo.classList.add("pl-animate");

    // 2) Wordmark appears as burst finishes
    const t1 = setTimeout(() => word.classList.add("show"), 1700);

    // 3) Subtitle appears after wordmark
    const t2 = setTimeout(() => sub.classList.add("show"), 2400);

    // 4) Loading bar fills in
    const t3 = setTimeout(() => {
      barTrack.classList.add("show");
      barFill.classList.add("fill");
    }, 2800);

    // 5) Fade out the overlay and notify the parent
    const t4 = setTimeout(() => {
      setIsDone(true);
      // Give the CSS fade-out (0.6s) time to finish before calling onDone
      const t5 = setTimeout(() => onDone?.(), 650);
      return () => clearTimeout(t5);
    }, 5200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onDone]);

  return (
    <div id="polaris-loader" className={isDone ? "is-done" : ""}>
      {/* Logo mark */}
      <div className="pl-mark-slide">
        <div className="pl-mark-spin" ref={logoRef}>
          <svg viewBox="0 0 200 200">
            <path
              className="pl-blade"
              d="M101,42 L101,98 L157,96 C144,88 122,66 101,42 Z"
            />
            <path
              className="pl-blade"
              d="M43,102 L98,102 L98,158 C93,135 66,118 43,102 Z"
            />
          </svg>
        </div>
      </div>

      {/* Wordmark */}
      <div className="pl-word" ref={wordRef}>POLARIS</div>

      {/* Subtitle */}
      <div className="pl-sub" ref={subRef}>Optimize. Dispatch. Deliver.</div>

      {/* Progress bar */}
      <div className="pl-bar-track" ref={barTrackRef}>
        <div className="pl-bar-fill" ref={barFillRef} />
      </div>
    </div>
  );
}
