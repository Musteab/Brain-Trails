"use client";

import { useTheme } from "@/context/ThemeContext";

/**
 * Hook to get theme-aware styling for cards
 * Premium glassmorphism with subtle gradient borders — no more thick green borders
 */
export function useCardStyles() {
  const { theme } = useTheme();
  const isSun = theme === "sun";

  return {
    isSun,
    // Card container styles — Premium glass with subtle gradient borders
    card: isSun
      ? "bg-white/60 backdrop-blur-xl rounded-3xl shadow-lg shadow-amber-900/5 border border-amber-200/40 transition-all duration-300"
      : "bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 border border-white/10 transition-all duration-300",
    
    // Text styles
    title: isSun 
      ? "text-slate-800 font-bold font-[family-name:var(--font-nunito)]" 
      : "text-white font-bold font-[family-name:var(--font-nunito)]",
    subtitle: isSun ? "text-slate-600" : "text-slate-300",
    muted: isSun ? "text-slate-500" : "text-slate-400",
    accent: isSun ? "text-purple-600" : "text-[#C77DFF]",
    
    // Border styles — subtle, not game-y green
    border: isSun ? "border-amber-200/50" : "border-white/10",
    borderLight: isSun ? "border-amber-100/30" : "border-white/5",
    
    // Item/row styles
    item: isSun
      ? "bg-white/40 backdrop-blur-sm border border-amber-200/30 hover:bg-white/60 hover:border-amber-300/50"
      : "bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20",
    itemCompleted: isSun
      ? "bg-emerald-100/70 border border-emerald-300"
      : "bg-emerald-500/15 border border-emerald-400/30",
  };
}
