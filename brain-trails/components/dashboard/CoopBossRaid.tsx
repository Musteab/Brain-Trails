"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Swords, Trophy, Rocket, BookOpen } from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useAuth } from "@/context/AuthContext";
import { BOSSES, type Boss } from "@/lib/bosses";
import { supabase } from "@/lib/supabase";

interface RecentBattle {
  boss_id: string;
  result: "victory" | "defeat";
  cards_correct: number;
  cards_answered: number;
  xp_earned: number;
  completed_at: string;
}

/**
 * CoopBossRaid — Dashboard widget showing the user's latest boss battle
 * result and a link to fight again.
 *
 * Falls back to a "Start your first battle" prompt if no battles exist.
 */
export default function CoopBossRaid() {
  const { card, isSun } = useCardStyles();
  const { user } = useAuth();
  const [lastBattle, setLastBattle] = useState<RecentBattle | null>(null);
  const [boss, setBoss] = useState<Boss | null>(null);
  const [isLoading, setIsLoading] = useState(!!user);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetchLatest() {
      const { data, error } = await (supabase.from("boss_battles") as any)
        .select("boss_id, result, cards_correct, cards_answered, xp_earned, completed_at")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (!error && data) {
        setLastBattle(data as RecentBattle);
        const found = BOSSES.find((b) => b.id === data.boss_id);
        setBoss(found || null);
      }
      setIsLoading(false);
    }

    fetchLatest();

    return () => { cancelled = true; };
  }, [user]);

  // ── No battle history — first-time prompt ─────────────

  if (!isLoading && !lastBattle) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${card} p-6`}
      >
        <div
          className={`rounded-xl p-4 mb-4 border ${
            isSun
              ? "bg-red-50 border-red-200"
              : "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-400/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 relative">
                <Image src="/assets/icons/sword.png" alt="Boss Battle" width={32} height={32} className="object-contain" />
              </div>
              <div>
                <h3
                  className={`text-base font-bold font-[family-name:var(--font-nunito)] ${
                    isSun ? "text-red-700" : "text-red-400"
                  }`}
                >
                  Boss Battle
                </h3>
                <p
                  className={`text-xs font-[family-name:var(--font-quicksand)] ${
                    isSun ? "text-red-600" : "text-red-300"
                  }`}
                >
                  Knowledge Challenge
                </p>
              </div>
            </div>
            {/* Coming Soon Badge */}
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isSun
                ? "bg-amber-100 text-amber-700 border border-amber-200"
                : "bg-amber-400/15 text-amber-400 border border-amber-400/30"
            }`}>
              <Rocket className="w-3 h-3" />
              Co-op Coming Soon
            </div>
          </div>
        </div>

        <p className={`text-sm mb-4 ${isSun ? "text-slate-600" : "text-slate-300"}`}>
          Test your knowledge by battling bosses with flashcards or quizzes!
        </p>

        <div className="flex gap-2">
          <Link href="/battle" className="flex-1">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`block w-full py-2.5 text-center text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-[family-name:var(--font-quicksand)] ${
                isSun
                  ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 border border-red-400"
                  : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-400"
              }`}
            >
              <Swords className="w-4 h-4 inline mr-1.5" />
              Flashcard Battle
            </motion.span>
          </Link>
          <Link href="/quiz" className="flex-1">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`block w-full py-2.5 text-center font-bold text-sm rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-[family-name:var(--font-quicksand)] ${
                isSun
                  ? "bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white border border-violet-400"
                  : "bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white border border-violet-400"
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-1.5" />
              Quiz Battle
            </motion.span>
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── Loading state ─────────────────────────────────────

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${card} p-6`}
      >
        <div className="animate-pulse space-y-3">
          <div className={`h-16 rounded-xl ${isSun ? "bg-slate-200" : "bg-white/10"}`} />
          <div className={`h-4 rounded w-2/3 ${isSun ? "bg-slate-200" : "bg-white/10"}`} />
          <div className={`h-10 rounded-xl ${isSun ? "bg-slate-200" : "bg-white/10"}`} />
        </div>
      </motion.div>
    );
  }

  // ── Has battle history ────────────────────────────────

  const isVictory = lastBattle?.result === "victory";
  const accuracy =
    lastBattle && lastBattle.cards_answered > 0
      ? Math.round((lastBattle.cards_correct / lastBattle.cards_answered) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`${card} p-6`}
    >
      {/* Header banner */}
      <div
        className={`rounded-xl p-4 mb-4 border ${
          isSun
            ? "bg-red-50 border-red-200"
            : "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-400/30"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {boss ? (
              <Image src={boss.icon} alt={boss.name} width={32} height={32} className="object-contain" />
            ) : (
              <div className="w-8 h-8 relative">
                <Image src="/assets/icons/sword.png" alt="Boss Battle" width={32} height={32} className="object-contain" />
              </div>
            )}
            <div>
              <h3
                className={`text-base font-bold font-[family-name:var(--font-nunito)] ${
                  isSun ? "text-red-700" : "text-red-400"
                }`}
              >
                Boss Battle
              </h3>
              <p
                className={`text-xs font-[family-name:var(--font-quicksand)] ${
                  isSun ? "text-red-600" : "text-red-300"
                }`}
              >
                {boss ? `Last: ${boss.name}` : "Knowledge Challenge"}
              </p>
            </div>
          </div>
          {/* Coming Soon Badge */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isSun
              ? "bg-amber-100 text-amber-700 border border-amber-200"
              : "bg-amber-400/15 text-amber-400 border border-amber-400/30"
          }`}>
            <Rocket className="w-3 h-3" />
            Co-op Coming Soon
          </div>
        </div>
      </div>

      {/* Last battle result */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-sm font-bold font-[family-name:var(--font-quicksand)] flex items-center gap-1.5 ${
              isVictory
                ? isSun
                  ? "text-amber-700"
                  : "text-amber-400"
                : isSun
                  ? "text-red-700"
                  : "text-red-400"
            }`}
          >
            {isVictory ? <Trophy className="w-4 h-4" /> : <Swords className="w-4 h-4" />}
            {isVictory ? "Victory!" : "Defeated"}
          </span>
          <span className={`text-xs font-semibold font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-500" : "text-slate-300"}`}>
            {accuracy}% accuracy
          </span>
        </div>

        {/* Accuracy bar */}
        <div
          className={`h-3 rounded-full overflow-hidden border ${
            isSun ? "bg-slate-100 border-slate-300" : "bg-white/10 border-white/10"
          }`}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${accuracy}%` }}
            transition={{ delay: 0.5, duration: 1 }}
            className={`h-full rounded-full ${
              isVictory
                ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                : "bg-gradient-to-r from-red-500 to-red-600"
            }`}
          />
        </div>
      </div>

      {/* Stats row */}
      <div
        className={`flex items-center justify-between text-xs mb-4 font-[family-name:var(--font-quicksand)] ${
          isSun ? "text-slate-600" : "text-slate-300"
        }`}
      >
        <span>
          {lastBattle?.cards_correct}/{lastBattle?.cards_answered} correct
        </span>
        {isVictory && lastBattle?.xp_earned ? (
          <span className={isSun ? "text-amber-600" : "text-amber-400"}>
            +{lastBattle.xp_earned} XP
          </span>
        ) : (
          <span className={isSun ? "text-slate-500" : "text-slate-300"}>No XP</span>
        )}
      </div>

      {/* Action buttons — Flashcard + Quiz */}
      <div className="flex gap-2">
        <Link href="/battle" className="flex-1">
          <motion.span
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`block w-full py-2.5 text-center text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-[family-name:var(--font-quicksand)] ${
              isSun
                ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 border border-red-400"
                : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border border-red-400"
            }`}
          >
            <Swords className="w-4 h-4 inline mr-1.5" />
            Fight a Boss
          </motion.span>
        </Link>
        <Link href="/quiz" className="flex-1">
          <motion.span
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`block w-full py-2.5 text-center font-bold text-sm rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-[family-name:var(--font-quicksand)] ${
              isSun
                ? "bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white border border-violet-400"
                : "bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white border border-violet-400"
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-1.5" />
            Quiz Battle
          </motion.span>
        </Link>
      </div>
    </motion.div>
  );
}
