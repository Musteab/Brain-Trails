"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import OwlCompanion from "../ui/OwlCompanion";
import { useCardStyles } from "@/hooks/useCardStyles";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const DAILY_STUDY_GOAL_MINUTES = 120;
const DAILY_SESSION_GOAL = 4;

/** Progress ring component */
function ProgressRing({ 
  value, 
  maxValue, 
  color, 
  label,
  icon,
  isSun 
}: { 
  value: number; 
  maxValue: number; 
  color: string;
  label: string;
  icon: string;
  isSun: boolean;
}) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32" cy="32" r={radius}
            className={isSun ? "stroke-slate-200" : "stroke-white/10"}
            strokeWidth="4" fill="none"
          />
          <motion.circle
            cx="32" cy="32" r={radius}
            className={color}
            strokeWidth="4" fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg">
          {icon}
        </div>
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${isSun ? "text-slate-500" : "text-slate-300"}`}>
        {label}
      </span>
      <span className={`text-xs font-bold ${isSun ? "text-slate-700" : "text-white"}`}>
        {value}/{maxValue}
      </span>
    </div>
  );
}

function getSpeechBubble(studyMinutes: number, sessions: number): string {
  if (studyMinutes === 0) return "Ready to study? Let's go!";
  if (studyMinutes >= DAILY_STUDY_GOAL_MINUTES) return "Outstanding work today, traveler!";
  if (sessions >= DAILY_SESSION_GOAL) return "You've crushed your session goal!";
  if (studyMinutes >= 60) return "Great progress! Keep it up!";
  if (studyMinutes >= 30) return "Nice start! You're on a roll!";
  return "Good first step! Keep going!";
}

function getOwlMood(studyMinutes: number): "idle" | "studying" | "celebrating" | "sleepy" {
  if (studyMinutes >= DAILY_STUDY_GOAL_MINUTES) return "celebrating";
  if (studyMinutes >= 60) return "celebrating";
  if (studyMinutes >= 30) return "studying";
  return "idle";
}

/**
 * StudyRoom — Horizontal layout: Owl left, Stats right
 */
export default function StudyRoom() {
  const { card, isSun } = useCardStyles();
  const { user } = useAuth();
  const router = useRouter();
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchTodayStats = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { data, error } = await supabase
        .from("focus_sessions")
        .select("duration_minutes")
        .eq("user_id", user.id)
        .gte("completed_at", todayISO);

      if (error) {
        console.error("StudyRoom: failed to fetch today's sessions:", error);
        return;
      }

      if (data && data.length > 0) {
        const totalMinutes = data.reduce((sum, s) => sum + s.duration_minutes, 0);
        setTodayMinutes(totalMinutes);
        setTodaySessions(data.length);
      }
    };

    fetchTodayStats();
  }, [user]);

  const speechBubble = getSpeechBubble(todayMinutes, todaySessions);
  const owlMood = getOwlMood(todayMinutes);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className={`${card} p-4 sm:p-5 relative z-10`}
    >
      {/* Main content — horizontal on larger screens */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Left: Owl */}
        <div className="relative flex flex-col items-center shrink-0">
          {/* Speech Bubble */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`rounded-2xl px-3 py-1.5 border-2 mb-2 max-w-[200px] text-center ${
              isSun ? "bg-purple-100/80 backdrop-blur-sm border-purple-300" : "bg-[#9D4EDD]/20 backdrop-blur-sm border-[#9D4EDD]/40"
            }`}
          >
            <p className={`text-xs font-medium font-[family-name:var(--font-quicksand)] ${isSun ? "text-purple-700" : "text-white"}`}>
              {speechBubble}
            </p>
          </motion.div>

          <div className="w-[180px] h-[180px] sm:w-[200px] sm:h-[220px] flex items-center justify-center relative">
            <div 
              className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-[50%] h-4 rounded-[100%] blur-lg ${
                isSun ? "bg-amber-900/15" : "bg-purple-900/30"
              }`}
            />
            <OwlCompanion mood={owlMood} className="relative z-10" />
          </div>
          <span className={`text-xs font-bold font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-500" : "text-slate-300"}`}>
          Archie the Scholar
          </span>
        </div>

        {/* Right: Daily Progress Rings */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <h3 className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-700" : "text-slate-200"}`}>
            Today&apos;s Progress
          </h3>
          <div className="flex items-center gap-6">
            <ProgressRing
              value={todayMinutes}
              maxValue={DAILY_STUDY_GOAL_MINUTES}
              color="stroke-emerald-400"
              label="Study"
              icon="📚"
              isSun={isSun}
            />
            <ProgressRing
              value={todaySessions}
              maxValue={DAILY_SESSION_GOAL}
              color="stroke-blue-400"
              label="Focus"
              icon="🧠"
              isSun={isSun}
            />
          </div>

          {/* Quick action buttons */}
          <div className="flex gap-2 mt-2">
            <motion.button
              onClick={() => router.push("/flashcards")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                isSun
                  ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-md shadow-purple-500/20"
                  : "bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-md shadow-purple-500/30"
              }`}
            >
              Train
            </motion.button>
            <motion.button
              onClick={() => router.push("/focus")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                isSun
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              Mana Garden
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
