"use client";

import { motion } from "framer-motion";
import { gameText } from "@/constants/gameText";
import { Zap, AlertTriangle } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";

/**
 * 🎮 TopStatsBar Component
 * 
 * Displays player stats at the top of the dashboard:
 * - Gold/Currency (left)
 * - Level with XP progress + Theme toggle (center)
 * - Upcoming deadline alert (right)
 * 
 * Aligned with the 3-column grid using viewport-relative padding
 */
export default function TopStatsBar() {
  const { theme } = useTheme();
  const isSun = theme === "sun";
  
  // Hardcoded demo data
  const gold = 500;
  const level = 5;
  const currentXP = 750;
  const maxXP = 1000;
  const xpPercentage = (currentXP / maxXP) * 100;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full flex items-center justify-between"
    >
      {/* Left: Gold Display - aligned with left sidebar */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border-2 ${
          isSun 
            ? "bg-amber-100/80 border-amber-300" 
            : "bg-amber-500/20 border-amber-400/30"
        }`}
      >
        <span className="text-lg">🪙</span>
        <span className={`font-bold text-sm ${isSun ? "text-amber-700" : "text-amber-300"}`}>{gold}</span>
      </motion.div>

      {/* Center: Level, XP Progress & Theme Toggle */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Level Badge */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-md"
        >
          <Zap className="w-3.5 h-3.5 text-white" fill="white" />
          <span className="font-bold text-sm text-white">Lv.{level}</span>
        </motion.div>

        {/* XP Progress Bar */}
        <div className="hidden sm:flex items-center gap-2">
          <div className={`w-32 lg:w-40 h-2.5 rounded-full overflow-hidden border backdrop-blur-sm ${
            isSun ? "bg-amber-200/50 border-amber-300" : "bg-white/10 border-white/20"
          }`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"
            />
          </div>
          <span className={`text-[10px] font-medium whitespace-nowrap ${isSun ? "text-amber-800" : "text-slate-300"}`}>
            {currentXP}/{maxXP}
          </span>
          <span className={`text-[10px] font-bold ${isSun ? "text-purple-600" : "text-[#C77DFF]"}`}>
            {Math.round(xpPercentage)}%
          </span>
        </div>
      </div>

      {/* Right: Deadline Alert - aligned with right sidebar */}
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm border-2 ${
          isSun 
            ? "bg-red-100/80 border-red-300" 
            : "bg-red-500/20 border-red-400/30"
        }`}
      >
        <AlertTriangle className={`w-3.5 h-3.5 ${isSun ? "text-red-600" : "text-red-400"}`} />
        <div className="text-right">
          <p className={`text-[10px] leading-tight ${isSun ? "text-red-700" : "text-slate-300"}`}>Midterm</p>
          <p className={`text-xs font-bold leading-tight ${isSun ? "text-red-600" : "text-red-400"}`}>3 Days</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
