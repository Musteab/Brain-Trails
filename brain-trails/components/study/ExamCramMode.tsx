"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, Play, Pause, SkipForward, RotateCcw, CheckCircle2, 
  XCircle, BookOpen, Brain, Zap, Trophy, ArrowLeft, Timer,
  Sparkles, Target
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGameStore, useUIStore } from "@/stores";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface CramStats {
  cardsReviewed: number;
  correctAnswers: number;
  wrongAnswers: number;
  streakCount: number;
  bestStreak: number;
  timeSpent: number;
}

interface ExamCramModeProps {
  subjectId: string;
  subjectName: string;
  onExit: () => void;
}

/**
 * Exam Cram Mode ("Trial of Fire")
 * 
 * A distraction-free, intense study loop that cycles through:
 * 1. Flashcard review (spaced repetition style)
 * 2. Quick quiz questions
 * 3. Note highlights
 * 
 * Features:
 * - Fullscreen immersive mode
 * - Streak tracking with combo bonuses
 * - XP multipliers for consecutive correct answers
 * - Timer-based sessions
 * - Progress tracking
 */
export default function ExamCramMode({ subjectId, subjectName, onExit }: ExamCramModeProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { awardXp, awardGold, logActivity } = useGameStore();
  const { addToast } = useUIStore();
  const playSound = useSoundEffects();
  const { theme } = useTheme();
  const isSun = theme === "sun";

  // Session state
  const [isActive, setIsActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [targetTime, setTargetTime] = useState(15 * 60); // 15 minutes default

  // Content state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState<CramStats>({
    cardsReviewed: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    streakCount: 0,
    bestStreak: 0,
    timeSpent: 0,
  });

  // Session complete
  const [isComplete, setIsComplete] = useState(false);

  // Refs for timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch flashcards for the subject
  useEffect(() => {
    if (!user || !subjectId) return;

    const fetchContent = async () => {
      // Get decks for this subject
      const { data: decks } = await (supabase.from("decks") as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("subject_id", subjectId);

      if (!decks || decks.length === 0) {
        setIsLoading(false);
        return;
      }

      const deckIds = decks.map((d: { id: string }) => d.id);

      // Get cards from those decks
      const { data: cards } = await (supabase.from("cards") as any)
        .select("id, front, back")
        .in("deck_id", deckIds)
        .limit(50);

      if (cards && cards.length > 0) {
        // Shuffle cards
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        setFlashcards(shuffled);
      }

      setIsLoading(false);
    };

    fetchContent();
  }, [user, subjectId]);

  // Timer logic
  useEffect(() => {
    if (isActive && !isComplete) {
      timerRef.current = setInterval(() => {
        setSessionTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= targetTime) {
            handleSessionComplete();
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, isComplete, targetTime]);

  const handleSessionComplete = useCallback(async () => {
    setIsActive(false);
    setIsComplete(true);
    playSound("timerEnd");

    if (!user || !profile) return;

    // Calculate rewards
    const accuracy = stats.cardsReviewed > 0 
      ? Math.round((stats.correctAnswers / stats.cardsReviewed) * 100) 
      : 0;
    
    const baseXp = Math.floor(sessionTime / 60) * 5; // 5 XP per minute
    const streakBonus = stats.bestStreak * 2;
    const accuracyBonus = accuracy >= 80 ? 50 : accuracy >= 60 ? 25 : 0;
    const totalXp = baseXp + streakBonus + accuracyBonus;
    
    const goldEarned = Math.floor(totalXp / 3);

    await awardXp(user.id, totalXp);
    await awardGold(user.id, goldEarned);
    await logActivity(user.id, "flashcard", totalXp, {
      subject_id: subjectId,
      mode: "exam_cram",
      cards_reviewed: stats.cardsReviewed,
      accuracy,
      best_streak: stats.bestStreak,
      time_spent: sessionTime,
    });

    refreshProfile();
  }, [user, profile, sessionTime, stats, subjectId, awardXp, awardGold, logActivity, playSound, refreshProfile]);

  const handleAnswer = (correct: boolean) => {
    playSound(correct ? "success" : "click");

    setStats((prev) => {
      const newStreak = correct ? prev.streakCount + 1 : 0;
      return {
        ...prev,
        cardsReviewed: prev.cardsReviewed + 1,
        correctAnswers: prev.correctAnswers + (correct ? 1 : 0),
        wrongAnswers: prev.wrongAnswers + (correct ? 0 : 1),
        streakCount: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
      };
    });

    // Move to next card
    setTimeout(() => {
      setIsFlipped(false);
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Reshuffle and restart
        setFlashcards((prev) => [...prev].sort(() => Math.random() - 0.5));
        setCurrentIndex(0);
      }
    }, 300);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = (sessionTime / targetTime) * 100;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-900">
        <div className="text-center text-orange-300">
          <Flame className="w-16 h-16 mx-auto mb-4 animate-pulse text-orange-400" />
          <p className="text-xl font-bold font-[family-name:var(--font-cinzel)]">
            Preparing Trial of Fire...
          </p>
        </div>
      </div>
    );
  }

  // No flashcards
  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 p-6">
        <div className={`max-w-md text-center p-8 rounded-3xl ${
          isSun ? "bg-slate-800/90" : "bg-slate-900/90"
        } backdrop-blur-xl border border-orange-500/30`}>
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-orange-400/60" />
          <h2 className="text-2xl font-bold mb-2 text-orange-100 font-[family-name:var(--font-cinzel)]">
            No Flashcards Found
          </h2>
          <p className="mb-6 text-orange-300/80 font-[family-name:var(--font-quicksand)]">
            Create some flashcards for {subjectName} first, then return for your Trial of Fire!
          </p>
          <button
            onClick={onExit}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 font-[family-name:var(--font-cinzel)]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Session complete
  if (isComplete) {
    const accuracy = stats.cardsReviewed > 0 
      ? Math.round((stats.correctAnswers / stats.cardsReviewed) * 100) 
      : 0;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 p-6 relative overflow-hidden">
        {/* Flame particles background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={`completion-flame-${i}`}
              className="absolute w-1 h-1 rounded-full bg-orange-400/60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.8, 2, 0.8],
                y: [0, -30, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full p-8 rounded-3xl text-center bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-orange-500/40 backdrop-blur-xl shadow-2xl relative z-10"
          style={{
            boxShadow: "0 0 60px rgba(249, 115, 22, 0.3), inset 0 0 60px rgba(249, 115, 22, 0.1)",
          }}
        >
          {/* Victory fire orb */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center relative"
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 30px 10px rgba(249, 115, 22, 0.4)",
                  "0 0 40px 15px rgba(249, 115, 22, 0.5)",
                  "0 0 30px 10px rgba(249, 115, 22, 0.4)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(249, 115, 22, 0.3), rgba(239, 68, 68, 0.15))",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(249, 115, 22, 0.5)",
              }}
            >
              <Trophy className="w-10 h-10 text-orange-300 absolute inset-0 m-auto" />
            </div>
          </motion.div>

          <h2 className="text-3xl font-black mb-2 text-orange-100 font-[family-name:var(--font-cinzel)]">
            Trial Complete!
          </h2>
          <p className="mb-6 text-orange-300/80 font-[family-name:var(--font-quicksand)]">
            You survived the Trial of Fire for {subjectName}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30">
              <Target className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
              <div className="text-2xl font-black text-emerald-400">
                {accuracy}%
              </div>
              <div className="text-xs text-emerald-300/80 font-[family-name:var(--font-cinzel)]">Accuracy</div>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30">
              <Flame className="w-6 h-6 mx-auto mb-2 text-orange-400" />
              <div className="text-2xl font-black text-orange-400">
                {stats.bestStreak}
              </div>
              <div className="text-xs text-orange-300/80 font-[family-name:var(--font-cinzel)]">Best Streak</div>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/30">
              <Brain className="w-6 h-6 mx-auto mb-2 text-purple-400" />
              <div className="text-2xl font-black text-purple-400">
                {stats.cardsReviewed}
              </div>
              <div className="text-xs text-purple-300/80 font-[family-name:var(--font-cinzel)]">Cards Reviewed</div>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
              <Timer className="w-6 h-6 mx-auto mb-2 text-blue-400" />
              <div className="text-2xl font-black text-blue-400">
                {formatTime(sessionTime)}
              </div>
              <div className="text-xs text-blue-300/80 font-[family-name:var(--font-cinzel)]">Time</div>
            </div>
          </div>

          {/* Rewards */}
          <div className="flex items-center justify-center gap-6 mb-8 py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
            <div className="text-center">
              <div className="text-xl font-black text-amber-400">
                +{Math.floor(sessionTime / 60) * 5 + stats.bestStreak * 2 + (accuracy >= 80 ? 50 : accuracy >= 60 ? 25 : 0)}
              </div>
              <div className="text-xs text-amber-300/80 font-[family-name:var(--font-cinzel)]">XP Earned</div>
            </div>
            <div className="w-px h-10 bg-amber-500/30" />
            <div className="text-center">
              <div className="text-xl font-black text-amber-400">
                +{Math.floor((Math.floor(sessionTime / 60) * 5 + stats.bestStreak * 2) / 3)}
              </div>
              <div className="text-xs text-amber-300/80 font-[family-name:var(--font-cinzel)]">Gold</div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExit}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl text-lg hover:shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all font-[family-name:var(--font-cinzel)]"
          >
            Exit Trial
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  // Main cram interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex flex-col relative overflow-hidden">
      {/* Flickering flame particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={`flame-${i}`}
            className="absolute w-1 h-1 rounded-full bg-orange-400/60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.8, 1.5, 0.8],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 relative z-10">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 backdrop-blur-sm text-orange-300 rounded-xl hover:bg-slate-700/70 transition-colors border border-orange-500/20 shadow-lg shadow-orange-500/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium font-[family-name:var(--font-cinzel)]">Exit</span>
        </motion.button>

        <div className="flex items-center gap-4">
          {/* Streak indicator with flame */}
          {stats.streakCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm text-orange-300 rounded-xl border border-orange-500/30"
            >
              <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
              <span className="font-bold font-[family-name:var(--font-cinzel)]">{stats.streakCount}x Streak</span>
            </motion.div>
          )}

          {/* Timer display */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 backdrop-blur-sm text-orange-300 rounded-xl border border-orange-500/20">
            <Timer className="w-5 h-5" />
            <span className="font-mono font-bold">{formatTime(sessionTime)}</span>
            <span className="text-orange-400/60">/ {formatTime(targetTime)}</span>
          </div>
        </div>
      </header>

      {/* Progress bar with fire gradient */}
      <div className="px-6 relative z-10">
        <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden border border-orange-500/20">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            style={{
              boxShadow: "0 0 10px rgba(249, 115, 22, 0.6)",
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        {!isActive ? (
          // Start screen with fire crystal
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Mini Fire Orb */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  boxShadow: [
                    "0 0 40px 10px rgba(249, 115, 22, 0.4), 0 0 60px 20px rgba(239, 68, 68, 0.3)",
                    "0 0 60px 20px rgba(249, 115, 22, 0.5), 0 0 80px 30px rgba(239, 68, 68, 0.4)",
                    "0 0 40px 10px rgba(249, 115, 22, 0.4), 0 0 60px 20px rgba(239, 68, 68, 0.3)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle at 35% 35%, rgba(249, 115, 22, 0.3), rgba(239, 68, 68, 0.15) 50%, rgba(127, 29, 29, 0.2))",
                  backdropFilter: "blur(15px)",
                  border: "2px solid rgba(249, 115, 22, 0.4)",
                  boxShadow: "inset 0 0 40px rgba(249, 115, 22, 0.3)",
                }}
              >
                <Flame className="w-16 h-16 text-orange-400 absolute inset-0 m-auto animate-pulse" />
              </div>
            </div>

            <h1 className="text-5xl font-black text-orange-100 mb-2 font-[family-name:var(--font-cinzel)]">
              Trial of Fire
            </h1>
            <p className="text-orange-300/80 mb-10 text-lg font-[family-name:var(--font-quicksand)]">
              {subjectName}
            </p>

            {/* Time selector */}
            <div className="flex items-center justify-center gap-3 mb-8">
              {[5, 10, 15, 25].map((mins) => (
                <motion.button
                  key={mins}
                  onClick={() => setTargetTime(mins * 60)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-5 py-3 rounded-xl font-bold transition-all border font-[family-name:var(--font-cinzel)] ${
                    targetTime === mins * 60
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400 shadow-lg shadow-orange-500/30"
                      : "bg-slate-800/60 text-orange-300 border-orange-500/20 hover:bg-slate-700/70"
                  }`}
                >
                  {mins} min
                </motion.button>
              ))}
            </div>

            <p className="text-orange-400/60 mb-8 font-[family-name:var(--font-quicksand)]">
              {flashcards.length} flashcards ready
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsActive(true);
                playSound("timerStart");
              }}
              className="px-10 py-5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-xl rounded-2xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all flex items-center gap-3 mx-auto font-[family-name:var(--font-cinzel)]"
            >
              <Play className="w-6 h-6" fill="currentColor" />
              Begin Trial
            </motion.button>
          </motion.div>
        ) : (
          // Flashcard review with Fire Crystal Orb
          <div className="w-full max-w-2xl">
            {/* Card counter */}
            <div className="text-center mb-6">
              <span className="text-orange-300/80 text-sm font-[family-name:var(--font-cinzel)]">
                Card {currentIndex + 1} of {flashcards.length}
              </span>
            </div>

            {/* Fire Crystal Orb containing flashcard */}
            <div className="relative w-full h-[500px] flex items-center justify-center">
              {/* Outer Glow Rings (Pulsating Fire) */}
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  boxShadow: [
                    "0 0 80px 30px rgba(249, 115, 22, 0.3), 0 0 120px 50px rgba(239, 68, 68, 0.2)",
                    "0 0 100px 40px rgba(249, 115, 22, 0.4), 0 0 150px 60px rgba(239, 68, 68, 0.3)",
                    "0 0 80px 30px rgba(249, 115, 22, 0.3), 0 0 120px 50px rgba(239, 68, 68, 0.2)",
                  ],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Fire Crystal Orb Sphere */}
              <motion.div
                className="absolute inset-12 rounded-full"
                style={{
                  background: "radial-gradient(circle at 30% 30%, rgba(249, 115, 22, 0.2), rgba(239, 68, 68, 0.08) 50%, rgba(127, 29, 29, 0.15))",
                  backdropFilter: "blur(25px)",
                  border: "2px solid rgba(249, 115, 22, 0.4)",
                  boxShadow: "inset 0 0 80px rgba(249, 115, 22, 0.3), inset 0 0 120px rgba(239, 68, 68, 0.15)",
                }}
                animate={{
                  scale: [1, 1.03, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* Highlight spot for 3D effect */}
                <div 
                  className="absolute top-12 left-16 w-32 h-32 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(255, 200, 150, 0.4), transparent 70%)",
                    filter: "blur(20px)",
                  }}
                />
              </motion.div>

              {/* Inner Fire Particles */}
              <div className="absolute inset-20 rounded-full overflow-hidden">
                {Array.from({ length: 15 }).map((_, i) => {
                  const angle = (i / 15) * Math.PI * 2;
                  const radius = 70 + Math.random() * 50;
                  return (
                    <motion.div
                      key={`orb-particle-${i}`}
                      className="absolute w-2 h-2 rounded-full bg-orange-400"
                      style={{
                        left: "50%",
                        top: "50%",
                        filter: "blur(1.5px)",
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
                        opacity: [0.4, 0.9, 0.4],
                      }}
                      transition={{
                        duration: 5 + Math.random() * 3,
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 2,
                      }}
                    />
                  );
                })}
              </div>

              {/* Flashcard Content in Center */}
              <motion.div
                key={currentCard.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-20 w-[350px] h-[280px] cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <motion.div
                  className={`w-full h-full rounded-2xl shadow-2xl ${
                    isSun ? "bg-slate-800/90" : "bg-slate-900/90"
                  } backdrop-blur-md border-2 ${
                    isFlipped ? "border-emerald-500/50" : "border-orange-500/50"
                  } p-8 flex items-center justify-center`}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Front */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center p-8 backface-hidden ${
                      isFlipped ? "invisible" : ""
                    }`}
                  >
                    <div className="text-center">
                      <Sparkles className="w-10 h-10 mx-auto mb-4 text-orange-400" />
                      <p className="text-2xl font-bold text-orange-100 font-[family-name:var(--font-quicksand)]">
                        {currentCard.front}
                      </p>
                      <p className="text-sm mt-6 text-orange-300/60 font-[family-name:var(--font-cinzel)]">
                        Tap to reveal answer
                      </p>
                    </div>
                  </div>

                  {/* Back */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center p-8 backface-hidden ${
                      !isFlipped ? "invisible" : ""
                    }`}
                    style={{ transform: "rotateY(180deg)" }}
                  >
                    <div className="text-center">
                      <Brain className="w-10 h-10 mx-auto mb-4 text-emerald-400" />
                      <p className="text-xl text-emerald-100 font-[family-name:var(--font-quicksand)]">
                        {currentCard.back}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Answer buttons (shown when flipped) */}
            <AnimatePresence>
              {isFlipped && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-5 mt-8"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer(false)}
                    className="flex items-center gap-2 px-8 py-4 bg-red-500/20 border-2 border-red-400 text-red-300 font-bold rounded-2xl hover:bg-red-500/30 transition-colors shadow-lg shadow-red-500/20 font-[family-name:var(--font-cinzel)]"
                  >
                    <XCircle className="w-6 h-6" />
                    Wrong
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer(true)}
                    className="flex items-center gap-2 px-8 py-4 bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-bold rounded-2xl hover:bg-emerald-500/30 transition-colors shadow-lg shadow-emerald-500/20 font-[family-name:var(--font-cinzel)]"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    Correct
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsActive(!isActive)}
                className="p-3 bg-slate-800/60 text-orange-300 rounded-xl hover:bg-slate-700/70 transition-colors border border-orange-500/20"
                title={isActive ? "Pause" : "Resume"}
              >
                {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex((prev) => (prev + 1) % flashcards.length);
                }}
                className="p-3 bg-slate-800/60 text-orange-300 rounded-xl hover:bg-slate-700/70 transition-colors border border-orange-500/20"
                title="Skip Card"
              >
                <SkipForward className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        )}
      </main>

      {/* Stats footer */}
      {isActive && (
        <footer className="px-6 py-4 relative z-10">
          <div className="flex items-center justify-center gap-8 text-orange-300/80 text-sm font-[family-name:var(--font-cinzel)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {stats.correctAnswers} correct
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              {stats.wrongAnswers} wrong
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Best: {stats.bestStreak}x
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
