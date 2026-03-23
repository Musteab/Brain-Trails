"use client";

import { useState, useCallback, memo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Zap, User as UserIcon, Users, Search, Settings } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { usePresence } from "@/hooks/usePresence";
import ProfileHoverCard from "@/components/ui/ProfileHoverCard";
import Link from "next/link";

function getFrameClass(role?: string | null, avatarFrame?: string | null) {
  if (avatarFrame && avatarFrame !== 'default') return avatarFrame;
  if (role === "dev") return "frame-dev";
  if (role === "admin") return "frame-admin";
  if (role === "beta_tester") return "frame-beta";
  return "";
}

/**
 * TopStatsBar - Extremely Minimal
 * Left: Pill indicators (Gold, Level, Online)
 * Center: Theme toggle (centered)
 * Right: Clean circular icons (Search, Settings, Profile)
 * Memoized to prevent unnecessary re-renders from parent components
 */
function TopStatsBar() {
  const { theme } = useTheme();
  const { profile, user, signOut, isLoading } = useAuth();
  const onlineCount = usePresence();
  const isSun = theme === "sun";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const gold = profile?.gold ?? 0;
  const level = profile?.level ?? 1;
  const currentXP = profile?.xp ?? 0;
  const maxXP = level * 1000; 
  const xpPercentage = Math.min((currentXP / maxXP) * 100, 100);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const openCommandPalette = useCallback(() => {
    const ev = new CustomEvent("open-command-palette");
    window.dispatchEvent(ev);
  }, []);

  const pillClass = isSun 
    ? "bg-white/50 border-white/60 backdrop-blur-md" 
    : "bg-white/[0.04] border-white/[0.08] backdrop-blur-md";

  const iconBtnClass = isSun
    ? "bg-white/50 border-white/60 hover:bg-white/70 text-slate-500"
    : "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] text-slate-400";

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full flex items-center justify-between py-1"
    >
      {/* Left: Pill indicators */}
      <div className="flex items-center gap-1.5">
        {/* Gold */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border ${pillClass}`}>
          <span className="text-sm">🪙</span>
          {isLoading ? (
            <div className={`w-5 h-3 rounded animate-pulse ${isSun ? "bg-amber-200" : "bg-amber-500/40"}`} />
          ) : (
            <span className={`font-bold text-xs ${isSun ? "text-amber-700" : "text-amber-300"}`}>{gold}</span>
          )}
        </div>

        {/* Level + XP Bar */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border ${pillClass}`}>
          <Zap className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
          {isLoading ? (
            <div className="w-5 h-3 bg-white/20 rounded animate-pulse" />
          ) : (
            <span className={`font-bold text-xs ${isSun ? "text-slate-700" : "text-white"}`}>Lv.{level}</span>
          )}
          <div className={`hidden sm:block w-16 h-1.5 rounded-full overflow-hidden ${isSun ? "bg-slate-200/80" : "bg-white/10"}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"
            />
          </div>
        </div>

        {/* Online Count */}
        <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full border ${pillClass}`}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <Users className={`w-3 h-3 ${isSun ? "text-emerald-600" : "text-emerald-400"}`} />
          <span className={`text-[10px] font-bold ${isSun ? "text-emerald-700" : "text-emerald-300"}`}>
            {onlineCount}
          </span>
        </div>
      </div>

      {/* Center: Theme Toggle - properly centered */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10">
        <ThemeToggle />
      </div>

      {/* Right: Clean circular icons */}
      <div className="flex items-center gap-1.5">
        {/* Search */}
        <button
          onClick={openCommandPalette}
          className={`hidden sm:flex w-8 h-8 rounded-full items-center justify-center border transition-colors ${iconBtnClass}`}
          title="Search (Ctrl+/)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${iconBtnClass}`}
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </Link>

        {/* Profile */}
        <div 
          className="relative"
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <button
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 overflow-hidden transition-colors ${
              getFrameClass(profile?.role, profile?.avatar_frame)
            } ${isSun ? "bg-white/80 border-slate-200" : "bg-slate-800/60 border-slate-700/50"}`}
            title={profile?.display_name || "Profile"}
          >
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
              <UserIcon className={`w-3.5 h-3.5 ${isSun ? "text-slate-400" : "text-white"}`} />
            )}
          </button>

          <ProfileHoverCard 
            isOpen={dropdownOpen} 
            onClose={() => setDropdownOpen(false)} 
            onLogout={handleSignOut} 
          />
        </div>
      </div>
    </motion.div>
  );
}

export default memo(TopStatsBar);
