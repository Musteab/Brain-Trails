"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Flag, FastForward, ArrowLeft, Sprout, TreeDeciduous, TreePine, Award, type LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGameStore, useUIStore } from "@/stores";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useAdmin } from "@/hooks/useAdmin";
import { useAmbientSound, type AmbientSound } from "@/hooks/useAmbientSound";
import { supabase } from "@/lib/supabase";

/**
 * Update the user's streak. If the last study date was yesterday, increment.
 * If it was today, do nothing (already counted). Otherwise, reset to 1.
 */
async function updateStreak(userId: string): Promise<void> {
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("streak_days, streak_last_date")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  if (profile.streak_last_date === todayStr) {
    // Already counted today
    return;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak: number;
  if (profile.streak_last_date === yesterdayStr) {
    // Consecutive day - increment
    newStreak = (profile.streak_days || 0) + 1;
  } else {
    // Streak broken - reset to 1
    newStreak = 1;
  }

  await (supabase.from("profiles") as any)
    .update({ streak_days: newStreak, streak_last_date: todayStr })
    .eq("id", userId);
}

/**
 * Plant growth stages based on progress percentage
 */
type PlantStage = "seed" | "sprout" | "smallTree" | "bigTree";

interface PlantConfig {
  Icon: LucideIcon;
  label: string;
}

const plantStages: Record<PlantStage, PlantConfig> = {
  seed: { Icon: Sprout, label: "Seed" },
  sprout: { Icon: Sprout, label: "Sprout" },
  smallTree: { Icon: TreeDeciduous, label: "Sapling" },
  bigTree: { Icon: TreePine, label: "Evergreen" },
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
  ambient?: AmbientSound;
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
  ambient = "none",
  onBack
}: FocusTimerProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { awardXp, awardGold, logActivity, reportQuestProgress } = useGameStore();
  const addToast = useUIStore((s) => s.addToast);
  const playSound = useSoundEffects();
  const { isAdmin } = useAdmin();
  const { play: playAmbient, stop: stopAmbient } = useAmbientSound();

  const totalSessions = 4;
  const totalTime = defaultMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [isActive, setIsActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showReward, setShowReward] = useState(false);
  // Wall-clock deadline (epoch ms) the running timer counts down to. Driving
  // the countdown from a timestamp (instead of decrementing every tick) keeps
  // it accurate even when the browser throttles timers in a background tab.
  const deadlineRef = useRef<number | null>(null);
  // Anti-cheese: accumulate *real* active study time (excluding pauses). Rewards
  // are only granted if the user genuinely spent ~the full duration, so the
  // dev skip button (or any jump-to-end) can't farm XP/gold/streak.
  const activeMsRef = useRef(0);
  const activeStartRef = useRef<number | null>(null);

  // Calculate progress percentage (0 to 100)
  const progressPercentage = ((totalTime - timeLeft) / totalTime) * 100;

  // Derive plant stage from progress (no state needed)
  const currentStage = getPlantStage(progressPercentage);

  // SVG circle parameters
  const circleRadius = 140;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  const saveSessionData = useCallback(async (legit: boolean) => {
    if (!user || !profile) return;

    // Session wasn't actually studied (skipped / jumped) - no rewards.
    if (!legit) {
      addToast("Session ended early - no rewards earned.", "info");
      return;
    }

    const gainedXp = defaultMinutes * 2;
    const gainedGold = defaultMinutes;

    // 1. Insert into focus_sessions
    await (supabase.from('focus_sessions') as any).insert({
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

    // 4. Update daily streak
    await updateStreak(user.id);

    // 5. Advance focus quests (measured in minutes) - pays out rewards on completion
    await reportQuestProgress(user.id, "focus", defaultMinutes);

    addToast(`Session complete! +${gainedXp} XP, +${gainedGold} Gold`, "success");
    refreshProfile();
    // Re-evaluate achievements now that stats changed (focus_sessions, hours, streak)
    window.dispatchEvent(new CustomEvent("check-achievements"));
  }, [user, profile, defaultMinutes, focusSubject, awardXp, awardGold, logActivity, reportQuestProgress, addToast, refreshProfile]);

  // Timer countdown logic - recompute remaining time from the wall clock so a
  // throttled/frozen background tab can't desync the timer. Whenever a tick
  // (or a tab refocus) fires, we snap to the true remaining time.
  useEffect(() => {
    if (!isActive) return;

    const tick = () => {
      // null deadline means completion has already been handled - ignore stray ticks.
      if (deadlineRef.current == null) return;
      const remaining = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        deadlineRef.current = null;
        setIsActive(false);
        // Finalize real active study time (this run + any earlier runs).
        const totalActiveMs =
          activeMsRef.current + (activeStartRef.current ? Date.now() - activeStartRef.current : 0);
        activeStartRef.current = null;
        const legit = totalActiveMs >= totalTime * 1000 * 0.9; // allow 10% jitter
        setCompletedSessions((prev) => Math.min(prev + 1, totalSessions));
        setShowReward(true);
        playSound("timerEnd");
        stopAmbient();
        saveSessionData(legit);
      }
    };

    const interval = setInterval(tick, 250);
    // A backgrounded timer may finish while throttled - re-check the moment the tab is visible again.
    const onVisible = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isActive, playSound, saveSessionData, totalSessions, totalTime, stopAmbient]);

  // Control handlers
  const toggleTimer = useCallback(() => {
    setIsActive((prev) => {
      const next = !prev;
      if (next) {
        // Starting/resuming - anchor the deadline + begin counting active time.
        deadlineRef.current = Date.now() + timeLeft * 1000;
        activeStartRef.current = Date.now();
        playSound("timerStart");
        if (ambient !== "none") playAmbient(ambient);
      } else if (deadlineRef.current != null) {
        // Pausing - freeze remaining time, bank the active time, drop the deadline.
        setTimeLeft(Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000)));
        if (activeStartRef.current) {
          activeMsRef.current += Date.now() - activeStartRef.current;
          activeStartRef.current = null;
        }
        deadlineRef.current = null;
        stopAmbient();
      }
      return next;
    });
  }, [timeLeft, playSound, ambient, playAmbient, stopAmbient]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    deadlineRef.current = null;
    activeStartRef.current = null;
    activeMsRef.current = 0;
    stopAmbient();
    setTimeLeft(totalTime);
  }, [totalTime, stopAmbient]);

  // Admin-only dev tool: jump to completion to test the UI. Because no real
  // active time is accrued, the completion path treats it as "not legit" and
  // grants no rewards - it can't be used to farm XP.
  const skipSession = useCallback(() => {
    deadlineRef.current = Date.now();
    setIsActive(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Mystical Dark Background with Twinkling Stars */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 -z-10" />
      
      {/* Twinkling stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-5">
        {PARTICLE_POSITIONS.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cyan-300/60"
            style={{
              left: p.left,
              top: p.top,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
            }}
          />
        ))}
      </div>
      
      {/* Back button */}
      {onBack && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 backdrop-blur-sm hover:bg-slate-700/70 text-cyan-300 border border-cyan-500/20 transition-colors shadow-lg shadow-cyan-500/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium font-[family-name:var(--font-cinzel)]">Back</span>
        </motion.button>
      )}

      {/* Focus Subject Label */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="px-6 py-2.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-md rounded-full shadow-lg border border-cyan-500/30">
          <span className="text-cyan-300 font-medium font-[family-name:var(--font-cinzel)]">
            Focusing on: <span className="font-bold text-cyan-100">{focusSubject}</span>
          </span>
        </div>
      </motion.div>

      {/* Crystal Orb Container */}
      <div className="relative flex items-center justify-center w-[400px] h-[400px]">
        {/* Outer Glow Rings (Pulsating) */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              "0 0 60px 20px rgba(34, 211, 238, 0.3), 0 0 100px 40px rgba(59, 130, 246, 0.2)",
              "0 0 80px 30px rgba(34, 211, 238, 0.4), 0 0 120px 50px rgba(59, 130, 246, 0.3)",
              "0 0 60px 20px rgba(34, 211, 238, 0.3), 0 0 100px 40px rgba(59, 130, 246, 0.2)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Crystal Orb Sphere */}
        <motion.div
          className="absolute inset-8 rounded-full"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(34, 211, 238, 0.15), rgba(59, 130, 246, 0.05) 50%, rgba(30, 58, 138, 0.1))",
            backdropFilter: "blur(20px)",
            border: "2px solid rgba(34, 211, 238, 0.3)",
            boxShadow: "inset 0 0 60px rgba(34, 211, 238, 0.2), inset 0 0 100px rgba(59, 130, 246, 0.1)",
          }}
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Highlight spot (top-left) for 3D effect */}
          <div 
            className="absolute top-8 left-12 w-24 h-24 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent 70%)",
              filter: "blur(15px)",
            }}
          />
        </motion.div>

        {/* Inner Energy Particles */}
        <div className="absolute inset-16 rounded-full overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (i / 20) * Math.PI * 2;
            const radius = 60 + Math.random() * 40;
            return (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-2 h-2 rounded-full bg-cyan-400"
                style={{
                  left: "50%",
                  top: "50%",
                  filter: "blur(1px)",
                }}
                animate={{
                  x: [
                    Math.cos(angle) * radius,
                    Math.cos(angle + Math.PI) * radius,
                    Math.cos(angle) * radius,
                  ],
                  y: [
                    Math.sin(angle) * radius,
                    Math.sin(angle + Math.PI) * radius,
                    Math.sin(angle) * radius,
                  ],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 6 + Math.random() * 4,
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 3,
                }}
              />
            );
          })}
        </div>

        {/* Progress Ring Inside Orb */}
        <svg
          width="280"
          height="280"
          className="absolute transform -rotate-90 z-10"
        >
          {/* Background Track */}
          <circle
            cx="140"
            cy="140"
            r="110"
            fill="none"
            stroke="rgba(34, 211, 238, 0.1)"
            strokeWidth="3"
          />
          
          {/* Progress Indicator */}
          <motion.circle
            cx="140"
            cy="140"
            r="110"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 110}
            initial={{ strokeDashoffset: 2 * Math.PI * 110 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 110 - (progressPercentage / 100) * 2 * Math.PI * 110 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          {/* Timer Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-7xl font-bold text-cyan-100 tracking-tight font-[family-name:var(--font-nunito)] mb-2"
            style={{
              textShadow: "0 0 20px rgba(34, 211, 238, 0.6), 0 0 40px rgba(34, 211, 238, 0.3)",
            }}
          >
            {formatTime(timeLeft)}
          </motion.div>

          {/* Growing Plant with Glow */}
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
              className="mb-2"
              style={{
                filter: "drop-shadow(0 0 10px rgba(34, 211, 238, 0.5))",
              }}
            >
              {(() => { const Icon = plantStages[currentStage].Icon; return <Icon className="w-12 h-12 text-cyan-200" strokeWidth={1.5} />; })()}
            </motion.div>
          </AnimatePresence>

          {/* Stage Label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-cyan-300/80 text-sm font-[family-name:var(--font-cinzel)]"
          >
            {plantStages[currentStage].label}
          </motion.p>

          {/* Progress Percentage */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-cyan-400/60 text-xs mt-1 font-[family-name:var(--font-quicksand)]"
          >
            {Math.round(progressPercentage)}% Complete
          </motion.p>
        </div>
      </div>

      {/* Ornate Control Bar */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-12"
      >
        <div className="flex items-center gap-3 px-5 py-4 bg-slate-800/60 backdrop-blur-xl rounded-full shadow-lg border border-cyan-500/30">
          {/* Reset Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetTimer}
            className="w-12 h-12 rounded-full bg-slate-700/60 flex items-center justify-center text-cyan-400 hover:text-cyan-300 hover:bg-slate-600/80 transition-colors border border-cyan-500/20"
            title="Reset Timer"
          >
            <Flag className="w-5 h-5" />
          </motion.button>

          {/* Play/Pause Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTimer}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
            title={isActive ? "Pause" : "Start"}
          >
            {isActive ? (
              <Pause className="w-7 h-7" fill="white" />
            ) : (
              <Play className="w-7 h-7 ml-1" fill="white" />
            )}
          </motion.button>

          {/* Fast Forward / Skip Button - admin-only testing tool (removed for
              players; it previously let anyone skip to full XP/gold instantly). */}
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={skipSession}
              title="Admin: skip to completion"
              className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-white/80 transition-colors"
            >
              <FastForward className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Session Dots (Pomodoro count) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-3 mt-8"
      >
        {[...Array(totalSessions)].map((_, i) => (
          <motion.div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < completedSessions
                ? "bg-cyan-400 shadow-lg shadow-cyan-400/50"
                : i === completedSessions && isActive
                ? "bg-cyan-400/60 animate-pulse shadow-md shadow-cyan-400/30"
                : "bg-slate-700 border border-cyan-500/20"
            }`}
            whileHover={{ scale: 1.2 }}
          />
        ))}
      </motion.div>

      {/* Completion Celebration (when timer ends) */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-md z-50"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/30 backdrop-blur-xl rounded-3xl p-8 text-center shadow-2xl max-w-md relative"
              style={{
                boxShadow: "0 0 60px rgba(34, 211, 238, 0.3), inset 0 0 60px rgba(34, 211, 238, 0.1)",
              }}
            >
              {/* Glow effect */}
              <div 
                className="absolute inset-0 rounded-3xl opacity-50 blur-xl"
                style={{
                  background: "radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.2), transparent 70%)",
                }}
              />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-4 relative z-10 flex justify-center"
                style={{
                  filter: "drop-shadow(0 0 20px rgba(34, 211, 238, 0.6))",
                }}
              >
                <Award className="w-16 h-16 text-cyan-300" strokeWidth={1.5} />
              </motion.div>

              <h2 className="text-3xl font-bold text-cyan-100 font-[family-name:var(--font-cinzel)] mb-2 relative z-10">
                Focus Complete!
              </h2>
              <p className="text-cyan-300/80 mt-2 font-[family-name:var(--font-quicksand)] relative z-10">
                Your {plantStages[currentStage].label} has fully matured!
              </p>

              {/* Rewards */}
              <div className="flex items-center justify-center gap-6 mt-6 py-4 px-6 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-xl border border-amber-500/30 relative z-10">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">+{defaultMinutes * 2}</div>
                  <div className="text-xs text-amber-300/80 font-[family-name:var(--font-cinzel)]">XP</div>
                </div>
                <div className="w-px h-10 bg-amber-500/30" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">+{defaultMinutes}</div>
                  <div className="text-xs text-amber-300/80 font-[family-name:var(--font-cinzel)]">Gold</div>
                </div>
                <div className="w-px h-10 bg-amber-500/30" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">{completedSessions}/{totalSessions}</div>
                  <div className="text-xs text-cyan-300/80 font-[family-name:var(--font-cinzel)]">Sessions</div>
                </div>
              </div>

              <div className="flex gap-3 mt-8 justify-center relative z-10">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowReward(false);
                    resetTimer();
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all font-[family-name:var(--font-cinzel)]"
                >
                  {completedSessions >= totalSessions ? "Complete!" : "Continue"}
                </motion.button>
                {onBack && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    className="px-8 py-3 bg-slate-700/60 border border-cyan-500/20 text-cyan-300 font-bold rounded-xl hover:bg-slate-600/70 transition-colors font-[family-name:var(--font-cinzel)]"
                  >
                    Exit
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
