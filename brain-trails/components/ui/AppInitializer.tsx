"use client";

import { useStudyReminders } from "@/hooks/useStudyReminders";
import { usePWA } from "@/hooks/usePWA";

/**
 * Invisible component that mounts global hooks
 * which need a client-side context (layout.tsx is a server component).
 *
 * Currently activates:
 * - Study reminder notifications (streak + nudge timers)
 * - PWA service worker registration + install-prompt capture
 */
export default function AppInitializer() {
  useStudyReminders();
  // usePWA(); // Temporarily disabled to debug "Script resource is behind a redirect" error
  return null;
}
