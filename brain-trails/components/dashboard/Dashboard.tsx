"use client";

import { motion } from "framer-motion";
import QuestLog from "./QuestLog";
import StudyRoom from "./StudyRoom";
import TopStatsBar from "./TopStatsBar";
import LeaderboardPodium from "./LeaderboardPodium";
import ActivityFeed from "./ActivityFeed";
import SyllabusWidget from "./SyllabusWidget";
import DashboardTour from "./DashboardTour";
import BackgroundLayer from "../layout/BackgroundLayer";
import AmbientPlayer from "../ui/AmbientPlayer";
import { useTheme } from "@/context/ThemeContext";

/**
 * 🗺️ Dashboard — Ultra-minimal Glassmorphism Layout
 */
export default function Dashboard() {
  const { theme } = useTheme();
  const isSun = theme === "sun";

  return (
    <div className={`min-h-screen relative overflow-hidden bg-transparent ${isSun ? "text-slate-800" : "text-white"}`}>
      {/* Dynamic Background that changes with time of day */}
      <BackgroundLayer />
      <DashboardTour />

      <div className="relative min-h-screen flex flex-col z-10 pt-4 pb-20 px-4 sm:px-8 lg:px-12 max-w-[1600px] mx-auto">
        {/* Minimalist Top Nav */}
        <header className="w-full mb-12">
          <TopStatsBar />
        </header>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 flex flex-col justify-center items-center w-full gap-12 lg:gap-8">
          
          {/* Top Row: Left Panel, Center Mascot, Right Panel */}
          <div className="w-full flex flex-col lg:flex-row justify-between items-center lg:items-end gap-12 lg:gap-4 relative">
            
            {/* ── Left Side (My Study Profile) ── */}
            <motion.aside
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="w-full lg:w-[320px] order-2 lg:order-1 flex-shrink-0"
            >
              <SyllabusWidget />
            </motion.aside>

            {/* ── Centerpiece (Mascot & Floating Stats) ── */}
            <motion.section
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="order-1 lg:order-2 flex-1 flex flex-col items-center justify-center relative z-20"
            >
              <StudyRoom />
            </motion.section>

            {/* ── Right Side (Community Hub) ── */}
            <motion.aside
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="w-full lg:w-[320px] order-3 lg:order-3 flex-shrink-0"
            >
              <LeaderboardPodium />
            </motion.aside>
          </div>

          {/* Bottom Center (Adventures & Activity) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="w-full max-w-4xl order-4 z-20 mt-8"
          >
            <div className={`glass rounded-[32px] p-6 sm:p-8 flex flex-col md:flex-row gap-8 shadow-2xl ${isSun ? "bg-white/40 border-white/60" : "bg-black/20 border-white/10"}`}>
              <div className="flex-1 border-b md:border-b-0 md:border-r border-current border-opacity-10 pb-6 md:pb-0 md:pr-8">
                <QuestLog />
              </div>
              <div className="flex-1">
                <ActivityFeed />
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      <AmbientPlayer />
    </div>
  );
}
