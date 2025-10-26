import React, { useEffect, useRef, useState } from "react";

interface StarTimerProps {
  duration?: number; // Duration in seconds
  onComplete?: () => void; // Callback when timer finishes
}

const StarTimer: React.FC<StarTimerProps> = ({ duration = 10, onComplete }) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const stop1Ref = useRef<SVGStopElement | null>(null);
  const stop2Ref = useRef<SVGStopElement | null>(null);

  // Format time into mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  useEffect(() => {
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeRemaining(Math.ceil(remaining));

      const progress = Math.min(1, elapsed / duration);
      if (stop1Ref.current && stop2Ref.current) {
        stop1Ref.current.setAttribute("offset", `${progress * 100}%`);
        stop2Ref.current.setAttribute("offset", `${progress * 100}%`);
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        if (onComplete) onComplete(); // Trigger callback when time runs out
      }
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-max">
      <div className="w-12 h-12 relative">
        <svg viewBox="0 0 92 106" className="w-full h-full">
          <defs>
            <linearGradient id="star-fill" x1="0" y1="0" x2="0" y2="1">
              <stop ref={stop1Ref} offset="0%" stopColor="#B3B3B3" />
              <stop ref={stop2Ref} offset="0%" stopColor="#2F2F2F" />
            </linearGradient>
          </defs>
          <path
            fill="url(#star-fill)"
            d="M46 0L56.1221 35.468L91.8993 26.5L66.2442 53L91.8993 79.5L56.1221 70.532L46 106L35.8779 70.532L0.100655 79.5L25.7558 53L0.100655 26.5L35.8779 35.468L46 0Z"
          />
        </svg>
      </div>
      <div className="text-main">{formatTime(timeRemaining)}</div>
    </div>
  );
};

export default StarTimer;
