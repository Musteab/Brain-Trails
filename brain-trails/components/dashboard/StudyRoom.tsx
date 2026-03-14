"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import OwlCompanion from "../ui/OwlCompanion";
import { useCardStyles } from "@/hooks/useCardStyles";
import { gameText } from "@/constants/gameText";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

/** Daily study goal in minutes (100% = this many minutes studied) */
const DAILY_STUDY_GOAL_MINUTES = 120;
/** Daily session goal (100% = this many completed sessions) */
const DAILY_SESSION_GOAL = 4;

/**
 * Status bar component (Energy/Focus style)
 */
function StatusBar({ 
  label, 
  value, 
  maxValue, 
  color,
  isSun
}: { 
  label: string; 
  value: number; 
  maxValue: number; 
  color: string;
  isSun: boolean;
}) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-sm border ${
      isSun ? "bg-white/80 border-amber-200" : "bg-slate-800/60 border-white/10"
    }`}>
      <div className={`w-16 h-2 rounded-full overflow-hidden ${isSun ? "bg-amber-100" : "bg-white/10"}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: 0.8, duration: 1 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className={`text-xs font-medium font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-700" : "text-white"}`}>{label}</span>
    </div>
  );
}

/** Speech bubble messages based on today's progress */
function getSpeechBubble(studyMinutes: number, sessions: number): string {
  if (studyMinutes === 0) return "Ready to study? Let's go!";
  if (studyMinutes >= DAILY_STUDY_GOAL_MINUTES) return "Outstanding work today, traveler!";
  if (sessions >= DAILY_SESSION_GOAL) return "You've crushed your session goal!";
  if (studyMinutes >= 60) return "Great progress! Keep it up!";
  if (studyMinutes >= 30) return "Nice start! You're on a roll!";
  return "Good first step! Keep going!";
}

/** Owl mood based on today's progress */
function getOwlMood(studyMinutes: number): "idle" | "studying" | "celebrating" | "sleepy" {
  if (studyMinutes >= DAILY_STUDY_GOAL_MINUTES) return "celebrating";
  if (studyMinutes >= 60) return "celebrating";
  if (studyMinutes >= 30) return "studying";
  return "idle";
}

/**
 * StudyRoom Component (Owl Scholar Companion Center)
 * 
 * Main center piece with animated owl companion, status bars, and speech bubble.
 * Status bars reflect today's real focus session data from Supabase.
 */
export default function StudyRoom() {
  const { card, isSun } = useCardStyles();
  const { user } = useAuth();
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchTodayStats = async () => {
      // Start of today (UTC)
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
      className={`${card} p-4 sm:p-5 flex flex-col relative z-10 lg:scale-105`}
      style={{ 
        transformOrigin: "center center" 
      }}
    >
      {/* Speech Bubble */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`rounded-2xl px-4 py-2 border-2 mx-auto mb-3 ${
          isSun ? "bg-purple-100/80 backdrop-blur-sm border-purple-300" : "bg-[#9D4EDD]/20 backdrop-blur-sm border-[#9D4EDD]/40"
        }`}
      >
        <p className={`text-sm font-medium font-[family-name:var(--font-quicksand)] ${isSun ? "text-purple-700" : "text-white"}`}>
          {speechBubble}
        </p>
      </motion.div>

      {/* Owl Scholar Companion */}
      <div className="w-full h-[260px] sm:h-[340px] flex items-center justify-center relative">
        {/* Contact/Grounding Shadow */}
        <div 
          className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-[40%] h-6 rounded-[100%] blur-xl ${
            isSun ? "bg-amber-900/20" : "bg-purple-900/40"
          }`}
        />
        
        <OwlCompanion 
          mood={owlMood}
          className="relative z-10"
        />
      </div>

      {/* Status Bars — today's real data */}
      <div className="flex justify-center gap-4 mt-4">
        <StatusBar 
          label={gameText.study.study} 
          value={todayMinutes} 
          maxValue={DAILY_STUDY_GOAL_MINUTES} 
          color="bg-green-400"
          isSun={isSun}
        />
        <StatusBar 
          label={gameText.study.focus} 
          value={todaySessions} 
          maxValue={DAILY_SESSION_GOAL} 
          color="bg-blue-400"
          isSun={isSun}
        />
      </div>
    </motion.div>
  );
}
