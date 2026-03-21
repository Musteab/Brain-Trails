"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pause,
  Play,
  SkipForward,
  X,
  Droplets,
  Coffee,
  TreePine,
  Music,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGameStore, useUIStore } from "@/stores";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useAmbientSound, type AmbientSound } from "@/hooks/useAmbientSound";
import { supabase } from "@/lib/supabase";

// ─── Types ──────────────────────────────────────────────────────────────────

type Phase = "focus" | "review";

interface Card {
  id: string;
  front: string;
  back: string;
  mastery: number;
}

interface CramModeProps {
  subject: string;
  focusMinutes?: number;
  onExit: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const REVIEW_MINUTES = 5;
const TOTAL_CYCLES = 4;

const AMBIENT_OPTIONS: { key: Exclude<AmbientSound, "none">; icon: typeof Droplets; label: string }[] = [
  { key: "rain", icon: Droplets, label: "Rain" },
  { key: "cafe", icon: Coffee, label: "Café" },
  { key: "forest", icon: TreePine, label: "Forest" },
  { key: "lofi", icon: Music, label: "Lo-Fi" },
];

/**
 * Update the user's streak (mirrors FocusTimer logic).
 */
async function updateStreak(userId: string): Promise<void> {
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("streak_days, streak_last_date")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  if (profile.streak_last_date === todayStr) return;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const newStreak =
    profile.streak_last_date === yesterdayStr
      ? (profile.streak_days || 0) + 1
      : 1;

  await (supabase.from("profiles") as any)
    .update({ streak_days: newStreak, streak_last_date: todayStr })
    .eq("id", userId);
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CramMode({
  subject,
  focusMinutes = 25,
  onExit,
}: CramModeProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { awardXp, awardGold, logActivity } = useGameStore();
  const addToast = useUIStore((s) => s.addToast);
  const playSound = useSoundEffects();
  const ambient = useAmbientSound();

  // ── Phase & timer state ──────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("focus");
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // ── Review-phase flashcard state ─────────────────────────────────────────
  const [cards, setCards] = useState<Card[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = useMemo(
    () => (cards.length > 0 ? cards[cardIndex % cards.length] : null),
    [cards, cardIndex]
  );

  // Track whether component is mounted (avoid state updates after unmount)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Load flashcards for the subject ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    async function loadCards() {
      // Find decks matching the subject name
      const { data: decks } = await (supabase.from("decks") as any)
        .select("id")
        .eq("user_id", user!.id)
        .ilike("name", `%${subject}%`);

      if (!decks || decks.length === 0) return;

      const deckIds = decks.map((d) => d.id);
      const { data: cardsData } = await (supabase.from("cards") as any)
        .select("id, front, back, mastery")
        .in("deck_id", deckIds);

      if (cardsData && cardsData.length > 0) {
        // Shuffle and prioritise lower mastery
        const shuffled = [...cardsData].sort(
          (a, b) => (a.mastery ?? 0) - (b.mastery ?? 0) + (Math.random() - 0.5) * 2
        );
        setCards(shuffled);
      }
    }

    loadCards();
  }, [user, subject]);

  // ── Block navigation (beforeunload) ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // ── Save focus session ───────────────────────────────────────────────────
  const saveFocusSession = useCallback(async () => {
    if (!user || !profile) return;

    const gainedXp = focusMinutes * 2;
    const gainedGold = focusMinutes;

    await (supabase.from("focus_sessions") as any).insert({
      user_id: user.id,
      subject,
      duration_minutes: focusMinutes,
      xp_earned: gainedXp,
      gold_earned: gainedGold,
      mode: "cram",
    });

    await awardXp(user.id, gainedXp);
    await awardGold(user.id, gainedGold);
    await logActivity(user.id, "focus", gainedXp, {
      subject,
      duration: focusMinutes,
      mode: "cram",
    });
    await updateStreak(user.id);

    addToast(`Focus complete! +${gainedXp} XP, +${gainedGold} Gold`, "success");
    refreshProfile();
  }, [user, profile, focusMinutes, subject, awardXp, awardGold, logActivity, addToast, refreshProfile]);

  // ── Timer countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Phase complete
          clearInterval(interval);

          if (phase === "focus") {
            playSound("timerEnd");
            saveFocusSession();
            // Transition to review phase
            setPhase("review");
            setTimeLeft(REVIEW_MINUTES * 60);
            setCardIndex(0);
            setIsFlipped(false);
          } else {
            // Review phase complete → cycle finished
            playSound("success");
            setCompletedCycles((prev) => prev + 1);
            setPhase("focus");
            setTimeLeft(focusMinutes * 60);
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, phase, focusMinutes, playSound, saveFocusSession]);

  // ── Skip phase ───────────────────────────────────────────────────────────
  const skipPhase = useCallback(() => {
    if (phase === "focus") {
      playSound("timerEnd");
      saveFocusSession();
      setPhase("review");
      setTimeLeft(REVIEW_MINUTES * 60);
      setCardIndex(0);
      setIsFlipped(false);
    } else {
      playSound("success");
      setCompletedCycles((prev) => prev + 1);
      setPhase("focus");
      setTimeLeft(focusMinutes * 60);
    }
  }, [phase, focusMinutes, playSound, saveFocusSession]);

  // ── Exit handler ─────────────────────────────────────────────────────────
  const handleExit = useCallback(() => {
    ambient.stop();
    onExit();
  }, [ambient, onExit]);

  // ── Ambient sound toggle ─────────────────────────────────────────────────
  const toggleAmbient = useCallback(
    (sound: Exclude<AmbientSound, "none">) => {
      if (ambient.currentSound === sound && ambient.isPlaying) {
        ambient.stop();
      } else {
        ambient.play(sound);
      }
    },
    [ambient]
  );

  // Current phase total time for progress calculation
  const phaseTotal =
    phase === "focus" ? focusMinutes * 60 : REVIEW_MINUTES * 60;
  const progress = ((phaseTotal - timeLeft) / phaseTotal) * 100;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(145deg, #1a1525 0%, #0f0d1a 50%, #161230 100%)" }}
    >
      {/* Subtle animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-purple-400/20"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.15, 0.35, 0.15],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.7,
            }}
          />
        ))}
      </div>

      {/* ── Top bar: phase indicator + exit ─────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
        {/* Phase badge */}
        <motion.div
          key={phase}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              phase === "focus" ? "bg-purple-400" : "bg-amber-400"
            }`}
          />
          <span className="text-sm font-medium text-white/60 font-[family-name:var(--font-quicksand)] uppercase tracking-widest">
            {phase === "focus" ? "Focus" : "Review"}
          </span>
        </motion.div>

        {/* Exit button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowExitConfirm(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>

      {/* ── Subject name ────────────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-white/40 text-sm font-[family-name:var(--font-quicksand)] mb-8 tracking-wide"
      >
        {subject}
      </motion.p>

      {/* ── Main content area ───────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {phase === "focus" ? (
          <motion.div
            key="focus-phase"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
          >
            {/* Timer */}
            <div className="relative">
              {/* Progress ring */}
              <svg width="240" height="240" className="transform -rotate-90">
                <circle
                  cx="120"
                  cy="120"
                  r="108"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="2"
                />
                <motion.circle
                  cx="120"
                  cy="120"
                  r="108"
                  fill="none"
                  stroke="rgba(168,130,255,0.4)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 108}
                  animate={{
                    strokeDashoffset:
                      2 * Math.PI * 108 - (progress / 100) * 2 * Math.PI * 108,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </svg>

              {/* Time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-white/90 tracking-tight font-[family-name:var(--font-nunito)]">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="review-phase"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center w-full max-w-sm px-6"
          >
            {/* Review timer (compact) */}
            <div className="text-2xl font-bold text-amber-300/70 font-[family-name:var(--font-nunito)] mb-6">
              {formatTime(timeLeft)}
            </div>

            {/* Flashcard */}
            {currentCard ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsFlipped((f) => !f)}
                className="w-full min-h-[200px] rounded-2xl p-6 flex items-center justify-center text-center cursor-pointer transition-colors"
                style={{
                  background: isFlipped
                    ? "rgba(168, 130, 255, 0.1)"
                    : "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${cardIndex}-${isFlipped}`}
                    initial={{ opacity: 0, rotateX: -15 }}
                    animate={{ opacity: 1, rotateX: 0 }}
                    exit={{ opacity: 0, rotateX: 15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-white/80 text-lg font-[family-name:var(--font-quicksand)]">
                      {isFlipped ? currentCard.back : currentCard.front}
                    </p>
                    <p className="text-white/20 text-xs mt-3 font-[family-name:var(--font-quicksand)]">
                      {isFlipped ? "Answer" : "Tap to reveal"}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            ) : (
              <div
                className="w-full min-h-[200px] rounded-2xl p-6 flex items-center justify-center"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-white/30 text-sm font-[family-name:var(--font-quicksand)]">
                  No flashcards found for &quot;{subject}&quot;.
                  <br />
                  Use this time to review your notes.
                </p>
              </div>
            )}

            {/* Next card button */}
            {currentCard && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCardIndex((i) => i + 1);
                  setIsFlipped(false);
                }}
                className="mt-4 px-5 py-2 rounded-full text-sm text-white/50 hover:text-white/70 bg-white/5 hover:bg-white/10 transition-colors font-[family-name:var(--font-quicksand)]"
              >
                Next card →
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom controls ─────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 pb-10 flex flex-col items-center gap-6">
        {/* Ambient sound selector */}
        <div className="flex items-center gap-3">
          {AMBIENT_OPTIONS.map(({ key, icon: Icon, label }) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleAmbient(key)}
              title={label}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                ambient.currentSound === key && ambient.isPlaying
                  ? "bg-purple-500/30 text-purple-300"
                  : "bg-white/5 text-white/25 hover:text-white/50 hover:bg-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
            </motion.button>
          ))}
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-3">
          {/* Pause / Play */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsPaused((p) => {
                if (p) playSound("timerStart");
                return !p;
              });
            }}
            className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 hover:bg-purple-500/30 transition-colors"
          >
            {isPaused ? (
              <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
            ) : (
              <Pause className="w-5 h-5" fill="currentColor" />
            )}
          </motion.button>

          {/* Skip phase */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={skipPhase}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white/50 hover:bg-white/10 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Session dot indicators */}
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < completedCycles
                  ? "bg-purple-400"
                  : i === completedCycles
                  ? "bg-purple-400/40 animate-pulse"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Exit confirmation modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl p-6 max-w-xs w-full mx-6 text-center"
              style={{
                background: "rgba(26, 21, 37, 0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3 className="text-white/80 font-bold text-lg font-[family-name:var(--font-nunito)] mb-2">
                Exit Cram Mode?
              </h3>
              <p className="text-white/40 text-sm font-[family-name:var(--font-quicksand)] mb-6">
                Your current session progress will be lost.
              </p>
              <div className="flex gap-3 justify-center">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowExitConfirm(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/50 bg-white/5 hover:bg-white/10 transition-colors font-[family-name:var(--font-quicksand)]"
                >
                  Stay
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExit}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-red-300 bg-red-500/15 hover:bg-red-500/25 transition-colors font-[family-name:var(--font-quicksand)]"
                >
                  Exit
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
