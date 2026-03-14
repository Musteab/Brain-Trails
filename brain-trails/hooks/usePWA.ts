"use client";

import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches;
  });
  const [swRegistered, setSwRegistered] = useState(false);

  // Register service worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        setSwRegistered(true);
      })
      .catch((err) => {
        console.warn("[PWA] Service worker registration failed:", err);
      });
  }, []);

  // Capture install prompt
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // Trigger install
  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setInstallPrompt(null);
    }

    return outcome === "accepted";
  }, [installPrompt]);

  return {
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    swRegistered,
    promptInstall,
  };
}
