"use client";

import { motion } from "framer-motion";
import OwlCompanion from "../ui/OwlCompanion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

/**
 * Centerpiece — Owl Mascot with Floating Stats
 */
export default function StudyRoom() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const isSun = theme === "sun";

  const totalXP = profile?.xp || 0;
  const orbs = profile?.level || 1;
  const stars = profile?.streak_days || 0;
  const gold = profile?.gold || 0;

  // Animation for floating elements
  const floatAnim = {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col items-center pt-8">
      {/* Total XP Text Above */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <p className={`text-sm font-medium font-[family-name:var(--font-quicksand)] uppercase tracking-widest ${isSun ? "text-slate-500" : "text-white/60"}`}>
          Total Progress
        </p>
        <h2 className={`text-5xl font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"} drop-shadow-lg tracking-tight`}>
          {totalXP.toLocaleString()} XP
        </h2>
      </motion.div>

      {/* Owl & Pedestal */}
      <div className="relative w-[280px] h-[320px] flex flex-col items-center justify-end">
        
        {/* The Owl */}
        <div className="relative z-10 w-[240px] h-[240px] mb-[-50px]">
          <OwlCompanion mood="idle" />
        </div>

        {/* The Pedestal */}
        <div className="relative z-0 w-48 h-24">
          <svg viewBox="0 0 200 100" className="w-full h-full drop-shadow-2xl">
            <path 
              d="M 20 20 L 180 20 L 160 100 L 40 100 Z" 
              fill={isSun ? "#F8FAFC" : "#1E293B"} 
            />
            <ellipse 
              cx="100" cy="20" rx="80" ry="20" 
              fill={isSun ? "#FFFFFF" : "#334155"} 
            />
            {/* Columns/Lines for texture */}
            <line x1="60" y1="30" x2="70" y2="100" stroke={isSun ? "#E2E8F0" : "#0F172A"} strokeWidth="4" />
            <line x1="100" y1="35" x2="100" y2="100" stroke={isSun ? "#E2E8F0" : "#0F172A"} strokeWidth="4" />
            <line x1="140" y1="30" x2="130" y2="100" stroke={isSun ? "#E2E8F0" : "#0F172A"} strokeWidth="4" />
          </svg>
        </div>

        {/* Floating Stat - Orbs (Left) */}
        <motion.div 
          animate={floatAnim}
          className="absolute left-[-20px] top-[80px] flex items-center gap-2"
        >
          <span className={`font-bold text-sm ${isSun ? "text-slate-700" : "text-white"}`}>Lv.{orbs}</span>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg shadow-purple-500/40 border-2 border-white/40 flex items-center justify-center">
            <span className="text-white text-xl font-bold">🔮</span>
          </div>
        </motion.div>

        {/* Floating Stat - Stars (Right) */}
        <motion.div 
          animate={{ y: [0, -8, 0], transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const, delay: 1 } }}
          className="absolute right-[-20px] top-[100px] flex items-center gap-2 flex-row-reverse"
        >
          <span className={`font-bold text-sm ${isSun ? "text-slate-700" : "text-white"}`}>{stars} Days</span>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg shadow-pink-500/40 border-2 border-white/40 flex items-center justify-center">
            <span className="text-white text-lg">✨</span>
          </div>
        </motion.div>

        {/* Floating Stat - Coins (Bottom Left) */}
        <motion.div 
          animate={{ y: [0, -12, 0], transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" as const, delay: 0.5 } }}
          className="absolute left-[10px] bottom-[40px] flex items-center gap-2"
        >
          <span className={`font-bold text-sm ${isSun ? "text-slate-700" : "text-white"}`}>{gold}</span>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg shadow-amber-500/40 border-2 border-white/40 flex items-center justify-center">
            <span className="text-white text-lg">🪙</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
