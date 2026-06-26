"use client";

import { motion } from "framer-motion";
import QuestLog from "./QuestLog";
import CharacterCard from "./CharacterCard";
import TopStatsBar from "./TopStatsBar";
import LeaderboardPodium from "./LeaderboardPodium";
import ActivityFeed from "./ActivityFeed";
import SyllabusWidget from "./SyllabusWidget";
import DashboardTour from "./DashboardTour";
import BackgroundLayer from "../layout/BackgroundLayer";
import AmbientPlayer from "../ui/AmbientPlayer";
import { useTheme } from "@/context/ThemeContext";

/**
 * Dashboard - an "adventurer's board" (Habitica-flavoured): character sheet on
 * top, today's dailies front-and-centre, party + subjects to the side.
 */
export default function Dashboard() {
  const { theme } = useTheme();
  const isSun = theme === "sun";

  const panel = isSun
    ? "bg-white/70 border-white/60 backdrop-blur-xl"
    : "bg-white/[0.04] border-white/[0.08] backdrop-blur-xl";

  return (
    <div className={`min-h-screen relative overflow-hidden bg-transparent ${isSun ? "text-slate-800" : "text-white"}`}>
      <BackgroundLayer />
      <DashboardTour />

      <div className="relative min-h-screen flex flex-col z-10 pt-3 pb-24 px-4 sm:px-6 lg:px-10 max-w-[1280px] mx-auto">
        <header className="w-full mb-4">
          <TopStatsBar />
        </header>

        {/* Character sheet hero */}
        <CharacterCard />

        {/* Board: dailies (main) + party/subjects (side) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
          <div className="lg:col-span-2 flex flex-col gap-5">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-3xl border p-5 sm:p-6 ${panel}`}
            >
              <QuestLog />
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className={`rounded-3xl border p-5 sm:p-6 ${panel}`}
            >
              <ActivityFeed />
            </motion.section>
          </div>

          <div className="flex flex-col gap-5">
            <motion.aside initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
              <SyllabusWidget />
            </motion.aside>
            <motion.aside initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <LeaderboardPodium />
            </motion.aside>
          </div>
        </div>
      </div>

      <AmbientPlayer />
    </div>
  );
}
