"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import OwlCompanion from "../ui/OwlCompanion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

/**
 * Centerpiece - Owl Mascot on stone pedestal with floating stats
 * Memoized to prevent unnecessary re-renders from parent components
 */
function StudyRoom() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const isSun = theme === "sun";

  const totalXP = profile?.xp || 0;
  const orbs = profile?.level || 1;
  const stars = profile?.streak_days || 0;
  const gold = profile?.gold || 0;

  return (
    <div className="relative w-full max-w-sm mx-auto flex flex-col items-center">
      {/* XP display above owl */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-1 text-center"
      >
        <p className={`text-[10px] font-semibold uppercase tracking-[0.25em] mb-0.5 ${isSun ? "text-slate-400" : "text-white/40"}`}>
          Total Experience
        </p>
        <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${isSun ? "text-slate-800" : "text-white"}`}
          style={{ textShadow: isSun ? "none" : "0 0 30px rgba(139,92,246,0.3)" }}
        >
          {totalXP.toLocaleString()} <span className={`text-lg font-bold ${isSun ? "text-slate-400" : "text-white/50"}`}>XP</span>
        </h2>
      </motion.div>

      {/* Owl & Pedestal container */}
      <div className="relative w-[280px] h-[310px] flex flex-col items-center justify-end mt-0">
        
        {/* The Owl - positioned higher */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 12 }}
          className="relative z-10 w-[220px] h-[220px] mb-[-45px]"
        >
          <OwlCompanion mood="idle" />
        </motion.div>

        {/* Elegant Stone Pedestal */}
        <div className="relative z-0 w-44 h-20">
          <svg viewBox="0 0 200 90" className="w-full h-full" style={{ filter: isSun ? "drop-shadow(0 4px 12px rgba(0,0,0,0.1))" : "drop-shadow(0 4px 20px rgba(0,0,0,0.4))" }}>
            {/* Pedestal top surface */}
            <ellipse 
              cx="100" cy="18" rx="75" ry="18" 
              fill={isSun ? "#F1F5F9" : "#334155"} 
            />
            {/* Pedestal body */}
            <path 
              d="M 25 18 L 175 18 L 160 85 L 40 85 Z" 
              fill={isSun ? "#E2E8F0" : "#1E293B"} 
            />
            {/* Top rim highlight */}
            <ellipse 
              cx="100" cy="18" rx="75" ry="18" 
              fill="none"
              stroke={isSun ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.1)"}
              strokeWidth="1.5"
            />
            {/* Subtle column lines */}
            <line x1="65" y1="25" x2="72" y2="85" stroke={isSun ? "#CBD5E1" : "#0F172A"} strokeWidth="1.5" opacity="0.5" />
            <line x1="100" y1="30" x2="100" y2="85" stroke={isSun ? "#CBD5E1" : "#0F172A"} strokeWidth="1.5" opacity="0.5" />
            <line x1="135" y1="25" x2="128" y2="85" stroke={isSun ? "#CBD5E1" : "#0F172A"} strokeWidth="1.5" opacity="0.5" />
          </svg>
        </div>

        {/* Floating Stat - Orbs (Left) */}
        <motion.div 
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[5px] top-[80px]"
        >
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border border-white/30 flex items-center justify-center"
              style={{ boxShadow: "0 0 15px rgba(139,92,246,0.4)" }}
            >
              <span className="text-base">🔮</span>
            </div>
            <span className={`font-black text-xs ${isSun ? "text-slate-700" : "text-white"}`}>{orbs}</span>
            <span className={`text-[9px] font-medium ${isSun ? "text-slate-400" : "text-white/40"}`}>Orbs</span>
          </div>
        </motion.div>

        {/* Floating Stat - Stars (Right) */}
        <motion.div 
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute right-[5px] top-[65px]"
        >
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 border border-white/30 flex items-center justify-center"
              style={{ boxShadow: "0 0 15px rgba(244,63,94,0.35)" }}
            >
              <span className="text-base">⭐</span>
            </div>
            <span className={`font-black text-xs ${isSun ? "text-slate-700" : "text-white"}`}>{stars}</span>
            <span className={`text-[9px] font-medium ${isSun ? "text-slate-400" : "text-white/40"}`}>Streak</span>
          </div>
        </motion.div>

        {/* Floating Stat - Coins (Bottom Left) */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          className="absolute left-[-10px] bottom-[30px]"
        >
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 border border-white/30 flex items-center justify-center"
              style={{ boxShadow: "0 0 15px rgba(245,158,11,0.4)" }}
            >
              <span className="text-sm">🪙</span>
            </div>
            <span className={`font-black text-xs ${isSun ? "text-slate-700" : "text-white"}`}>{gold}</span>
            <span className={`text-[9px] font-medium ${isSun ? "text-slate-400" : "text-white/40"}`}>Coins</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default memo(StudyRoom);
