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
import SplineBackground from "../layout/SplineBackground";
import { useTheme } from "@/context/ThemeContext";

/**
 * 🗺️ Dashboard Component (Screen A)
 * 
 * Polished 3-column layout with "juice":
 * - Left Sidebar: Daily Bounties (QuestLog)
 * - Center Stage: 3D Pet Companion (StudyRoom) - scaled up 15%
 * - Right Sidebar: Leaderboard + Adventure Log
 * 
 * Features:
 * - Glassmorphism cards with game-aesthetic borders
 * - Radial vignette background for focus
 * - Visual connector paths between sections
 * - Tightened margins for cohesion
 */
export default function Dashboard() {
  const { theme } = useTheme();
  const isSun = theme === "sun";

  return (
    <div
      className={`min-h-screen bg-transparent ${isSun ? "text-slate-800" : "text-white"}`}
    >
      {/* Dynamic Background with Vignette */}
      <SplineBackground />

      {/* ===== MAIN LAYOUT CONTAINER ===== */}
      <div className="relative min-h-screen flex flex-col">
        
        {/* Top Stats Bar */}
        <header className="w-full px-[2vw] lg:px-[2.5vw] py-2">
          <TopStatsBar />
        </header>

        {/* ===== HERO GRID (3-Column Layout) - Tightened Margins ===== */}
        <main className="flex-1 px-[1.5vw] lg:px-[2vw] pb-28">
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-start">
            
            {/* Left Sidebar - Daily Bounties */}
            <aside className="lg:col-span-3 xl:col-span-3 z-0">
              <div className="sticky top-4">
                <QuestLog />
              </div>
            </aside>

            {/* Center Stage - 3D Pet Companion (Elevated z-index for overlap) */}
            <section className="lg:col-span-6 xl:col-span-6 flex items-center justify-center z-10 -mx-2">
              <div className="w-full max-w-2xl">
                <StudyRoom />
              </div>
            </section>

            {/* Right Sidebar - Leaderboard + Adventure Log */}
            <aside className="lg:col-span-3 xl:col-span-3 z-0">
              <div className="sticky top-4 flex flex-col gap-3">
                <LeaderboardPodium />
                <AdventureLog />
              </div>
            </aside>

          </div>
        </main>

        {/* ===== SCROLL SECTION (Boss & Activity) ===== */}
        <section className="px-[1.5vw] lg:px-[2vw] pb-28">
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
    </div>
  );
}
