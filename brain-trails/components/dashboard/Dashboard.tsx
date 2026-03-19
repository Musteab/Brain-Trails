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
import SyllabusWidget from "./SyllabusWidget";
import AmbientPlayer from "../ui/AmbientPlayer";
import { useTheme } from "@/context/ThemeContext";
import { useGameStore, useUIStore } from "@/stores";
import { useKonamiCode } from "@/hooks/useKonamiCode";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useAuth } from "@/context/AuthContext";
import confetti from "canvas-confetti";

/**
 * 🗺️ Dashboard — Cleaned-up game-style layout
 * 
 * No greeting banner (user didn't like it).
 * Tighter card hierarchy, no section headers.
 * Relies on the new BackgroundLayer for atmosphere.
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
      colors: ["#FBBF24", "#F59E0B", "#D97706"]
    });
    if (user?.id) awardGold(user.id, 100);
    if (profile?.id) refreshProfile();
    addToast("Konami Code Unlocked! +100 Gold 🎮🪙", "success");
  });

  return (
    <div className={`min-h-screen bg-transparent ${isSun ? "text-slate-800" : "text-white"}`}>
      <BackgroundLayer />

      <div className="relative min-h-screen flex flex-col">
        {/* Top Stats Bar */}
        <header className="w-full px-3 sm:px-[2vw] lg:px-[2.5vw] py-2">
          <TopStatsBar />
        </header>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 px-3 sm:px-[1.5vw] lg:px-[2vw] pt-2 pb-8">
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
            
            {/* ── Left Column ── */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="order-2 lg:order-1 lg:col-span-3 z-20 relative"
            >
              <div className="lg:sticky lg:top-4 space-y-4">
                <SyllabusWidget />
                <StudyStreakWidget streakDays={streakDays} lastStudyDate={null} />
                <QuestLog />
              </div>
            </motion.aside>

            {/* ── Center Stage ── */}
            <motion.section
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.5 }}
              className="order-1 lg:order-2 lg:col-span-6 flex items-center justify-center z-10 lg:-mx-2"
            >
              <div className="w-full max-w-2xl">
                <StudyRoom />
              </div>
            </motion.section>

            {/* ── Right Column ── */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="order-3 lg:col-span-3 z-20 relative"
            >
              <div className="lg:sticky lg:top-4 flex flex-col gap-4">
                <LeaderboardPodium />
                <AdventureLog />
              </div>
            </motion.aside>

          </div>
        </main>

        {/* ===== SCROLL SECTION ===== */}
        <section className="px-3 sm:px-[1.5vw] lg:px-[2vw] pb-28 pt-2">
          <div className="max-w-4xl mx-auto space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <CoopBossRaid />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <ActivityFeed />
            </motion.div>
          </div>
        </section>

        <footer className="mt-auto">
          <Footer />
        </footer>
      </div>

      <AmbientPlayer />
    </div>
  );
}
