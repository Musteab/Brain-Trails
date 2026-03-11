"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, LogOut, ChevronDown, User as UserIcon } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

/**
 * 🎮 TopStatsBar Component
 * 
 * Displays player stats from Supabase profile:
 * - Gold/Currency (left)
 * - Level with XP progress + Theme toggle (center)
 * - User Profile Dropdown / Logout (right)
 */
export default function TopStatsBar() {
  const { theme } = useTheme();
  const { profile, user, signOut, isLoading } = useAuth();
  const isSun = theme === "sun";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Real data from Supabase DB or fallbacks while loading
  const gold = profile?.gold ?? 0;
  const level = profile?.level ?? 1;
  const currentXP = profile?.xp ?? 0;
  const maxXP = level * 1000; 
  const xpPercentage = Math.min((currentXP / maxXP) * 100, 100);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full flex items-center justify-between"
    >
      {/* Left: Gold Display */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border-2 ${
          isSun 
            ? "bg-amber-100/80 border-amber-300" 
            : "bg-amber-500/20 border-amber-400/30"
        }`}
      >
        <span className="text-lg">🪙</span>
        {isLoading ? (
          <div className={`w-8 h-4 rounded animate-pulse ${isSun ? "bg-amber-200" : "bg-amber-500/40"}`} />
        ) : (
          <span className={`font-bold text-sm ${isSun ? "text-amber-700" : "text-amber-300"}`}>{gold}</span>
        )}
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
          {isLoading ? (
            <div className="w-8 h-4 bg-white/40 rounded animate-pulse" />
          ) : (
            <span className="font-bold text-sm text-white">Lv.{level}</span>
          )}
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
          <div className="w-16">
            {isLoading ? (
              <div className={`h-3 w-12 rounded animate-pulse ${isSun ? "bg-amber-200" : "bg-white/20"}`} />
            ) : (
              <span className={`text-[10px] font-medium whitespace-nowrap ${isSun ? "text-amber-800" : "text-slate-300"}`}>
                {currentXP}/{maxXP}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-bold ${isSun ? "text-purple-600" : "text-[#C77DFF]"}`}>
            {Math.round(xpPercentage)}%
          </span>
        </div>
      </div>

      {/* Right: User Profile Menu */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm border-2 transition-colors ${
            isSun 
              ? "bg-white/80 border-slate-200 hover:bg-white" 
              : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60"
          }`}
        >
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Avatar" 
              className="w-6 h-6 rounded-full bg-slate-200 border border-slate-300"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
              <UserIcon className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          
          <div className="text-right ml-1">
            {isLoading ? (
              <div className={`h-3 w-16 mb-0.5 rounded animate-pulse ${isSun ? "bg-slate-200" : "bg-white/20"}`} />
            ) : (
              <p className={`text-xs font-bold leading-tight ${isSun ? "text-slate-700" : "text-slate-200"}`}>
                {profile?.display_name || user?.email?.split('@')[0] || "Traveler"}
              </p>
            )}
          </div>
          
          <ChevronDown className={`w-3.5 h-3.5 ml-1 ${isSun ? "text-slate-400" : "text-slate-400"}`} />
        </motion.button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`absolute right-0 mt-2 w-48 rounded-2xl border backdrop-blur-xl shadow-xl overflow-hidden z-50 ${
                isSun 
                  ? "bg-white/90 border-slate-200 shadow-slate-200/50" 
                  : "bg-slate-900/90 border-slate-700 shadow-black/50"
              }`}
            >
              <div className="py-1">
                <button
                  onClick={handleSignOut}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors ${
                    isSun 
                      ? "text-red-600 hover:bg-red-50" 
                      : "text-red-400 hover:bg-red-500/10"
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
