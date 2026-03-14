"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Heart, Swords, ArrowLeft, RotateCcw, Trophy, Skull, Sparkles } from "lucide-react";
import { type Boss, DAMAGE_PER_HIT, PLAYER_MAX_HEARTS } from "@/lib/bosses";
import { useAuth } from "@/context/AuthContext";
import { useGameStore } from "@/stores";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { supabase } from "@/lib/supabase";

interface Card {
  id: string;
  front: string;
  back: string;
  mastery: number;
}

interface BossBattleProps {
  boss: Boss;
  deckId: string;
  deckName: string;
  onExit: () => void;
}

type BattlePhase = "intro" | "question" | "reveal" | "victory" | "defeat";

/**
 * BossBattle — The core flashcard boss fight.
 *
 * Flow: intro → question → reveal → (loop) → victory/defeat
 * Correct answer → deal DAMAGE_PER_HIT to boss.
 * Wrong answer → lose 1 heart.
 * Win when bossHp <= 0. Lose when hearts <= 0.
 */
export default function BossBattle({ boss, deckId, deckName, onExit }: BossBattleProps) {
  const { user } = useAuth();
  const playSound = useSoundEffects();

  // Battle state
  const [phase, setPhase] = useState<BattlePhase>("intro");
  const [bossHp, setBossHp] = useState(boss.hp);
  const [hearts, setHearts] = useState(PLAYER_MAX_HEARTS);
  const [cards, setCards] = useState<Card[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [cardsAnswered, setCardsAnswered] = useState(0);
  const [cardsCorrect, setCardsCorrect] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);

  const currentCard = useMemo(() => {
    if (cards.length === 0) return null;
    return cards[cardIndex % cards.length];
  }, [cards, cardIndex]);

  // Load cards from the selected deck
  useEffect(() => {
    async function loadCards() {
      const { data, error } = await supabase
        .from("cards")
        .select("id, front, back, mastery")
        .eq("deck_id", deckId);

      if (error) {
        console.error("[BossBattle] Failed to load cards:", error);
        return;
      }

      if (data && data.length > 0) {
        // Shuffle cards
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setCards(shuffled);
      }
    }
    loadCards();
  }, [deckId]);

  // Save battle result to DB
  const saveBattleResult = useCallback(
    async (result: "victory" | "defeat", answered: number, correct: number) => {
      if (!user) return;

      const xpEarned = result === "victory" ? boss.xpReward : 0;
      const goldEarned = result === "victory" ? boss.goldReward : 0;

      await supabase.from("boss_battles").insert({
        user_id: user.id,
        boss_id: boss.id,
        deck_id: deckId,
        result,
        damage_dealt: correct * DAMAGE_PER_HIT,
        cards_answered: answered,
        cards_correct: correct,
        xp_earned: xpEarned,
        gold_earned: goldEarned,
      });

      if (result === "victory") {
        await useGameStore.getState().awardXp(user.id, xpEarned);
        await useGameStore.getState().awardGold(user.id, goldEarned);
        await useGameStore.getState().logActivity(user.id, "quest", xpEarned, {
          type: "boss_battle",
          boss_name: boss.name,
          boss_id: boss.id,
          deck_name: deckName,
        });
      }
    },
    [user, boss, deckId, deckName]
  );

  // Handle correct answer
  const handleCorrect = useCallback(() => {
    const newHp = Math.max(0, bossHp - DAMAGE_PER_HIT);
    const newAnswered = cardsAnswered + 1;
    const newCorrect = cardsCorrect + 1;

    setBossHp(newHp);
    setCardsAnswered(newAnswered);
    setCardsCorrect(newCorrect);
    setDamageFlash(true);
    setTimeout(() => setDamageFlash(false), 400);
    playSound("success");

    if (newHp <= 0) {
      setPhase("victory");
      playSound("levelUp");
      saveBattleResult("victory", newAnswered, newCorrect);
    } else {
      setCardIndex((i) => i + 1);
      setPhase("question");
    }
  }, [bossHp, cardsAnswered, cardsCorrect, playSound, saveBattleResult]);

  // Handle wrong answer
  const handleWrong = useCallback(() => {
    const newHearts = hearts - 1;
    const newAnswered = cardsAnswered + 1;

    setHearts(newHearts);
    setCardsAnswered(newAnswered);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    playSound("error");

    if (newHearts <= 0) {
      setPhase("defeat");
      saveBattleResult("defeat", newAnswered, cardsCorrect);
    } else {
      setCardIndex((i) => i + 1);
      setPhase("question");
    }
  }, [hearts, cardsAnswered, cardsCorrect, playSound, saveBattleResult]);

  const startBattle = () => {
    playSound("timerStart");
    setPhase("question");
  };

  const hpPercent = Math.max(0, (bossHp / boss.hp) * 100);

  // ── Intro Screen ──────────────────────────────────────

  if (phase === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mb-6"
          >
            <Image
              src={boss.icon}
              alt={boss.name}
              width={120}
              height={120}
              className="mx-auto drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]"
            />
          </motion.div>

          <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-nunito)] mb-2">
            {boss.name}
          </h1>
          <p className="text-red-300/80 text-sm mb-1">{boss.description}</p>
          <p className="text-slate-400 text-xs mb-6">
            HP: {boss.hp} &middot; Deck: {deckName} &middot; {cards.length} cards loaded
          </p>

          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onExit}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white text-sm font-bold border border-white/20"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={startBattle}
              disabled={cards.length === 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-red-500/30 disabled:opacity-40"
            >
              <Swords className="w-4 h-4 inline mr-1" /> Fight!
            </motion.button>
          </div>
          {cards.length === 0 && (
            <p className="text-red-400 text-xs mt-3">
              This deck has no cards. Add cards to your deck first!
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Victory Screen ────────────────────────────────────

  if (phase === "victory") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-4" />
          </motion.div>

          <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-nunito)] mb-2">
            Victory!
          </h1>
          <p className="text-amber-300/80 text-sm mb-6">
            You defeated {boss.name}!
          </p>

          <div className="flex justify-center gap-6 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{boss.xpReward}</p>
              <p className="text-xs text-slate-400">XP Earned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{boss.goldReward}</p>
              <p className="text-xs text-slate-400">Gold Earned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {cardsCorrect}/{cardsAnswered}
              </p>
              <p className="text-xs text-slate-400">Accuracy</p>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onExit}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white text-sm font-bold border border-white/20"
            >
              Back to Bosses
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setBossHp(boss.hp);
                setHearts(PLAYER_MAX_HEARTS);
                setCardIndex(0);
                setCardsAnswered(0);
                setCardsCorrect(0);
                setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
                setPhase("intro");
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-bold shadow-lg"
            >
              <RotateCcw className="w-4 h-4 inline mr-1" /> Rematch
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Defeat Screen ─────────────────────────────────────

  if (phase === "defeat") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <Skull className="w-20 h-20 text-red-400 mx-auto mb-4" />

          <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-nunito)] mb-2">
            Defeated...
          </h1>
          <p className="text-red-300/80 text-sm mb-2">
            {boss.name} was too powerful this time.
          </p>
          <p className="text-slate-400 text-xs mb-6">
            You got {cardsCorrect}/{cardsAnswered} correct and dealt{" "}
            {cardsCorrect * DAMAGE_PER_HIT} damage.
          </p>

          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onExit}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white text-sm font-bold border border-white/20"
            >
              Back to Bosses
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setBossHp(boss.hp);
                setHearts(PLAYER_MAX_HEARTS);
                setCardIndex(0);
                setCardsAnswered(0);
                setCardsCorrect(0);
                setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
                setPhase("intro");
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold shadow-lg"
            >
              <RotateCcw className="w-4 h-4 inline mr-1" /> Retry
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Battle Screen (question / reveal) ─────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950/50 to-slate-900 flex flex-col">
      {/* Top Bar: Boss HP + Player Hearts */}
      <div className="px-4 pt-6 pb-3">
        <div className="max-w-lg mx-auto">
          {/* Boss info */}
          <div className="flex items-center gap-3 mb-3">
            <motion.div animate={damageFlash ? { x: [-4, 4, -4, 0] } : {}}>
              <Image src={boss.icon} alt={boss.name} width={40} height={40} />
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white">{boss.name}</span>
                <span className="text-xs text-red-300">{bossHp}/{boss.hp} HP</span>
              </div>
              <div className="h-3 bg-red-900/50 rounded-full overflow-hidden border border-red-500/30">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                  animate={{ width: `${hpPercent}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                />
              </div>
            </div>
          </div>

          {/* Player hearts */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {Array.from({ length: PLAYER_MAX_HEARTS }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={
                    isShaking && i === hearts
                      ? { scale: [1, 0, 1], opacity: [1, 0, 0] }
                      : {}
                  }
                >
                  <Heart
                    className={`w-6 h-6 ${
                      i < hearts
                        ? "text-red-500 fill-red-500"
                        : "text-slate-700 fill-slate-700"
                    }`}
                  />
                </motion.div>
              ))}
            </div>
            <span className="text-xs text-slate-400">
              Card {cardIndex + 1} &middot; {cardsCorrect}/{cardsAnswered} correct
            </span>
          </div>
        </div>
      </div>

      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center px-4 pb-24">
        <div className="max-w-lg w-full">
          {currentCard ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`card-${cardIndex}`}
                initial={{ opacity: 0, y: 30, rotateY: -10 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.3 }}
              >
                {/* Card face */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8 min-h-[220px] flex flex-col items-center justify-center text-center mb-6">
                  {phase === "question" ? (
                    <>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-4">
                        Question
                      </p>
                      <p className="text-lg text-white font-medium leading-relaxed">
                        {currentCard.front}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-emerald-400 uppercase tracking-wider mb-4">
                        Answer
                      </p>
                      <p className="text-lg text-white font-medium leading-relaxed">
                        {currentCard.back}
                      </p>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                {phase === "question" ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      playSound("cardFlip");
                      setPhase("reveal");
                    }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-base shadow-lg shadow-indigo-500/30"
                  >
                    Reveal Answer
                  </motion.button>
                ) : (
                  <div className="flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleWrong}
                      className="flex-1 py-4 rounded-2xl bg-red-500/20 text-red-400 font-bold text-base border-2 border-red-500/30 hover:bg-red-500/30 transition-colors"
                    >
                      <Skull className="w-5 h-5 inline mr-1.5" />
                      Missed
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCorrect}
                      className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors"
                    >
                      <Sparkles className="w-5 h-5 inline mr-1.5" />
                      Got it!
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center">
              <p className="text-slate-400 text-sm">Loading cards...</p>
            </div>
          )}
        </div>
      </div>

      {/* Back button */}
      <div className="fixed top-6 left-4 z-20">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onExit}
          className="p-2 rounded-xl bg-white/10 border border-white/20 text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
