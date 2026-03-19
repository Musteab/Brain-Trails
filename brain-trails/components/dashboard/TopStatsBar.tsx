"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Zap, ChevronDown, User as UserIcon, Users, Command } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { usePresence } from "@/hooks/usePresence";
import ProfileHoverCard from "@/components/ui/ProfileHoverCard";
import { gameText } from "@/constants/gameText";

function getFrameClass(role?: string | null, avatarFrame?: string | null) {
  if (avatarFrame && avatarFrame !== 'default') return avatarFrame;
  if (role === "dev") return "frame-dev";
  if (role === "admin") return "frame-admin";
  if (role === "beta_tester") return "frame-beta";
  return "";
}

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
  const onlineCount = usePresence();
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
      {/* Left: Gold Display + Presence */}
      <div className="flex items-center gap-2">
        <motion.div
          title="Current Gold - Spend it in the Shop!"
          whileHover={{ scale: 1.05 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border-2 cursor-help ${
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

        {/* Online Travelers Presence */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-sm border ${
            isSun
              ? "bg-emerald-50/80 border-emerald-200"
              : "bg-emerald-500/10 border-emerald-400/20"
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Users className={`w-3.5 h-3.5 ${isSun ? "text-emerald-600" : "text-emerald-400"}`} />
          <span className={`text-xs font-medium ${isSun ? "text-emerald-700" : "text-emerald-300"}`}>
            {onlineCount} {onlineCount === 1 ? "Traveler" : "Travelers"}
          </span>
        </motion.div>
      </div>

      {/* Center: Level, XP Progress & Theme Toggle */}
      <div className="flex items-center gap-3">
        {/* Command Palette Toggle */}
        <button
          onClick={() => {
            const ev = new CustomEvent("open-command-palette");
            window.dispatchEvent(ev);
          }}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-colors ${
            isSun
              ? "bg-white/60 border-slate-200 text-slate-500 hover:bg-white"
              : "bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-700"
          }`}
          title="Open Command Palette (Ctrl+/)"
        >
          <Command className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">Menu</span>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Level Badge */}
        <motion.div
          title={`Level ${level} - Keep studying to level up!`}
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-md cursor-help"
        >
          <Zap className="w-3.5 h-3.5 text-white" fill="white" />
          {isLoading ? (
            <div className="w-8 h-4 bg-white/40 rounded animate-pulse" />
          ) : (
            <span className="font-bold text-sm text-white">Lv.{level}</span>
          )}
        </motion.div>

        {/* XP Progress Bar */}
        <div 
          className="hidden sm:flex items-center gap-2 cursor-help"
          title={`${currentXP} / ${maxXP} XP (${Math.round(xpPercentage)}%)`}
        >
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
      <div 
        className="relative"
        onMouseEnter={() => setDropdownOpen(true)}
        onMouseLeave={() => setDropdownOpen(false)}
      >
        <button
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm border-2 transition-colors ${
            isSun 
              ? "bg-white/80 border-slate-200 hover:bg-white" 
              : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60"
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm ${getFrameClass(profile?.role, profile?.avatar_frame)} ${isSun ? "bg-slate-100 border border-slate-200" : "bg-slate-800 border-slate-700"}`}>
            {profile?.avatar_url ? (
              <Image 
                src={profile.avatar_url} 
                alt="Avatar"
                width={32}
                height={32}
                unoptimized
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className={`w-4 h-4 ${isSun ? "text-slate-400" : "text-white"}`} />
            )}
          </div>
          
          <div className="text-right ml-1">
            {isLoading ? (
              <div className={`h-3 w-16 mb-0.5 rounded animate-pulse ${isSun ? "bg-slate-200" : "bg-white/20"}`} />
            ) : (
              <p className={`text-xs font-bold leading-tight ${isSun ? "text-slate-700" : "text-slate-200"}`}>
                {profile?.display_name || user?.email?.split('@')[0] || gameText.user.user}
              </p>
            )}
          </div>
          
          <ChevronDown className={`w-3.5 h-3.5 ml-1 ${isSun ? "text-slate-400" : "text-slate-400"}`} />
        </button>

        <ProfileHoverCard 
          isOpen={dropdownOpen} 
          onClose={() => setDropdownOpen(false)} 
          onLogout={handleSignOut} 
        />
      </div>
    </motion.div>
  );
}
