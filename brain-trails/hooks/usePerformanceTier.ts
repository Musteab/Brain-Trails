"use client";

import { useState, useEffect } from "react";

type PerformanceTier = "high" | "low";

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

/**
 * Hook to detect device performance capabilities.
 * Checks hardware concurrency (CPU cores) and device memory (if available).
 * Falls back to "high" if detection is unsupported.
 */
export function usePerformanceTier() {
  const [tier, setTier] = useState<PerformanceTier>("high");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // navigator.hardwareConcurrency usually returns the number of logical cores
    const cores = navigator.hardwareConcurrency || 4;
    
    // navigator.deviceMemory returns approximate RAM in GB (not supported in all browsers)
    const memory = (navigator as NavigatorWithMemory).deviceMemory || 8;

    // We consider it a "low" tier device if it has <= 4 cores or <= 4GB RAM
    // This typically catches older phones, cheap tablets, and low-end Chromebooks.
    const detected: PerformanceTier = (cores <= 4 || memory <= 4) ? "low" : "high";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: one-time hardware detection on mount
    setTier(detected);
    setIsReady(true);
  }, []);

  return { tier, isReady };
}
