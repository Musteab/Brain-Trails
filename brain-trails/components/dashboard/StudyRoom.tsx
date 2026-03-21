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

  return (
    <div className="relative w-full max-w-md mx-auto flex flex-col items-center">
      {/* "Today's Progress" + XP display above owl */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center"
      >
        <p className={`text-xs font-medium font-[family-name:var(--font-quicksand)] uppercase tracking-[0.2em] ${isSun ? "text-slate-500" : "text-white/50"}`}>
          Today&apos;s Progress
        </p>
        <h2 className={`text-4xl sm:text-5xl font-black font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"} drop-shadow-lg tracking-tight`}>
          {totalXP.toLocaleString()} XP
        </h2>
      </motion.div>

      {/* Owl & Pedestal — pushed up, larger */}
      <div className="relative w-[320px] h-[340px] flex flex-col items-center justify-end -mt-2">
        
        {/* The Owl */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 12 }}
          className="relative z-10 w-[260px] h-[260px] mb-[-55px]"
        >
          <OwlCompanion mood="idle" />
        </motion.div>

        {/* The Pedestal */}
        <div className="relative z-0 w-52 h-28">
          <svg viewBox="0 0 200 100" className="w-full h-full drop-shadow-2xl">
            <path 
              d="M 20 20 L 180 20 L 160 100 L 40 100 Z" 
              fill={isSun ? "#F8FAFC" : "#1E293B"} 
            />
            <ellipse 
              cx="100" cy="20" rx="80" ry="20" 
              fill={isSun ? "#FFFFFF" : "#334155"} 
            />
            <line x1="60" y1="30" x2="70" y2="100" stroke={isSun ? "#E2E8F0" : "#0F172A"} strokeWidth="4" />
            <line x1="100" y1="35" x2="100" y2="100" stroke={isSun ? "#E2E8F0" : "#0F172A"} strokeWidth="4" />
            <line x1="140" y1="30" x2="130" y2="100" stroke={isSun ? "#E2E8F0" : "#0F172A"} strokeWidth="4" />
          </svg>
        </div>

        {/* Floating Stat - Orbs (Left) */}
        <motion.div 
          animate={{ y: [0, -10, 0], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const } }}
          className="absolute left-[0px] top-[90px] flex items-center gap-2"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg shadow-purple-500/40 border-2 border-white/40 flex items-center justify-center">
              <span className="text-white text-xl font-bold">🔮</span>
            </div>
            <span className={`font-bold text-xs ${isSun ? "text-slate-600" : "text-white/70"}`}>Orbs</span>
            <span className={`font-black text-sm ${isSun ? "text-slate-800" : "text-white"}`}>{orbs}</span>
          </div>
        </motion.div>

        {/* Floating Stat - Stars (Right) */}
        <motion.div 
          animate={{ y: [0, -8, 0], transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const, delay: 1 } }}
          className="absolute right-[0px] top-[70px] flex items-center gap-2"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 shadow-lg shadow-pink-500/40 border-2 border-white/40 flex items-center justify-center">
              <span className="text-white text-lg">⭐</span>
            </div>
            <span className={`font-bold text-xs ${isSun ? "text-slate-600" : "text-white/70"}`}>Stars</span>
            <span className={`font-black text-sm ${isSun ? "text-slate-800" : "text-white"}`}>{totalXP.toLocaleString()}</span>
          </div>
        </motion.div>

        {/* Floating Stat - Streak (Far Right) */}
        <motion.div 
          animate={{ y: [0, -6, 0], transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const, delay: 0.5 } }}
          className="absolute right-[-30px] top-[160px] flex items-center gap-2"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg shadow-pink-500/30 border-2 border-white/40 flex items-center justify-center">
              <span className="text-white text-lg">✨</span>
            </div>
            <span className={`font-bold text-[10px] ${isSun ? "text-slate-600" : "text-white/70"}`}>{stars} Days</span>
          </div>
        </motion.div>

        {/* Floating Stat - Coins (Bottom Left) */}
        <motion.div 
          animate={{ y: [0, -12, 0], transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" as const, delay: 0.3 } }}
          className="absolute left-[-20px] bottom-[50px] flex items-center gap-2"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg shadow-amber-500/40 border-2 border-white/40 flex items-center justify-center">
              <span className="text-white text-lg">🪙</span>
            </div>
            <span className={`font-bold text-xs ${isSun ? "text-slate-600" : "text-white/70"}`}>Coins</span>
            <span className={`font-black text-sm ${isSun ? "text-slate-800" : "text-white"}`}>{gold}</span>
          </div>
        </motion.div>

        {/* Flavor text bottom right */}
        <motion.div
          animate={{ opacity: [0.5, 0.8, 0.5], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const } }}
          className="absolute right-[-20px] bottom-[30px]"
        >
          <p className={`text-[10px] font-medium text-center ${isSun ? "text-slate-400" : "text-white/30"}`}>
            Move<br/>Randow
          </p>
        </motion.div>
      </div>
    </div>
  );
}
