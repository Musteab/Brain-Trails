"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Flame, Star, Scroll, Timer, GraduationCap, Layers, PenTool, Coins } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useQuests } from "@/hooks/useQuests";
import OwlCompanion from "@/components/ui/OwlCompanion";

/**
 * Habitica-style "character sheet" - the dashboard hero. Avatar + three vitality
 * bars (streak / XP / today's quests) + the gold purse + the do-a-thing actions.
 */
function levelTitle(level: number): string {
  if (level >= 40) return "Archmage of Study";
  if (level >= 25) return "Grand Scholar";
  if (level >= 15) return "Adept";
  if (level >= 7) return "Scholar";
  if (level >= 3) return "Apprentice";
  return "Novice";
}

export default function CharacterCard() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const { quests } = useQuests();
  const isSun = theme === "sun";

  const name = profile?.display_name || profile?.username || "Traveler";
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak_days ?? 0;
  const gold = profile?.gold ?? 0;

  const xpIntoLevel = Math.max(0, xp - (level - 1) * 1000);
  const xpPct = Math.min(xpIntoLevel / 1000, 1) * 100;

  // Streak "vitality" - fills toward the next milestone (7 / 30 / 100).
  const tiers = [7, 30, 100];
  const nextTier = tiers.find((t) => streak < t) ?? 100;
  const prevTier = [0, ...tiers].filter((t) => t <= streak).pop() ?? 0;
  const streakPct = nextTier > prevTier ? ((streak - prevTier) / (nextTier - prevTier)) * 100 : 100;

  const doneToday = quests.filter((q) => q.period === "daily" && q.is_completed).length;
  const totalToday = quests.filter((q) => q.period === "daily").length;
  const questPct = totalToday > 0 ? (doneToday / totalToday) * 100 : 0;

  const card = isSun ? "bg-white border-slate-200" : "bg-slate-900/80 border-white/10";
  const ink = isSun ? "text-slate-900" : "text-white";
  const sub = isSun ? "text-slate-500" : "text-slate-400";
  const track = isSun ? "bg-slate-100" : "bg-white/10";

  const Bar = ({ icon, label, value, pct, from, to }: {
    icon: React.ReactNode; label: string; value: string; pct: number; from: string; to: string;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${sub}`}>{icon}{label}</span>
        <span className={`text-[11px] font-bold ${ink} tabular-nums`}>{value}</span>
      </div>
      <div className={`h-2.5 rounded-full overflow-hidden ${track}`}>
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${from} ${to}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pct, 3)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );

  const action = (label: string, icon: React.ReactNode, href: string, primary?: boolean) => (
    <button
      onClick={() => router.push(href)}
      className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-bold transition-colors ${
        primary
          ? "bg-violet-600 text-white hover:bg-violet-700"
          : isSun ? "bg-slate-50 text-slate-700 hover:bg-slate-100" : "bg-white/5 text-slate-200 hover:bg-white/10"
      }`}
    >
      <span className={primary ? "text-white" : "text-violet-500"}>{icon}</span>
      {label}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full rounded-3xl border ${card} p-5 sm:p-6 shadow-sm`}
    >
      {/* Identity row */}
      <div className="flex items-center gap-4">
        <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 ${isSun ? "bg-violet-50" : "bg-violet-500/10"}`}>
          <OwlCompanion mood={streak > 0 ? "celebrating" : "idle"} showName={false} className="w-[78px] h-[78px]" />
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold shadow">
            Lv {level}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className={`text-xl font-bold font-[family-name:var(--font-nunito)] truncate ${ink}`}>{name}</h2>
          <p className={`text-xs font-semibold ${sub}`}>{levelTitle(level)}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0 ${isSun ? "bg-amber-50" : "bg-amber-500/10"}`}>
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-amber-500 tabular-nums">{gold.toLocaleString()}</span>
        </div>
      </div>

      {/* Vitality bars */}
      <div className="grid sm:grid-cols-3 gap-3 mt-5">
        <Bar icon={<Flame className="w-3.5 h-3.5 text-rose-500" />} label="Streak" value={`${streak}d`} pct={streakPct} from="from-rose-500" to="to-orange-500" />
        <Bar icon={<Star className="w-3.5 h-3.5 text-amber-500" />} label="Level" value={`${xpIntoLevel}/1000`} pct={xpPct} from="from-amber-400" to="to-yellow-500" />
        <Bar icon={<Scroll className="w-3.5 h-3.5 text-violet-500" />} label="Dailies" value={`${doneToday}/${totalToday}`} pct={questPct} from="from-violet-500" to="to-fuchsia-500" />
      </div>

      {/* Do-a-thing actions */}
      <div className="grid grid-cols-4 gap-2 mt-5">
        {action("Focus", <Timer className="w-5 h-5" />, "/focus", true)}
        {action("Trial", <GraduationCap className="w-5 h-5" />, "/quiz")}
        {action("Review", <Layers className="w-5 h-5" />, "/flashcards")}
        {action("Write", <PenTool className="w-5 h-5" />, "/notes")}
      </div>
    </motion.div>
  );
}
