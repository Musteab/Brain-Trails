"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface Quest {
  id: string;
  quest_type: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  xp_reward: number;
  gold_reward: number;
  period: "daily" | "weekly" | "monthly";
  is_completed: boolean;
  generated_at: string;
  expires_at: string;
}

// NOTE on units: `focus` quests are always measured in MINUTES, every other
// quest_type is measured in a simple COUNT (cards reviewed, quizzes passed,
// words written, bosses defeated). Keeping one unit per quest_type lets
// reportQuestProgress increment unambiguously.
const DAILY_QUEST_TEMPLATES = [
  { quest_type: "focus", title: "Campfire Session", description: "Study for 25 minutes in Mana Garden", target_value: 25, xp_reward: 50, gold_reward: 15 },
  { quest_type: "focus", title: "Power Hour", description: "Log 50 minutes of focused study", target_value: 50, xp_reward: 75, gold_reward: 20 },
  { quest_type: "flashcard", title: "Card Sharpener", description: "Review 15 spell cards", target_value: 15, xp_reward: 40, gold_reward: 10 },
  { quest_type: "flashcard", title: "Deck Master", description: "Review 30 spell cards", target_value: 30, xp_reward: 80, gold_reward: 25 },
  { quest_type: "quiz", title: "Trial by Fire", description: "Complete a quiz with 70%+ score", target_value: 1, xp_reward: 60, gold_reward: 20 },
  { quest_type: "writing", title: "Scribe's Work", description: "Write 200 words in your spellbook", target_value: 200, xp_reward: 45, gold_reward: 12 },
  { quest_type: "boss", title: "Boss Slayer", description: "Defeat a boss in battle", target_value: 1, xp_reward: 100, gold_reward: 30 },
];

const WEEKLY_TEMPLATES = [
  { quest_type: "focus", title: "Weekly Scholar", description: "Study for 3 hours total this week", target_value: 180, xp_reward: 200, gold_reward: 60 },
  { quest_type: "flashcard", title: "Card Collector", description: "Review 100 cards this week", target_value: 100, xp_reward: 150, gold_reward: 50 },
];

const MONTHLY_TEMPLATES = [
  { quest_type: "focus", title: "Monthly Marathon", description: "Study for 15 hours this month", target_value: 900, xp_reward: 500, gold_reward: 150 },
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getExpiry(period: "daily" | "weekly" | "monthly"): string {
  const now = new Date();
  if (period === "daily") {
    const expiry = new Date(now);
    expiry.setHours(23, 59, 59, 999);
    return expiry.toISOString();
  }
  if (period === "weekly") {
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + (7 - expiry.getDay()));
    expiry.setHours(23, 59, 59, 999);
    return expiry.toISOString();
  }
  const expiry = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  expiry.setHours(23, 59, 59, 999);
  return expiry.toISOString();
}

export function useQuests() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  const fetchQuests = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("daily_quests")
      .select("*")
      .eq("user_id", user.id)
      .gte("expires_at", new Date().toISOString())
      .order("period", { ascending: true });

    if (error) {
      console.error("[useQuests] fetch failed:", error);
      setIsLoading(false);
      return;
    }

    const active = (data ?? []) as unknown as Quest[];

    // Regenerate each period independently so an active weekly/monthly quest
    // doesn't block the daily refresh (the original bug).
    const hasPeriod = (p: Quest["period"]) => active.some(q => q.period === p);
    const toGenerate: Array<Record<string, unknown>> = [];

    if (!hasPeriod("daily")) {
      toGenerate.push(...pickRandom(DAILY_QUEST_TEMPLATES, 3).map(t => ({
        ...t, period: "daily" as const, user_id: user.id, expires_at: getExpiry("daily"),
      })));
    }
    if (!hasPeriod("weekly")) {
      toGenerate.push(...pickRandom(WEEKLY_TEMPLATES, 1).map(t => ({
        ...t, period: "weekly" as const, user_id: user.id, expires_at: getExpiry("weekly"),
      })));
    }
    if (!hasPeriod("monthly")) {
      toGenerate.push(...pickRandom(MONTHLY_TEMPLATES, 1).map(t => ({
        ...t, period: "monthly" as const, user_id: user.id, expires_at: getExpiry("monthly"),
      })));
    }

    if (toGenerate.length > 0) {
      const { data: inserted, error: genErr } = await supabase
        .from("daily_quests")
        .insert(toGenerate as never)
        .select("*");
      if (genErr) {
        console.error("[useQuests] generation failed:", genErr);
      } else if (inserted) {
        active.push(...(inserted as unknown as Quest[]));
      }
    }

    setQuests(active);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: fetch and set state on mount
      fetchQuests();
    }

    // Refetch when any study action reports quest progress (fired by the
    // game store's reportQuestProgress).
    const onUpdated = () => { fetchQuests(); };
    window.addEventListener("quests-updated", onUpdated);
    return () => window.removeEventListener("quests-updated", onUpdated);
  }, [fetchQuests]);

  return { quests, isLoading, refreshQuests: fetchQuests };
}
