"use client";

import { motion } from "framer-motion";
import { gameText } from "@/constants/gameText";
import { Flame } from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";

/**
 * Static heatmap data - 4 weeks x 7 days
 * Using fire emoji indicators like in the Figma
 */
const staticHeatmapData: number[][] = [
  [2, 3, 3, 2, 3, 2, 1],
  [3, 2, 2, 3, 3, 2, 2],
  [2, 3, 3, 2, 3, 3, 2],
  [3, 2, 3, 2, 2, 2, 1],
];

/**
 * Day labels for the heatmap (M T W T F S S)
 */
const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * Week labels
 */
const weekLabels = ["W1", "", "W5", "", "W9"];

/**
 * Get fire emoji based on intensity
 */
function getFireEmoji(intensity: number): string {
  if (intensity >= 3) return "🔥";
  if (intensity >= 2) return "🔸";
  if (intensity >= 1) return "🔹";
  return "⚪";
}

/**
 * 🔥 ComboBoard Component (Adventure Log)
 * 
 * Displays streak and weekly heatmap with fire emojis.
 * Matches the Figma "Adventure Log" design.
 */
export default function ComboBoard() {
  const { card, title, muted, isSun } = useCardStyles();
  const currentStreak = 12;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`${card} p-5 flex flex-col w-full`}
    >
      {/* Header + Streak inline */}
      <div className="flex items-center justify-between mb-3">
        <h2 className={`text-base font-bold ${title} font-[family-name:var(--font-nunito)]`}>
          Adventure Log
        </h2>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 border ${
            isSun ? "bg-orange-100 border-orange-200" : "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-400/30"
          }`}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Flame className="w-4 h-4 text-orange-500" fill="#f97316" />
          </motion.div>
          <span className="text-sm font-bold text-orange-500">{currentStreak}</span>
        </motion.div>
      </div>

      {/* Compact Heatmap Grid */}
      <div className="flex-1">
        {/* Day Labels */}
        <div className="flex gap-1 mb-1 ml-6">
          {dayLabels.map((day, idx) => (
            <div
              key={idx}
              className={`w-5 h-3 flex items-center justify-center text-[9px] font-medium ${muted}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap Rows */}
        <div className="space-y-1">
          {staticHeatmapData.map((week, weekIdx) => (
            <div key={weekIdx} className="flex items-center gap-1">
              {/* Week Label */}
              <div className={`w-5 text-[9px] ${muted} font-medium`}>
                {weekLabels[weekIdx] || ""}
              </div>

              {/* Week Cells */}
              <div className="flex gap-1">
                {week.map((intensity, dayIdx) => (
                  <motion.div
                    key={`${weekIdx}-${dayIdx}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: weekIdx * 0.05 + dayIdx * 0.02,
                      type: "spring",
                      stiffness: 300,
                    }}
                    className="w-5 h-5 flex items-center justify-center text-xs cursor-pointer
                      hover:scale-125 transition-transform"
                    title={`Day ${dayIdx + 1}, Week ${weekIdx + 1}`}
                  >
                    {getFireEmoji(intensity)}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compact Legend */}
      <div className={`flex items-center justify-center gap-3 mt-2 pt-2 border-t ${isSun ? 'border-amber-200/50' : 'border-white/10'}`}>
        <div className={`flex items-center gap-0.5 text-[10px] ${muted}`}>
          <span>⚪</span>
          <span>Rest</span>
        </div>
        <div className={`flex items-center gap-0.5 text-[10px] ${muted}`}>
          <span>🔹</span>
          <span>Light</span>
        </div>
        <div className={`flex items-center gap-0.5 text-[10px] ${muted}`}>
          <span>🔸</span>
          <span>Good</span>
        </div>
        <div className={`flex items-center gap-0.5 text-[10px] ${muted}`}>
          <span>🔥</span>
          <span>Fire!</span>
        </div>
      </div>
    </motion.div>
  );
}
