import { create } from "zustand";
import { supabase } from "@/lib/supabase";

interface GameStats {
  xp: number;
  level: number;
  gold: number;
  streakDays: number;
}

interface GameStoreState extends GameStats {
  /** Whether stats have been loaded from the database */
  isLoaded: boolean;
  /** Load stats from the user profile */
  loadStats: (userId: string) => Promise<void>;
  /** Award XP and recalculate level. Persists to Supabase. */
  awardXp: (userId: string, amount: number) => Promise<void>;
  /** Award gold. Persists to Supabase. */
  awardGold: (userId: string, amount: number) => Promise<void>;
  /** Log an activity to adventure_log */
  logActivity: (
    userId: string,
    activityType: "focus" | "flashcard" | "note" | "quest" | "login",
    xpEarned: number,
    metadata?: Record<string, unknown>
  ) => Promise<void>;
  /** Reset store (on logout) */
  reset: () => void;
}

const INITIAL_STATE: GameStats & { isLoaded: boolean } = {
  xp: 0,
  level: 1,
  gold: 0,
  streakDays: 0,
  isLoaded: false,
};

/**
 * Calculate level from total XP.
 * Every 1000 XP = 1 level, minimum level 1.
 */
function calculateLevel(xp: number): number {
  return Math.max(1, Math.floor(xp / 1000) + 1);
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  ...INITIAL_STATE,

  loadStats: async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("xp, level, gold, streak_days")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      set({
        xp: data.xp ?? 0,
        level: data.level ?? 1,
        gold: data.gold ?? 0,
        streakDays: data.streak_days ?? 0,
        isLoaded: true,
      });
    }
  },

  awardXp: async (userId: string, amount: number) => {
    const newXp = get().xp + amount;
    const newLevel = calculateLevel(newXp);

    set({ xp: newXp, level: newLevel });

    await supabase
      .from("profiles")
      .update({ xp: newXp, level: newLevel })
      .eq("id", userId);
  },

  awardGold: async (userId: string, amount: number) => {
    const newGold = get().gold + amount;
    set({ gold: newGold });

    await supabase
      .from("profiles")
      .update({ gold: newGold })
      .eq("id", userId);
  },

  logActivity: async (userId, activityType, xpEarned, metadata) => {
    await supabase.from("adventure_log").insert({
      user_id: userId,
      activity_type: activityType,
      xp_earned: xpEarned,
      metadata: metadata ?? {},
    });
  },

  reset: () => set(INITIAL_STATE),
}));
