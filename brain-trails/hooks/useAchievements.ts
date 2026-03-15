"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useGameStore, useUIStore } from "@/stores";
import type { Achievement, UserAchievement } from "@/lib/database.types";

interface UseAchievementsReturn {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  checkAchievements: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook for fetching, tracking, and unlocking achievements.
 *
 * On mount it loads all achievements and the current user's unlocked set.
 * `checkAchievements()` queries the user's aggregate stats, compares each
 * achievement condition, and auto-unlocks any that are newly met.
 */
export function useAchievements(): UseAchievementsReturn {
  const { user } = useAuth();
  const { awardXp, awardGold, logActivity } = useGameStore();
  const { addToast } = useUIStore();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Fetch all achievements + user's unlocked achievements ───────────
  const fetchData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [achievementsRes, userAchievementsRes] = await Promise.all([
      supabase.from("achievements").select("*"),
      supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id),
    ]);

    if (achievementsRes.data) setAchievements(achievementsRes.data);
    if (userAchievementsRes.data) setUserAchievements(userAchievementsRes.data);

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Gather user stats from various tables ───────────────────────────
  const gatherUserStats = useCallback(async (): Promise<Record<string, number>> => {
    if (!user) return {};

    const [
      notesRes,
      focusRes,
      cardsRes,
      profileRes,
      bossRes,
      guildsCreatedRes,
      guildMemberRes,
      raidContribRes,
    ] = await Promise.all([
      // notes_created
      supabase
        .from("notes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      // focus_sessions (count + total minutes)
      supabase
        .from("focus_sessions")
        .select("duration_minutes")
        .eq("user_id", user.id),
      // cards_reviewed (sum of review_count across user's decks)
      supabase
        .from("cards")
        .select("review_count, decks!inner(user_id)")
        .eq("decks.user_id", user.id),
      // profile (streak_days, level)
      supabase
        .from("profiles")
        .select("streak_days, level")
        .eq("id", user.id)
        .maybeSingle(),
      // bosses_defeated
      supabase
        .from("boss_battles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("result", "victory"),
      // guilds_created
      supabase
        .from("guilds")
        .select("id", { count: "exact", head: true })
        .eq("leader_id", user.id),
      // guilds_joined
      supabase
        .from("guild_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      // raids_contributed
      supabase
        .from("guild_raid_contributions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    const notesCreated = notesRes.count ?? 0;
    const focusSessions = focusRes.data?.length ?? 0;
    const totalFocusHours =
      (focusRes.data?.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) ?? 0) / 60;
    const cardsReviewed =
      cardsRes.data?.reduce((sum, c) => sum + (c.review_count ?? 0), 0) ?? 0;
    const streakDays = profileRes.data?.streak_days ?? 0;
    const levelReached = profileRes.data?.level ?? 1;
    const bossesDefeated = bossRes.count ?? 0;
    const guildsCreated = guildsCreatedRes.count ?? 0;
    const guildsJoined = guildMemberRes.count ?? 0;
    const raidsContributed = raidContribRes.count ?? 0;

    return {
      notes_created: notesCreated,
      focus_sessions: focusSessions,
      cards_reviewed: cardsReviewed,
      streak_days: streakDays,
      bosses_defeated: bossesDefeated,
      guilds_created: guildsCreated,
      guilds_joined: guildsJoined,
      raids_contributed: raidsContributed,
      level_reached: levelReached,
      total_focus_hours: Math.floor(totalFocusHours),
    };
  }, [user]);

  // ── Check & unlock achievements ─────────────────────────────────────
  const checkAchievements = useCallback(async () => {
    if (!user || achievements.length === 0) return;

    const stats = await gatherUserStats();
    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
    const newlyUnlocked: UserAchievement[] = [];

    for (const achievement of achievements) {
      // Skip already unlocked
      if (unlockedIds.has(achievement.id)) continue;

      const userValue = stats[achievement.condition_type] ?? 0;
      if (userValue < achievement.condition_value) continue;

      // Achievement condition met — unlock it
      const { data, error } = await supabase
        .from("user_achievements")
        .insert({
          user_id: user.id,
          achievement_id: achievement.id,
        })
        .select()
        .single();

      if (error) {
        // Likely a duplicate — skip
        console.warn("[useAchievements] insert error:", error.message);
        continue;
      }

      if (data) newlyUnlocked.push(data);

      // Award XP & Gold
      if (achievement.xp_reward > 0) {
        await awardXp(user.id, achievement.xp_reward);
      }
      if (achievement.gold_reward > 0) {
        await awardGold(user.id, achievement.gold_reward);
      }

      // Log to adventure_log
      await logActivity(user.id, "achievement", achievement.xp_reward, {
        achievement_id: achievement.id,
        achievement_name: achievement.name,
        gold_earned: achievement.gold_reward,
      });

      // Toast notification
      addToast(
        `Achievement Unlocked: ${achievement.name}! +${achievement.xp_reward} XP, +${achievement.gold_reward} Gold`,
        "success"
      );
    }

    // Update local state with newly unlocked
    if (newlyUnlocked.length > 0) {
      setUserAchievements((prev) => [...prev, ...newlyUnlocked]);
    }
  }, [user, achievements, userAchievements, gatherUserStats, awardXp, awardGold, logActivity, addToast]);

  return {
    achievements,
    userAchievements,
    checkAchievements,
    isLoading,
  };
}
