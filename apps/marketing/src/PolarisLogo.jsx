import { useEffect, useState } from "react";
import "./PolarisLogo.css";

export function PolarisLogo() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showWord, setShowWord] = useState(false);

  const playArrowAnimation = () => {
    setIsAnimating(false);
    // force a reflow so the animation can replay, same trick as void logo.offsetWidth
    requestAnimationFrame(() => setIsAnimating(true));
  };

  useEffect(() => {
    const introTimer = setTimeout(() => {
      playArrowAnimation();
      setTimeout(() => setShowWord(true), 1000);
    }, 1000);

    const loopTimer = setTimeout(() => {
      const interval = setInterval(playArrowAnimation, 10000);
      return () => clearInterval(interval);
    }, 3000);

    return () => {
      clearTimeout(introTimer);
      clearTimeout(loopTimer);
    };
  }, []);

  return (
    <div className="lockup">
      <div className="markSlide">
        <div className={`markSpin ${isAnimating ? "animate" : ""}`}>
          <svg viewBox="0 0 200 200">
            <path className="blade" d="M101,42 L101,98 L157,96 C144,88 122,66 101,42 Z" />
            <path className="blade" d="M43,102 L98,102 L98,158 C93,135 66,118 43,102 Z" />
          </svg>
        </div>
      </div>
      <span className={`word ${showWord ? "word-visible" : ""}`}>POLARIS</span>
    </div>
  );
}
