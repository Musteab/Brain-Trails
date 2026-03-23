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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 via-red-500 to-purple-600">
        <div className="text-center text-white">
          <Flame className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-xl font-bold">Preparing Trial of Fire...</p>
        </div>
      </div>
    );
  }

  // No flashcards
  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 p-6">
        <div className={`max-w-md text-center p-8 rounded-3xl ${
          isSun ? "bg-white/90" : "bg-slate-900/90"
        } backdrop-blur-xl`}>
          <BookOpen className={`w-16 h-16 mx-auto mb-4 ${isSun ? "text-slate-400" : "text-slate-500"}`} />
          <h2 className={`text-2xl font-bold mb-2 ${isSun ? "text-slate-800" : "text-white"}`}>
            No Flashcards Found
          </h2>
          <p className={`mb-6 ${isSun ? "text-slate-600" : "text-slate-400"}`}>
            Create some flashcards for {subjectName} first, then return for your Trial of Fire!
          </p>
          <button
            onClick={onExit}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`max-w-lg w-full p-8 rounded-3xl text-center ${
            isSun ? "bg-white/95" : "bg-slate-900/95"
          } backdrop-blur-xl shadow-2xl`}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <h2 className={`text-3xl font-black mb-2 ${isSun ? "text-slate-800" : "text-white"}`}>
            Trial Complete!
          </h2>
          <p className={`mb-6 ${isSun ? "text-slate-600" : "text-slate-400"}`}>
            You survived the Trial of Fire for {subjectName}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`p-4 rounded-2xl ${isSun ? "bg-slate-100" : "bg-white/10"}`}>
              <Target className={`w-6 h-6 mx-auto mb-2 ${isSun ? "text-emerald-500" : "text-emerald-400"}`} />
              <div className={`text-2xl font-black ${isSun ? "text-emerald-600" : "text-emerald-400"}`}>
                {accuracy}%
              </div>
              <div className={`text-xs ${isSun ? "text-slate-500" : "text-slate-400"}`}>Accuracy</div>
            </div>
            <div className={`p-4 rounded-2xl ${isSun ? "bg-slate-100" : "bg-white/10"}`}>
              <Flame className={`w-6 h-6 mx-auto mb-2 ${isSun ? "text-orange-500" : "text-orange-400"}`} />
              <div className={`text-2xl font-black ${isSun ? "text-orange-600" : "text-orange-400"}`}>
                {stats.bestStreak}
              </div>
              <div className={`text-xs ${isSun ? "text-slate-500" : "text-slate-400"}`}>Best Streak</div>
            </div>
            <div className={`p-4 rounded-2xl ${isSun ? "bg-slate-100" : "bg-white/10"}`}>
              <Brain className={`w-6 h-6 mx-auto mb-2 ${isSun ? "text-purple-500" : "text-purple-400"}`} />
              <div className={`text-2xl font-black ${isSun ? "text-purple-600" : "text-purple-400"}`}>
                {stats.cardsReviewed}
              </div>
              <div className={`text-xs ${isSun ? "text-slate-500" : "text-slate-400"}`}>Cards Reviewed</div>
            </div>
            <div className={`p-4 rounded-2xl ${isSun ? "bg-slate-100" : "bg-white/10"}`}>
              <Timer className={`w-6 h-6 mx-auto mb-2 ${isSun ? "text-blue-500" : "text-blue-400"}`} />
              <div className={`text-2xl font-black ${isSun ? "text-blue-600" : "text-blue-400"}`}>
                {formatTime(sessionTime)}
              </div>
              <div className={`text-xs ${isSun ? "text-slate-500" : "text-slate-400"}`}>Time</div>
            </div>
          </div>

          {/* Rewards */}
          <div className={`flex items-center justify-center gap-6 mb-8 py-4 px-6 rounded-xl ${
            isSun ? "bg-amber-50 border border-amber-200" : "bg-amber-500/10 border border-amber-500/20"
          }`}>
            <div className="text-center">
              <div className={`text-xl font-black ${isSun ? "text-amber-600" : "text-amber-400"}`}>
                +{Math.floor(sessionTime / 60) * 5 + stats.bestStreak * 2 + (accuracy >= 80 ? 50 : accuracy >= 60 ? 25 : 0)}
              </div>
              <div className={`text-xs ${isSun ? "text-amber-500" : "text-amber-500"}`}>XP Earned</div>
            </div>
            <div className={`w-px h-8 ${isSun ? "bg-amber-200" : "bg-amber-500/30"}`} />
            <div className="text-center">
              <div className={`text-xl font-black ${isSun ? "text-amber-600" : "text-amber-400"}`}>
                +{Math.floor((Math.floor(sessionTime / 60) * 5 + stats.bestStreak * 2) / 3)}
              </div>
              <div className={`text-xs ${isSun ? "text-amber-500" : "text-amber-500"}`}>Gold</div>
            </div>
          </div>

          <button
            onClick={onExit}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl text-lg hover:shadow-lg transition-all"
          >
            Exit Trial
          </button>
        </motion.div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  // Main cram interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit
        </button>

        <div className="flex items-center gap-4">
          {/* Streak indicator */}
          {stats.streakCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-400/30 backdrop-blur-sm text-white rounded-xl"
            >
              <Flame className="w-5 h-5 text-orange-300" />
              <span className="font-bold">{stats.streakCount}x Streak</span>
            </motion.div>
          )}

          {/* Timer */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl">
            <Timer className="w-5 h-5" />
            <span className="font-mono font-bold">{formatTime(sessionTime)}</span>
            <span className="text-white/60">/ {formatTime(targetTime)}</span>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="px-6">
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        {!isActive ? (
          // Start screen
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Flame className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Trial of Fire</h1>
            <p className="text-white/80 mb-8 text-lg">{subjectName}</p>

            {/* Time selector */}
            <div className="flex items-center justify-center gap-3 mb-8">
              {[5, 10, 15, 25].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setTargetTime(mins * 60)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    targetTime === mins * 60
                      ? "bg-white text-red-500"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>

            <p className="text-white/60 mb-6">{flashcards.length} flashcards ready</p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsActive(true);
                playSound("timerStart");
              }}
              className="px-10 py-5 bg-white text-red-500 font-black text-xl rounded-2xl shadow-2xl hover:shadow-white/20 transition-all flex items-center gap-3 mx-auto"
            >
              <Play className="w-6 h-6" fill="currentColor" />
              Begin Trial
            </motion.button>
          </motion.div>
        ) : (
          // Flashcard review
          <div className="w-full max-w-xl">
            {/* Card counter */}
            <div className="text-center mb-6">
              <span className="text-white/80 text-sm">
                Card {currentIndex + 1} of {flashcards.length}
              </span>
            </div>

            {/* Flashcard */}
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="perspective-1000"
            >
              <motion.div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`relative w-full aspect-[3/2] cursor-pointer ${
                  isSun ? "bg-white" : "bg-slate-900"
                } rounded-3xl shadow-2xl p-8 flex items-center justify-center`}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front */}
                <div
                  className={`absolute inset-0 flex items-center justify-center p-8 backface-hidden ${
                    isFlipped ? "invisible" : ""
                  }`}
                >
                  <div className="text-center">
                    <Sparkles className={`w-8 h-8 mx-auto mb-4 ${isSun ? "text-purple-400" : "text-purple-500"}`} />
                    <p className={`text-2xl font-bold ${isSun ? "text-slate-800" : "text-white"}`}>
                      {currentCard.front}
                    </p>
                    <p className={`text-sm mt-4 ${isSun ? "text-slate-400" : "text-slate-500"}`}>
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
                    <Brain className={`w-8 h-8 mx-auto mb-4 ${isSun ? "text-emerald-400" : "text-emerald-500"}`} />
                    <p className={`text-xl ${isSun ? "text-slate-700" : "text-slate-200"}`}>
                      {currentCard.back}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Answer buttons (shown when flipped) */}
            <AnimatePresence>
              {isFlipped && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-4 mt-8"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer(false)}
                    className="flex items-center gap-2 px-8 py-4 bg-red-500/20 border-2 border-red-400 text-red-300 font-bold rounded-2xl hover:bg-red-500/30 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                    Wrong
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer(true)}
                    className="flex items-center gap-2 px-8 py-4 bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-bold rounded-2xl hover:bg-emerald-500/30 transition-colors"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    Correct
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setIsActive(!isActive)}
                className="p-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors"
              >
                {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex((prev) => (prev + 1) % flashcards.length);
                }}
                className="p-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Stats footer */}
      {isActive && (
        <footer className="px-6 py-4">
          <div className="flex items-center justify-center gap-6 text-white/80 text-sm">
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
