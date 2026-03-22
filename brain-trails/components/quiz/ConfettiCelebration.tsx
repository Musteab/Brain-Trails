"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

interface ConfettiCelebrationProps {
  triggerOn?: boolean;
  performanceScore?: number; // 0-100
}

export default function ConfettiCelebration({
  triggerOn = true,
  performanceScore = 75,
}: ConfettiCelebrationProps) {
  useEffect(() => {
    if (!triggerOn) return;

    // Determine confetti intensity based on performance
    const isOutstanding = performanceScore >= 85;
    const duration = isOutstanding ? 3000 : 2000;

    const end = Date.now() + duration;

    // Main confetti burst with more intensity for high scores
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      // Create multiple bursts from different points
      const positions = [
        { x: 0.2, y: 0.5 },
        { x: 0.5, y: 0.2 },
        { x: 0.8, y: 0.5 },
      ];

      positions.forEach((pos) => {
        confetti({
          particleCount: isOutstanding ? 80 : 50,
          angle: 90,
          spread: isOutstanding ? 120 : 80,
          origin: pos,
          colors: isOutstanding
            ? ["#FFD700", "#FFA500", "#FF69B4", "#00CED1", "#9370DB"]
            : ["#4F46E5", "#7C3AED", "#EC4899", "#06B6D4", "#10B981"],
          decay: 0.95,
          scalar: isOutstanding ? 1.2 : 1,
          gravity: 0.8,
          ticks: isOutstanding ? 200 : 150,
        });
      });
    }, isOutstanding ? 50 : 100);

    return () => clearInterval(interval);
  }, [triggerOn, performanceScore]);

  return null; // This component doesn't render anything visible
}
