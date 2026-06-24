"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Flame, Coins, Timer, GraduationCap, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

/**
 * Dashboard centerpiece — a focused "today" hero that drives the core loop
 * (study now / take a trial) and shows level progress at a glance.
 * Replaced the old mascot-on-pedestal with floating emoji stats.
 */
export default function StudyRoom() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const isSun = theme === "sun";

  const name = profile?.display_name || profile?.username || "Traveler";
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak_days ?? 0;
  const gold = profile?.gold ?? 0;

  // Progress within the current level (every 1000 XP = 1 level).
  const xpIntoLevel = Math.max(0, xp - (level - 1) * 1000);
  const pct = Math.min(xpIntoLevel / 1000, 1);

  // SVG ring
  const r = 78;
  const c = 2 * Math.PI * r;

  const ink = isSun ? "text-slate-900" : "text-white";
  const sub = isSun ? "text-slate-500" : "text-slate-400";
  const panel = isSun
    ? "bg-white border-slate-200/80"
    : "bg-slate-900/70 border-white/10";

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full max-w-md mx-auto rounded-3xl border ${panel} p-7 shadow-sm`}
    >
      <p className={`text-xs font-medium uppercase tracking-[0.18em] ${sub}`}>{greeting}</p>
      <h2 className={`text-2xl font-bold ${ink} font-[family-name:var(--font-nunito)] mt-0.5`}>
        {name}
      </h2>

      {/* Level ring */}
      <div className="flex items-center gap-6 mt-6">
        <div className="relative w-[180px] h-[180px] shrink-0">
          <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
            <circle cx="90" cy="90" r={r} fill="none" strokeWidth="10"
              className={isSun ? "stroke-slate-100" : "stroke-white/10"} />
            <motion.circle
              cx="90" cy="90" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
              className="stroke-violet-500"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c - pct * c }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-[11px] font-medium uppercase tracking-wider ${sub}`}>Level</span>
            <span className={`text-4xl font-black ${ink} font-[family-name:var(--font-nunito)] leading-none`}>
              {level}
            </span>
            <span className={`text-[11px] ${sub} mt-1`}>{xpIntoLevel}/1000 XP</span>
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex-1 flex flex-col gap-2.5">
          <StatChip icon={<Flame className="w-4 h-4 text-orange-500" strokeWidth={2} />}
            label="Streak" value={`${streak} ${streak === 1 ? "day" : "days"}`} isSun={isSun} ink={ink} sub={sub} />
          <StatChip icon={<Coins className="w-4 h-4 text-amber-500" strokeWidth={2} />}
            label="Gold" value={gold.toLocaleString()} isSun={isSun} ink={ink} sub={sub} />
        </div>
      </div>

      {/* Primary actions */}
      <div className="grid grid-cols-2 gap-3 mt-7">
        <button
          onClick={() => router.push("/focus")}
          className="group flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition-colors"
        >
          <span className="flex items-center gap-2"><Timer className="w-4 h-4" strokeWidth={2} /> Focus</span>
          <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <button
          onClick={() => router.push("/quiz")}
          className={`group flex items-center justify-between gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-colors border ${
            isSun
              ? "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
              : "bg-white/5 text-white border-white/10 hover:bg-white/10"
          }`}
        >
          <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4" strokeWidth={2} /> Trial</span>
          <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

function StatChip({
  icon, label, value, isSun, ink, sub,
}: {
  icon: React.ReactNode; label: string; value: string;
  isSun: boolean; ink: string; sub: string;
}) {
  return (
    <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl ${isSun ? "bg-slate-50" : "bg-white/5"}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSun ? "bg-white" : "bg-white/5"}`}>
        {icon}
      </div>
      <div className="leading-tight">
        <p className={`text-[11px] ${sub}`}>{label}</p>
        <p className={`text-sm font-bold ${ink}`}>{value}</p>
      </div>
    </div>
  );
}
