import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Json } from "@/lib/database.types";

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
    activityType: "focus" | "flashcard" | "note" | "quest" | "login" | "boss" | "guild" | "achievement" | "streak",
    xpEarned: number,
    metadata?: Record<string, Json>
  ) => Promise<void>;
  /**
   * Report progress toward active quests of a given type. Increments matching
   * (non-expired, incomplete) quests and, when one is completed, awards its
   * xp_reward + gold_reward exactly once. Notifies the quest UI to refresh.
   */
  reportQuestProgress: (
    userId: string,
    questType: "focus" | "flashcard" | "quiz" | "writing" | "boss",
    amount: number
  ) => Promise<void>;
  /** Subscribe to real-time changes for stats */
  subscribeToStats: (userId: string) => () => void;
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
    const { data, error } = await (supabase.from("profiles") as any)
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
    // Optimistic UI update
    const currentXp = get().xp;
    const newXp = currentXp + amount;
    const newLevel = calculateLevel(newXp);
    set({ xp: newXp, level: newLevel });

    // Try atomic RPC first (requires migration 00014)
    const { error: rpcError } = await (supabase.rpc as any)("increment_xp", {
      user_id: userId,
      xp_amount: amount,
    });

    if (rpcError) {
      console.warn("RPC increment_xp failed, falling back to read-then-write", rpcError);
      // Fallback: fetch latest to minimize race condition window
      const { data } = await (supabase.from("profiles") as any).select("xp").eq("id", userId).single();
      if (data) {
        const trueNewXp = data.xp + amount;
        const trueNewLevel = calculateLevel(trueNewXp);
        await (supabase.from("profiles") as any)
          .update({ xp: trueNewXp, level: trueNewLevel })
          .eq("id", userId);
      }
    }
  },

  awardGold: async (userId: string, amount: number) => {
    // Optimistic UI update
    const currentGold = get().gold;
    set({ gold: currentGold + amount });

    // Try atomic RPC first
    const { error: rpcError } = await (supabase.rpc as any)("increment_gold", {
      user_id: userId,
      gold_amount: amount,
    });

    if (rpcError) {
      console.warn("RPC increment_gold failed, falling back to read-then-write", rpcError);
      // Fallback: fetch latest to minimize race condition window
      const { data } = await (supabase.from("profiles") as any).select("gold").eq("id", userId).single();
      if (data) {
        await (supabase.from("profiles") as any)
          .update({ gold: data.gold + amount })
          .eq("id", userId);
      }
    }
  },

  logActivity: async (userId, activityType, xpEarned, metadata) => {
    await (supabase.from("adventure_log") as any).insert({
      user_id: userId,
      activity_type: activityType,
      xp_earned: xpEarned,
      metadata: metadata ?? {},
    });
  },

  reportQuestProgress: async (userId, questType, amount) => {
    if (amount <= 0) return;

    // Fetch active, incomplete quests of this type.
    const { data: quests, error } = await supabase
      .from("daily_quests")
      .select("id, current_value, target_value, xp_reward, gold_reward, title")
      .eq("user_id", userId)
      .eq("quest_type", questType)
      .eq("is_completed", false)
      .gte("expires_at", new Date().toISOString());

    if (error || !quests || quests.length === 0) return;

    let anyChange = false;

    for (const quest of quests) {
      const newValue = Math.min(quest.current_value + amount, quest.target_value);
      if (newValue === quest.current_value) continue; // no progress (already capped)

      const completed = newValue >= quest.target_value;

      // Conditional update guarded on is_completed=false makes the reward
      // payout idempotent: only the call that flips it to complete gets a row back.
      const { data: updated } = await supabase
        .from("daily_quests")
        .update({ current_value: newValue, is_completed: completed })
        .eq("id", quest.id)
        .eq("is_completed", false)
        .select("id, is_completed")
        .maybeSingle();

      if (!updated) continue;
      anyChange = true;

      if (updated.is_completed) {
        // Pay out the quest reward exactly once.
        if (quest.xp_reward > 0) await get().awardXp(userId, quest.xp_reward);
        if (quest.gold_reward > 0) await get().awardGold(userId, quest.gold_reward);
        await get().logActivity(userId, "quest", quest.xp_reward, {
          quest_id: quest.id,
          quest_title: quest.title,
          gold_earned: quest.gold_reward,
        });
      }
    }

    // Tell any mounted QuestLog to refetch.
    if (anyChange && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("quests-updated"));
    }
  },

  subscribeToStats: (userId: string) => {
    const channel = supabase
      .channel(`profile-stats-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { xp: number; level: number; gold: number; streak_days: number };
          set({
            xp: row.xp ?? 0,
            level: row.level ?? 1,
            gold: row.gold ?? 0,
            streakDays: row.streak_days ?? 0,
          });
        }
      )
      .subscribe();

    // Return the cleanup function so callers can unsubscribe
    return () => {
      supabase.removeChannel(channel);
    };
  },

  reset: () => set(INITIAL_STATE),
}));
