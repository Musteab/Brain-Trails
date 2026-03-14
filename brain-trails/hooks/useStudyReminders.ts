"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/context/AuthContext";

const STREAK_MESSAGES = [
  "Don't break your streak! You have a {streak}-day streak going.",
  "Your {streak}-day streak is calling! Time to study, Traveler.",
  "Keep the fire burning! {streak} days and counting.",
  "{streak} days strong! A quick study session keeps it alive.",
];

const NUDGE_MESSAGES = [
  "Time to train, Traveler! Your brain will thank you.",
  "The scrolls await! Ready for a quick study session?",
  "Your owl companion misses you. Come train!",
  "A wise traveler studies daily. Ready to begin?",
  "The Mana Garden is calling. Time to focus!",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sendNotification(title: string, body: string) {
  if (typeof window === "undefined" || Notification.permission !== "granted")
    return;

  try {
    new Notification(title, {
      body,
      icon: "/icon-192.svg",
      badge: "/icon-192.svg",
      tag: "brain-trails-reminder",
      renotify: true,
    } as NotificationOptions);
  } catch (e) {
    console.warn("[StudyReminders] Notification failed:", e);
  }
}

function getPermission(): NotificationPermission {
  if (typeof window !== "undefined" && "Notification" in window) {
    return Notification.permission;
  }
  return "default";
}

export function useStudyReminders() {
  const { settings, isLoading } = useSettings();
  const { profile } = useAuth();
  const nudgeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streakCheckRef = useRef<boolean>(false);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window))
      return "denied" as NotificationPermission;

    const result = await Notification.requestPermission();
    return result;
  }, []);

  // Auto-request permission if reminders are enabled
  useEffect(() => {
    if (isLoading) return;
    if (settings.streak_reminders || settings.study_nudges) {
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        void requestPermission();
      }
    }
  }, [settings.streak_reminders, settings.study_nudges, isLoading, requestPermission]);

  // Streak reminder check — runs once per page load
  useEffect(() => {
    if (isLoading || streakCheckRef.current) return;
    if (!settings.streak_reminders || !profile) return;
    if (getPermission() !== "granted") return;

    streakCheckRef.current = true;
    const streakDays = profile.streak_days ?? 0;

    if (streakDays > 0) {
      // Check after 30 seconds (give user a chance to start studying)
      const timeout = setTimeout(() => {
        const msg = pickRandom(STREAK_MESSAGES).replace(
          "{streak}",
          String(streakDays),
        );
        sendNotification("Brain Trails - Streak Reminder", msg);
      }, 30000);

      return () => clearTimeout(timeout);
    }
  }, [isLoading, settings.streak_reminders, profile]);

  // Study nudges — every 2 hours
  useEffect(() => {
    if (isLoading) return;
    if (!settings.study_nudges || getPermission() !== "granted") {
      if (nudgeIntervalRef.current) {
        clearInterval(nudgeIntervalRef.current);
        nudgeIntervalRef.current = null;
      }
      return;
    }

    nudgeIntervalRef.current = setInterval(() => {
      const msg = pickRandom(NUDGE_MESSAGES);
      sendNotification("Brain Trails", msg);
    }, 2 * 60 * 60 * 1000); // 2 hours

    return () => {
      if (nudgeIntervalRef.current) {
        clearInterval(nudgeIntervalRef.current);
        nudgeIntervalRef.current = null;
      }
    };
  }, [isLoading, settings.study_nudges]);

  // Test notification
  const sendTestNotification = useCallback(() => {
    sendNotification(
      "Brain Trails - Test",
      "Notifications are working! Your owl companion approves.",
    );
  }, []);

  return {
    get permissionStatus() { return getPermission(); },
    requestPermission,
    sendTestNotification,
  };
}
