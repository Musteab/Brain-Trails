"use client";

import { ReactNode } from "react";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import BackgroundLayer from "@/components/layout/BackgroundLayer";
import { useTheme } from "@/context/ThemeContext";

/**
 * Arcane Archive Layout - "Wizard's Desk"
 * Shared layout for all subject-centric study pages
 */
export default function ArcaneArchiveLayout({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const isSun = theme === "sun";

  return (
    <main className={`relative min-h-screen ${isSun ? "text-slate-800" : "text-white"}`}>
      <BackgroundLayer />
      <div className="relative z-10">
        {children}
      </div>
      <TravelerHotbar />
    </main>
  );
}
