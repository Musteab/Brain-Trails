"use client";

import { motion } from "framer-motion";
import QuestLog from "./QuestLog";
import StudyRoom from "./StudyRoom";
import AdventureLog from "./AdventureLog";
import TopStatsBar from "./TopStatsBar";
import LeaderboardPodium from "./LeaderboardPodium";
import CoopBossRaid from "./CoopBossRaid";
import ActivityFeed from "./ActivityFeed";
import Footer from "../layout/Footer";
import BackgroundLayer from "../layout/BackgroundLayer";
import StudyStreakWidget from "../ui/StudyStreakWidget";
import AmbientPlayer from "../ui/AmbientPlayer";
import GreetingBanner from "../ui/GreetingBanner";
import { useTheme } from "@/context/ThemeContext";
import { useGameStore, useUIStore } from "@/stores";
import { useKonamiCode } from "@/hooks/useKonamiCode";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useAuth } from "@/context/AuthContext";
import confetti from "canvas-confetti";

/**
 * 🗺️ Dashboard Component (Screen A)
 * 
 * Polished 3-column layout:
 * - Left Sidebar: Daily Bounties (QuestLog)
 * - Center Stage: Owl Companion (StudyRoom)
 * - Right Sidebar: Leaderboard + Adventure Log
 * 
 * Features:
 * - Glassmorphism cards with game-aesthetic borders
 * - Theme-aware background layer
 * - Tightened margins for cohesion
 */
export default function Dashboard() {
  const { theme } = useTheme();
  const isSun = theme === "sun";
  const { streakDays, awardGold } = useGameStore();
  const { addToast } = useUIStore();
  const { profile, refreshProfile, user } = useAuth();
  const playSound = useSoundEffects();

  // Konami Code Easter Egg
  useKonamiCode(() => {
    playSound("success");
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FBBF24", "#F59E0B", "#D97706"] // Gold colors
    });
    
    // Add 100 gold and sync to Supabase
    if (user?.id) {
      awardGold(user.id, 100);
    }
    
    // Async refresh of profile to sync Supabase backend if we wanted to
    // For now the awardGold hits Supabase directly via the Zustand actions
    if (profile?.id) {
      refreshProfile();
    }

    addToast("Konami Code Unlocked! +100 Gold 🎮🪙", "success");
  });

  return (
    <div
      className={`min-h-screen bg-transparent ${isSun ? "text-slate-800" : "text-white"}`}
    >
      {/* Dynamic Background with Vignette */}
      <BackgroundLayer />

      {/* ===== MAIN LAYOUT CONTAINER ===== */}
      <div className="relative min-h-screen flex flex-col">
        
        {/* Top Stats Bar */}
        <header className="w-full px-3 sm:px-[2vw] lg:px-[2.5vw] py-2">
          <TopStatsBar />
        </header>

        {/* ===== HERO GRID (3-Column Layout) - Tightened Margins ===== */}
        <main className="flex-1 px-3 sm:px-[1.5vw] lg:px-[2vw] pb-28">
          
          {/* Greeting Banner */}
          <GreetingBanner />

          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-5 items-start">
            
            {/* Center Stage - Owl Companion (shown first on mobile via order) */}
            <section className="order-1 lg:order-2 lg:col-span-6 xl:col-span-6 flex items-center justify-center z-10 lg:-mx-2">
              <div className="w-full max-w-2xl">
                <StudyRoom />
              </div>
            </section>

            {/* Left Sidebar - Daily Bounties */}
            <aside className="order-2 lg:order-1 lg:col-span-3 xl:col-span-3 z-20 relative">
              <div className="lg:sticky lg:top-4 space-y-3">
                <StudyStreakWidget streakDays={streakDays} lastStudyDate={null} />
                <QuestLog />
              </div>
            </aside>

            {/* Right Sidebar - Leaderboard + Adventure Log */}
            <aside className="order-3 lg:col-span-3 xl:col-span-3 z-20 relative">
              <div className="lg:sticky lg:top-4 flex flex-col gap-3">
                <LeaderboardPodium />
                <AdventureLog />
              </div>
            </aside>

          </div>
        </main>

        {/* ===== SCROLL SECTION (Boss & Activity) ===== */}
        <section className="px-3 sm:px-[1.5vw] lg:px-[2vw] pb-28 pt-2">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Boss Raid Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <CoopBossRaid />
            </motion.div>

            {/* Activity Feed Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <ActivityFeed />
            </motion.div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="mt-auto">
          <Footer />
        </footer>
      </div>

      {/* Ambient Player Widget */}
      <AmbientPlayer />
    </div>
  );
}
