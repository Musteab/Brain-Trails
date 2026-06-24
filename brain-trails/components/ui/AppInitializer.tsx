"use client";

import { useEffect, useRef } from "react";
import { useStudyReminders } from "@/hooks/useStudyReminders";
import { usePWA } from "@/hooks/usePWA";
import { useAchievements } from "@/hooks/useAchievements";

/**
 * Invisible component that mounts global hooks
 * which need a client-side context (layout.tsx is a server component).
 *
 * Currently activates:
 * - Study reminder notifications (streak + nudge timers)
 * - PWA service worker registration + install-prompt capture
 * - Achievement unlock checks (on load + after earning actions)
 */
export default function AppInitializer() {
  useStudyReminders();
  usePWA();
  useAchievementWatcher();
  return null;
}

/**
 * Runs achievement checks app-wide so unlocks happen *during* play instead of
 * only when the user opens the trophy page. Earning actions (focus/quiz/boss
 * completion, etc.) dispatch a `check-achievements` event; we also run once on
 * load to catch anything earned before this was wired up.
 */
function useAchievementWatcher() {
  const { checkAchievements, isLoading } = useAchievements();
  const ranInitial = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (!ranInitial.current) {
      ranInitial.current = true;
      checkAchievements();
    }

    const onCheck = () => { checkAchievements(); };
    window.addEventListener("check-achievements", onCheck);
    return () => window.removeEventListener("check-achievements", onCheck);
  }, [isLoading, checkAchievements]);
}
