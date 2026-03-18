"use client";

import { motion } from "framer-motion";
import { useCardStyles } from "@/hooks/useCardStyles";

interface StudyStreakWidgetProps {
  streakDays: number;
  lastStudyDate: string | null;
}

export default function StudyStreakWidget({ streakDays, lastStudyDate }: StudyStreakWidgetProps) {
  const { card, isSun, muted } = useCardStyles();

  const fireScale = Math.min(1 + streakDays * 0.05, 2);
  const isActive = (() => {
    if (!lastStudyDate) return false;
    const last = new Date(lastStudyDate);
    const now = new Date();
    const diffMs = now.getTime() - last.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays < 1.5;
  })();

  const subtitle = streakDays === 0
    ? "Start your streak today!"
    : streakDays < 3
      ? "Keep it going!"
      : streakDays < 7
        ? "You're on fire!"
        : streakDays < 30
          ? "Unstoppable! 💪"
          : "Legendary streak! 👑";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${card} p-4 text-center relative overflow-hidden`}
    >
      {/* Fire SVG Animation */}
      <div className="relative mx-auto w-16 h-16 mb-2">
        <motion.div
          animate={{
            scale: isActive ? [fireScale * 0.95, fireScale * 1.05, fireScale * 0.95] : [0.8, 0.85, 0.8],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-lg">
            <defs>
              <linearGradient id="fireGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={isActive ? "#f59e0b" : "#94a3b8"} />
                <stop offset="50%" stopColor={isActive ? "#ef4444" : "#64748b"} />
                <stop offset="100%" stopColor={isActive ? "#f97316" : "#475569"} />
              </linearGradient>
            </defs>
            <motion.path
              d="M24 4 C18 12, 8 18, 10 30 C12 40, 20 44, 24 44 C28 44, 36 40, 38 30 C40 18, 30 12, 24 4Z"
              fill="url(#fireGrad)"
              animate={{
                d: [
                  "M24 4 C18 12, 8 18, 10 30 C12 40, 20 44, 24 44 C28 44, 36 40, 38 30 C40 18, 30 12, 24 4Z",
                  "M24 6 C16 14, 6 20, 8 32 C10 42, 20 44, 24 44 C28 44, 38 42, 40 32 C42 20, 32 14, 24 6Z",
                  "M24 4 C18 12, 8 18, 10 30 C12 40, 20 44, 24 44 C28 44, 36 40, 38 30 C40 18, 30 12, 24 4Z",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Inner flame */}
            <motion.path
              d="M24 18 C21 24, 16 26, 17 34 C18 40, 22 42, 24 42 C26 42, 30 40, 31 34 C32 26, 27 24, 24 18Z"
              fill={isActive ? "#fbbf24" : "#9ca3af"}
              opacity={0.8}
              animate={{
                d: [
                  "M24 18 C21 24, 16 26, 17 34 C18 40, 22 42, 24 42 C26 42, 30 40, 31 34 C32 26, 27 24, 24 18Z",
                  "M24 20 C20 26, 14 28, 15 36 C16 42, 22 42, 24 42 C26 42, 32 42, 33 36 C34 28, 28 26, 24 20Z",
                  "M24 18 C21 24, 16 26, 17 34 C18 40, 22 42, 24 42 C26 42, 30 40, 31 34 C32 26, 27 24, 24 18Z",
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </motion.div>
      </div>

      {/* Streak Counter */}
      <p className={`text-2xl font-black font-[family-name:var(--font-nunito)] ${
        isActive
          ? isSun ? "text-orange-600" : "text-orange-400"
          : isSun ? "text-slate-500" : "text-slate-400"
      }`}>
        {streakDays} {streakDays === 1 ? "day" : "days"}
      </p>

      <p className={`text-xs font-bold font-[family-name:var(--font-nunito)] ${muted} mt-1`}>
        {subtitle}
      </p>

      {streakDays > 0 && (
        <p className={`text-[10px] mt-2 ${
          isActive
            ? isSun ? "text-orange-500" : "text-orange-400"
            : "text-red-500"
        }`}>
          {isActive ? "🔥 Streak active — Don't break the chain!" : "⚠️ Study today to keep your streak!"}
        </p>
      )}
    </motion.div>
  );
}
