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
 * Dashboard - Glassmorphism Layout
 * Centerpiece owl, left study profile, right community hub, bottom adventures
 */
export default function Dashboard() {
  const { theme } = useTheme();
  const isSun = theme === "sun";

  return (
    <div className={`min-h-screen relative overflow-hidden bg-transparent ${isSun ? "text-slate-800" : "text-white"}`}>
      <BackgroundLayer />
      <DashboardTour />

      <div className="relative min-h-screen flex flex-col z-10 pt-3 pb-24 px-4 sm:px-6 lg:px-10 max-w-[1440px] mx-auto">
        {/* Minimal Top Nav */}
        <header className="w-full mb-2 relative">
          <TopStatsBar />
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col items-center w-full gap-4 lg:gap-5">
          
          {/* Top Row: Left Panel | Centerpiece Owl | Right Panel */}
          <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-6 relative">
            
            {/* Left Side - My Study Profile */}
            <motion.aside
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="w-full lg:w-[280px] xl:w-[300px] order-2 lg:order-1 flex-shrink-0"
            >
              <SyllabusWidget />
            </motion.aside>

            {/* Centerpiece - Owl Mascot & Floating Stats */}
            <motion.section
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.7 }}
              className="order-1 lg:order-2 flex-1 flex flex-col items-center justify-start relative z-20 min-h-[340px] lg:min-h-[400px]"
            >
              <StudyRoom />
            </motion.section>

            {/* Right Side - Community Hub */}
            <motion.aside
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="w-full lg:w-[280px] xl:w-[300px] order-3 lg:order-3 flex-shrink-0"
            >
              <LeaderboardPodium />
            </motion.aside>
          </div>

          {/* Bottom Center - Adventures & Activity */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="w-full max-w-4xl order-4 z-20"
          >
            <div className={`rounded-[28px] p-5 sm:p-7 flex flex-col md:flex-row gap-6 border backdrop-blur-xl ${
              isSun 
                ? "bg-white/30 border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]" 
                : "bg-white/[0.04] border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            }`}
            style={{
              boxShadow: isSun 
                ? "0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)" 
                : "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(255,255,255,0.03)"
            }}
            >
              <div className={`flex-1 border-b md:border-b-0 md:border-r pb-5 md:pb-0 md:pr-6 ${
                isSun ? "border-slate-200/50" : "border-white/[0.06]"
              }`}>
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
