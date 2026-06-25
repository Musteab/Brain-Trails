"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

/**
 * The subset of user_settings that we manage.
 * Mirrors the `user_settings` table, minus `user_id` and `updated_at`.
 */
export interface UserSettings {
  theme: "sun" | "moon";
  focus_duration: number; // minutes
  break_duration: number; // minutes
  sound_enabled: boolean;
  notifications_enabled: boolean;
  streak_reminders: boolean;
  guild_notifications: boolean;
  study_nudges: boolean;
  cram_mode_enabled: boolean;
  ambient_sound: "none" | "rain" | "cafe" | "forest" | "lofi";
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: "moon",
  focus_duration: 25,
  break_duration: 5,
  sound_enabled: true,
  notifications_enabled: true,
  streak_reminders: true,
  guild_notifications: true,
  study_nudges: true,
  cram_mode_enabled: false,
  ambient_sound: "none",
};

/**
 * Hook to load and persist user settings from Supabase.
 *
 * - Loads on mount (when user is authenticated).
 * - Exposes an `update` function that merges partial changes,
 *   updates local state immediately, and debounce-saves to Supabase.
 * - Any component can call `useSettings()` to read the current values
 *   and stay in sync (the hook returns the latest state).
 *
 * NOTE: This is a per-component hook (each consumer has its own state).
 * For cross-component reactivity, we store the canonical values in a
 * module-level cache so that multiple hook instances share the same data.
 */

// ---- Module-level cache so all hook instances share state ----
let cachedSettings: UserSettings = { ...DEFAULT_SETTINGS };
let cacheLoaded = false;
const listeners = new Set<(s: UserSettings) => void>();

function notifyListeners(s: UserSettings) {
  cachedSettings = s;
  listeners.forEach((fn) => fn(s));
}

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(cachedSettings);
  const [isLoading, setIsLoading] = useState(!cacheLoaded);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to module-level updates
  useEffect(() => {
    const handler = (s: UserSettings) => setSettings(s);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  // Load settings from Supabase on mount
  const load = useCallback(async () => {
    if (!user) return;

    // If already cached for this session, skip fetch
    if (cacheLoaded) {
      setSettings(cachedSettings);
      setIsLoading(false);
      return;
    }

    const { data, error } = await (supabase.from("user_settings") as any)
      .select("theme, focus_duration, break_duration, sound_enabled, notifications_enabled, streak_reminders, guild_notifications, study_nudges, cram_mode_enabled, ambient_sound")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[useSettings] load failed:", error);
    }

    const loaded: UserSettings = {
      theme: (data?.theme === "sun" ? "sun" : "moon"),
      focus_duration: data?.focus_duration ?? DEFAULT_SETTINGS.focus_duration,
      break_duration: data?.break_duration ?? DEFAULT_SETTINGS.break_duration,
      sound_enabled: data?.sound_enabled ?? DEFAULT_SETTINGS.sound_enabled,
      notifications_enabled: data?.notifications_enabled ?? DEFAULT_SETTINGS.notifications_enabled,
      streak_reminders: data?.streak_reminders ?? DEFAULT_SETTINGS.streak_reminders,
      guild_notifications: data?.guild_notifications ?? DEFAULT_SETTINGS.guild_notifications,
      study_nudges: data?.study_nudges ?? DEFAULT_SETTINGS.study_nudges,
      cram_mode_enabled: data?.cram_mode_enabled ?? DEFAULT_SETTINGS.cram_mode_enabled,
      ambient_sound: data?.ambient_sound ?? DEFAULT_SETTINGS.ambient_sound,
    };

    cacheLoaded = true;
    notifyListeners(loaded);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: fetch user settings from Supabase on mount
    load();
  }, [load]);

  // Persist to Supabase (debounced)
  const persist = useCallback(
    (next: UserSettings) => {
      if (!user) return;

      // Clear previous pending save
      if (debounceRef.current) clearTimeout(debounceRef.current);

      setSaveStatus("saving");
      debounceRef.current = setTimeout(async () => {
        const { error } = await (supabase.from("user_settings") as any)
          .upsert(
            {
              user_id: user.id,
              theme: next.theme,
              focus_duration: next.focus_duration,
              break_duration: next.break_duration,
              sound_enabled: next.sound_enabled,
              notifications_enabled: next.notifications_enabled,
              streak_reminders: next.streak_reminders,
              guild_notifications: next.guild_notifications,
              study_nudges: next.study_nudges,
              cram_mode_enabled: next.cram_mode_enabled,
              ambient_sound: next.ambient_sound,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (error) {
          console.error("[useSettings] save failed:", error);
          setSaveStatus("error");
        } else {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 1500);
        }
      }, 800); // 800ms debounce
    },
    [user]
  );

  /**
   * Update one or more settings. Immediately updates local state,
   * debounce-saves to Supabase.
   */
  const update = useCallback(
    (partial: Partial<UserSettings>) => {
      const next = { ...cachedSettings, ...partial };
      notifyListeners(next);
      persist(next);
    },
    [persist]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    settings,
    isLoading,
    saveStatus,
    update,
    /** Force reload from database */
    reload: load,
  };
}

/**
 * Reset the module-level cache (call on logout).
 */
export function resetSettingsCache() {
  cachedSettings = { ...DEFAULT_SETTINGS };
  cacheLoaded = false;
  notifyListeners(cachedSettings);
}
