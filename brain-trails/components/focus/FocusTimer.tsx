"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Flag, FastForward, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGameStore, useUIStore } from "@/stores";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { supabase } from "@/lib/supabase";

/**
 * Plant growth stages based on progress percentage
 */
type PlantStage = "seed" | "sprout" | "smallTree" | "bigTree";

interface PlantConfig {
  emoji: string;
  label: string;
}

const plantStages: Record<PlantStage, PlantConfig> = {
  seed: { emoji: "🌱", label: "Seed" },
  sprout: { emoji: "🌿", label: "Sprout" },
  smallTree: { emoji: "🌳", label: "Small Tree" },
  bigTree: { emoji: "🌲", label: "Big Tree" },
};

/**
 * Get plant stage based on progress percentage
 */
function getPlantStage(progress: number): PlantStage {
  if (progress < 25) return "seed";
  if (progress < 50) return "sprout";
  if (progress < 75) return "smallTree";
  return "bigTree";
}

/**
 * Format time as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

interface FocusTimerProps {
  focusSubject?: string;
  defaultMinutes?: number;
  onBack?: () => void;
}

/**
 * Pre-computed particle positions (module-level to avoid Math.random() during render).
 */
const PARTICLE_POSITIONS = Array.from({ length: 12 }, () => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  duration: 3 + Math.random() * 2,
  delay: Math.random() * 2,
}));

/**
 * 🌱 FocusTimer Component
 * 
 * Pomodoro-style focus timer with:
 * - Circular progress ring
 * - Growing plant animation based on progress
 * - Play/Pause/Reset controls
 */
export default function FocusTimer({ 
  focusSubject = "Math", 
  defaultMinutes = 25,
  onBack
}: FocusTimerProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { awardXp, awardGold, logActivity } = useGameStore();
  const addToast = useUIStore((s) => s.addToast);
  const playSound = useSoundEffects();
  
  const totalSessions = 4;
  const totalTime = defaultMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [isActive, setIsActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showReward, setShowReward] = useState(false);

  // Calculate progress percentage (0 to 100)
  const progressPercentage = ((totalTime - timeLeft) / totalTime) * 100;

  // Derive plant stage from progress (no state needed)
  const currentStage = getPlantStage(progressPercentage);

  // SVG circle parameters
  const circleRadius = 140;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  const saveSessionData = useCallback(async () => {
    if (!user || !profile) return;
    const gainedXp = defaultMinutes * 2;
    const gainedGold = defaultMinutes;

    // 1. Insert into focus_sessions
    await supabase.from('focus_sessions').insert({
      user_id: user.id,
      subject: focusSubject,
      duration_minutes: defaultMinutes,
      xp_earned: gainedXp,
      gold_earned: gainedGold
    });

    // 2. Award XP and Gold via the game store (handles Supabase sync)
    await awardXp(user.id, gainedXp);
    await awardGold(user.id, gainedGold);

    // 3. Log activity
    await logActivity(user.id, 'focus', gainedXp, {
      subject: focusSubject,
      duration: defaultMinutes,
    });

    addToast(`Session complete! +${gainedXp} XP, +${gainedGold} Gold`, "success");
    refreshProfile();
  }, [user, profile, defaultMinutes, focusSubject, awardXp, awardGold, logActivity, addToast, refreshProfile]);

  // Timer countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: timer completion triggers state transitions
      setIsActive(false);
      setCompletedSessions((prev) => Math.min(prev + 1, totalSessions));
      setShowReward(true);
      playSound("timerEnd");
      saveSessionData();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, playSound, saveSessionData, totalSessions]);

  // Control handlers
  const toggleTimer = useCallback(() => {
    setIsActive((prev) => {
      if (!prev) playSound("timerStart");
      return !prev;
    });
  }, [playSound]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(totalTime);
  }, [totalTime]);

  const skipSession = useCallback(() => {
    // Skip to end (for testing)
    setTimeLeft(0);
    setIsActive(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Dreamy Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-300 via-blue-200 to-slate-400 -z-10" />
      
      {/* Back button */}
      {onBack && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/70 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>
      )}

      {/* Floating particles/dots for ambiance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-5">
        {PARTICLE_POSITIONS.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/40"
            style={{
              left: p.left,
              top: p.top,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
            }}
          />
        ))}
      </div>

      {/* Focus Subject Label */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="px-6 py-2.5 bg-white/70 backdrop-blur-md rounded-full shadow-lg border border-white/50">
          <span className="text-slate-700 font-medium font-[family-name:var(--font-quicksand)]">
            Focusing on: <span className="font-bold">{focusSubject}</span>
          </span>
        </div>
      </motion.div>

      {/* Main Timer Circle */}
      <div className="relative flex items-center justify-center">
        {/* SVG Progress Ring */}
        <svg
          width="320"
          height="320"
          className="transform -rotate-90"
        >
          {/* Background Track */}
          <circle
            cx="160"
            cy="160"
            r={circleRadius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="4"
          />
          
          {/* Progress Indicator */}
          <motion.circle
            cx="160"
            cy="160"
            r={circleRadius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          {/* Progress Dot at the end of the arc */}
          <motion.circle
            cx="160"
            cy={160 - circleRadius}
            r="6"
            fill="#4ade80"
            className="origin-center"
            style={{
              transform: `rotate(${(progressPercentage / 100) * 360}deg)`,
              transformOrigin: "160px 160px",
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Growing Plant */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className="text-4xl mb-2"
            >
              {plantStages[currentStage].emoji}
            </motion.div>
          </AnimatePresence>

          {/* Timer Display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-6xl font-bold text-white tracking-tight font-[family-name:var(--font-nunito)]"
            style={{
              textShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            {formatTime(timeLeft)}
          </motion.div>

          {/* Stage Label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/60 text-sm mt-2 font-[family-name:var(--font-quicksand)]"
          >
            {plantStages[currentStage].label}
          </motion.p>
        </div>
      </div>

      {/* Control Bar */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-16"
      >
        <div className="flex items-center gap-2 px-4 py-3 bg-white/70 backdrop-blur-xl rounded-full shadow-lg border border-white/50">
          {/* Flag/Milestone Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetTimer}
            className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <Flag className="w-5 h-5" />
          </motion.button>

          {/* Play/Pause Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTimer}
            className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors"
          >
            {isActive ? (
              <Pause className="w-6 h-6" fill="white" />
            ) : (
              <Play className="w-6 h-6 ml-1" fill="white" />
            )}
          </motion.button>

          {/* Fast Forward / Skip Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={skipSession}
            className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <FastForward className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Session Dots (Pomodoro count) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 mt-8"
      >
        {[...Array(totalSessions)].map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < completedSessions
                ? "bg-emerald-400"
                : i === completedSessions && isActive
                ? "bg-emerald-400/60 animate-pulse"
                : "bg-white/40"
            }`}
          />
        ))}
      </motion.div>

      {/* Completion Celebration (when timer ends) */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 text-center shadow-2xl max-w-sm"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-slate-800 font-[family-name:var(--font-nunito)]">
                Session Complete!
              </h2>
              <p className="text-slate-600 mt-2 font-[family-name:var(--font-quicksand)]">
                Your {plantStages[currentStage].label} has fully grown!
              </p>

              {/* Rewards */}
              <div className="flex items-center justify-center gap-4 mt-4 py-3 px-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">+{defaultMinutes * 2}</div>
                  <div className="text-xs text-amber-500">XP</div>
                </div>
                <div className="w-px h-8 bg-amber-200" />
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">+{defaultMinutes}</div>
                  <div className="text-xs text-amber-500">Gold</div>
                </div>
                <div className="w-px h-8 bg-amber-200" />
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600">{completedSessions}/{totalSessions}</div>
                  <div className="text-xs text-emerald-500">Sessions</div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowReward(false);
                    resetTimer();
                  }}
                  className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-full shadow-lg hover:bg-emerald-600 transition-colors"
                >
                  {completedSessions >= totalSessions ? "All Done! 🌟" : "Next Session"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
