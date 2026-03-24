"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Lock,
  Star,
  Sword,
  Users,
  Compass,
  Flame,
  BookOpen,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useAchievements } from "@/hooks/useAchievements";
import WizardsDeskLayout from "@/components/layout/WizardsDeskLayout";
import type { Achievement } from "@/lib/database.types";

// ── Rarity colors ────────────────────────────────────────
const RARITY_COLORS: Record<Achievement["rarity"], { border: string; bg: string; text: string; glow: string }> = {
  common:    { border: "border-slate-400/50",  bg: "bg-slate-400/10",  text: "text-slate-400",  glow: "" },
  uncommon:  { border: "border-green-400/60",  bg: "bg-green-400/10",  text: "text-green-400",  glow: "shadow-green-400/20" },
  rare:      { border: "border-blue-400/60",   bg: "bg-blue-400/10",   text: "text-blue-400",   glow: "shadow-blue-400/20" },
  epic:      { border: "border-purple-400/60", bg: "bg-purple-400/10", text: "text-purple-400", glow: "shadow-purple-400/30" },
  legendary: { border: "border-amber-400/70",  bg: "bg-amber-400/15",  text: "text-amber-400",  glow: "shadow-amber-400/40" },
};

const RARITY_COLORS_SUN: Record<Achievement["rarity"], { border: string; bg: string; text: string; glow: string }> = {
  common:    { border: "border-slate-300",      bg: "bg-slate-100",      text: "text-slate-500",  glow: "" },
  uncommon:  { border: "border-green-400",      bg: "bg-green-50",       text: "text-green-600",  glow: "shadow-green-200/40" },
  rare:      { border: "border-blue-400",       bg: "bg-blue-50",        text: "text-blue-600",   glow: "shadow-blue-200/40" },
  epic:      { border: "border-purple-400",     bg: "bg-purple-50",      text: "text-purple-600", glow: "shadow-purple-200/40" },
  legendary: { border: "border-amber-400",      bg: "bg-amber-50",       text: "text-amber-600",  glow: "shadow-amber-200/50" },
};

// ── Category icons ───────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  study:       <BookOpen className="w-4 h-4" />,
  social:      <Users className="w-4 h-4" />,
  combat:      <Sword className="w-4 h-4" />,
  exploration: <Compass className="w-4 h-4" />,
  streak:      <Flame className="w-4 h-4" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  study:       "Study",
  social:      "Social",
  combat:      "Combat",
  exploration: "Exploration",
  streak:      "Streak",
};

// ── Achievement Card ─────────────────────────────────────
function AchievementCard({
  achievement,
  isUnlocked,
  unlockDate,
  isSun,
}: {
  achievement: Achievement;
  isUnlocked: boolean;
  unlockDate?: string;
  isSun: boolean;
}) {
  const rarityStyle = isSun
    ? RARITY_COLORS_SUN[achievement.rarity]
    : RARITY_COLORS[achievement.rarity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`
        relative rounded-2xl border-2 p-4 transition-all duration-200
        ${rarityStyle.border} ${rarityStyle.bg}
        ${rarityStyle.glow ? `shadow-lg ${rarityStyle.glow}` : ""}
        ${!isUnlocked ? "grayscale opacity-60" : ""}
      `}
    >
      {/* Rarity badge */}
      <div className="flex items-center justify-between mb-3">
        <div
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center text-lg
            ${isUnlocked
              ? isSun
                ? "bg-white/80 shadow-sm"
                : "bg-white/10"
              : isSun
                ? "bg-slate-200/80"
                : "bg-white/5"
            }
          `}
        >
          {isUnlocked ? (
            <span className="drop-shadow-sm">{CATEGORY_ICONS[achievement.category] || <Star className="w-5 h-5" />}</span>
          ) : (
            <Lock className={`w-5 h-5 ${isSun ? "text-slate-400" : "text-slate-500"}`} />
          )}
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${rarityStyle.text} ${rarityStyle.bg}`}
        >
          {achievement.rarity}
        </span>
      </div>

      {/* Name & description */}
      <h3
        className={`text-sm font-bold font-[family-name:var(--font-nunito)] mb-1 ${
          isSun ? "text-slate-800" : "text-white"
        }`}
      >
        {isUnlocked ? achievement.name : "???"}
      </h3>
      <p
        className={`text-xs leading-relaxed mb-3 ${
          isSun ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {isUnlocked ? achievement.description : "Complete challenges to unlock this achievement."}
      </p>

      {/* Rewards */}
      <div className="flex items-center gap-3 text-xs">
        <span className={`flex items-center gap-1 font-bold ${isSun ? "text-purple-600" : "text-purple-400"}`}>
          <Sparkles className="w-3 h-3" /> +{achievement.xp_reward} XP
        </span>
        <span className={`flex items-center gap-1 font-bold ${isSun ? "text-amber-600" : "text-amber-400"}`}>
          <Star className="w-3 h-3" /> +{achievement.gold_reward} Gold
        </span>
      </div>

      {/* Unlock date */}
      {isUnlocked && unlockDate && (
        <p className={`text-[10px] mt-2 ${isSun ? "text-slate-400" : "text-slate-500"}`}>
          Unlocked {new Date(unlockDate).toLocaleDateString()}
        </p>
      )}
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────
export default function AchievementsPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { isSun, card, muted } = useCardStyles();
  const { achievements, userAchievements, checkAchievements, isLoading } = useAchievements();

  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Check on mount
  useEffect(() => {
    if (!isLoading && achievements.length > 0) {
      checkAchievements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Build lookup of unlocked achievements
  const unlockedMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ua of userAchievements) {
      map.set(ua.achievement_id, ua.unlocked_at);
    }
    return map;
  }, [userAchievements]);

  // Stats
  const totalAchievements = achievements.length;
  const unlockedCount = userAchievements.length;
  const totalXpEarned = useMemo(
    () =>
      achievements
        .filter((a) => unlockedMap.has(a.id))
        .reduce((sum, a) => sum + a.xp_reward, 0),
    [achievements, unlockedMap]
  );

  // Categories
  const categories = useMemo(() => {
    const cats = new Set(achievements.map((a) => a.category));
    return ["all", ...Array.from(cats)];
  }, [achievements]);

  // Filter
  const filteredAchievements = useMemo(
    () =>
      activeCategory === "all"
        ? achievements
        : achievements.filter((a) => a.category === activeCategory),
    [achievements, activeCategory]
  );

  // Loading state
  if (authLoading || isLoading) {
    return (
      <WizardsDeskLayout showPlaque={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-4xl animate-bounce">🏆</div>
        </div>
      </WizardsDeskLayout>
    );
  }

  return (
    <WizardsDeskLayout showPlaque={false}>
      <div className="min-h-screen pb-28 pt-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/")}
              className={`p-2 rounded-xl backdrop-blur-sm border ${
                isSun
                  ? "bg-white/70 border-slate-200 text-slate-600"
                  : "bg-white/10 border-white/20 text-white"
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1
                className={`text-2xl font-bold font-[family-name:var(--font-nunito)] ${
                  isSun ? "text-slate-800" : "text-white"
                }`}
              >
                Achievements
              </h1>
              <p className={`text-xs ${muted}`}>
                Your journey so far
              </p>
            </div>
          </motion.div>

          {/* Stats summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${card} p-5 mb-6`}
          >
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className={`w-5 h-5 ${isSun ? "text-amber-600" : "text-amber-400"}`} />
                </div>
                <p
                  className={`text-2xl font-bold font-[family-name:var(--font-nunito)] ${
                    isSun ? "text-slate-800" : "text-white"
                  }`}
                >
                  {unlockedCount}
                  <span className={`text-sm font-normal ${muted}`}>
                    /{totalAchievements}
                  </span>
                </p>
                <p className={`text-xs ${muted}`}>Unlocked</p>
              </div>

              <div className={`w-px h-10 ${isSun ? "bg-slate-200" : "bg-white/10"}`} />

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Sparkles className={`w-5 h-5 ${isSun ? "text-purple-600" : "text-purple-400"}`} />
                </div>
                <p
                  className={`text-2xl font-bold font-[family-name:var(--font-nunito)] ${
                    isSun ? "text-slate-800" : "text-white"
                  }`}
                >
                  {totalXpEarned.toLocaleString()}
                </p>
                <p className={`text-xs ${muted}`}>XP Earned</p>
              </div>

              <div className={`w-px h-10 ${isSun ? "bg-slate-200" : "bg-white/10"}`} />

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className={`w-5 h-5 ${isSun ? "text-emerald-600" : "text-emerald-400"}`} />
                </div>
                <p
                  className={`text-2xl font-bold font-[family-name:var(--font-nunito)] ${
                    isSun ? "text-slate-800" : "text-white"
                  }`}
                >
                  {totalAchievements > 0
                    ? Math.round((unlockedCount / totalAchievements) * 100)
                    : 0}
                  %
                </p>
                <p className={`text-xs ${muted}`}>Complete</p>
              </div>
            </div>
          </motion.div>

          {/* Category tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide"
          >
            {categories.map((cat) => (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors
                  ${activeCategory === cat
                    ? isSun
                      ? "bg-purple-500 text-white shadow-md"
                      : "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                    : isSun
                      ? "bg-white/70 text-slate-600 hover:bg-white/90 border border-slate-200"
                      : "bg-white/10 text-slate-400 hover:bg-white/20 border border-white/10"
                  }
                `}
              >
                {cat !== "all" && CATEGORY_ICONS[cat]}
                {cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
              </motion.button>
            ))}
          </motion.div>

          {/* Achievement grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredAchievements.map((achievement, i) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <AchievementCard
                    achievement={achievement}
                    isUnlocked={unlockedMap.has(achievement.id)}
                    unlockDate={unlockedMap.get(achievement.id)}
                    isSun={isSun}
                  />
                </motion.div>
              ))}

              {filteredAchievements.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Trophy className={`w-12 h-12 mx-auto mb-3 ${muted}`} />
                  <p className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${muted}`}>
                    No achievements in this category yet.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </WizardsDeskLayout>
  );
}
