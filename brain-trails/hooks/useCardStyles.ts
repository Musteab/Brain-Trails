"use client";

import { useTheme } from "@/context/ThemeContext";

/**
 * Hook to get theme-aware styling for cards
 * Enhanced with glassmorphism + game-aesthetic borders
 */
export function useCardStyles() {
  const { theme } = useTheme();
  const isSun = theme === "sun";

  return {
    isSun,
    // Card container styles - Glassmorphism with 3px game-style borders
    card: isSun
      ? "bg-white/70 backdrop-blur-[12px] rounded-[24px] shadow-xl shadow-amber-300/20 border-[3px] border-emerald-600/40"
      : "bg-slate-900/50 backdrop-blur-[12px] rounded-[24px] shadow-2xl shadow-black/30 border-[3px] border-emerald-400/30",
    
    // Text styles
    title: isSun 
      ? "text-slate-800 font-bold font-[family-name:var(--font-nunito)]" 
      : "text-white font-bold font-[family-name:var(--font-nunito)]",
    subtitle: isSun ? "text-slate-600" : "text-slate-300",
    muted: isSun ? "text-slate-500" : "text-slate-400",
    accent: isSun ? "text-purple-600" : "text-[#C77DFF]",
    
    // Border styles - Game aesthetic with mint green
    border: isSun ? "border-emerald-600/40" : "border-emerald-400/30",
    borderLight: isSun ? "border-emerald-500/20" : "border-emerald-300/20",
    
    // Item/row styles with subtle glass effect
    item: isSun
      ? "bg-white/50 backdrop-blur-sm border-2 border-emerald-500/20 hover:bg-white/70 hover:border-emerald-500/40"
      : "bg-white/5 backdrop-blur-sm border-2 border-emerald-400/20 hover:bg-white/10 hover:border-emerald-400/40",
    itemCompleted: isSun
      ? "bg-green-100/80 border-2 border-green-400"
      : "bg-green-500/20 border-2 border-green-400/50",
  };
}
