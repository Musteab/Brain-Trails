"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Swords, ChevronRight, BookOpen, AlertCircle } from "lucide-react";
import { BOSSES, type Boss, getDifficultyStyle } from "@/lib/bosses";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { supabase } from "@/lib/supabase";

interface Deck {
  id: string;
  name: string;
  emoji: string;
  card_count: number;
}

interface BossSelectProps {
  onStartBattle: (boss: Boss, deckId: string, deckName: string) => void;
}

/**
 * BossSelect — Pick a boss and a deck, then start the battle.
 *
 * Two-step flow:
 * 1. Select a boss from the grid.
 * 2. Pick a deck (only decks with cards are enabled).
 */
export default function BossSelect({ onStartBattle }: BossSelectProps) {
  const { user } = useAuth();
  const { isSun } = useCardStyles();

  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(false);

  // Fetch user decks with card counts when component mounts
  useEffect(() => {
    if (!user) return;

    async function fetchDecks() {
      setIsLoadingDecks(true);
      const { data, error } = await supabase
        .from("decks")
        .select("id, name, emoji, cards(id)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[BossSelect] Failed to load decks:", error);
      } else {
        const formatted =
          data?.map((d) => ({
            id: d.id,
            name: d.name,
            emoji: d.emoji,
            card_count: Array.isArray(d.cards) ? d.cards.length : 0,
          })) || [];
        setDecks(formatted);
      }
      setIsLoadingDecks(false);
    }

    fetchDecks();
  }, [user]);

  // ── Step 2: Deck picker ──────────────────────────────────

  if (selectedBoss) {
    const style = getDifficultyStyle(selectedBoss.difficulty);

    return (
      <div
        className={`min-h-screen ${
          isSun
            ? "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
            : "bg-gradient-to-br from-slate-900 via-red-950/30 to-slate-900"
        }`}
      >
        <div className="max-w-2xl mx-auto px-4 py-10 pb-32">
          {/* Back + Boss header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={() => setSelectedBoss(null)}
              className={`text-sm mb-6 flex items-center gap-1 ${
                isSun ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white"
              } transition-colors`}
            >
              &larr; Back to bosses
            </button>

            <div className="flex items-center gap-4 mb-8">
              <Image
                src={selectedBoss.icon}
                alt={selectedBoss.name}
                width={56}
                height={56}
                className="drop-shadow-lg"
              />
              <div>
                <h2
                  className={`text-2xl font-bold font-[family-name:var(--font-nunito)] ${
                    isSun ? "text-slate-800" : "text-white"
                  }`}
                >
                  {selectedBoss.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}
                  >
                    {selectedBoss.difficulty.toUpperCase()}
                  </span>
                  <span className={`text-xs ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                    {selectedBoss.hp} HP
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Deck selection */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3
              className={`text-lg font-bold font-[family-name:var(--font-nunito)] mb-4 flex items-center gap-2 ${
                isSun ? "text-slate-700" : "text-slate-200"
              }`}
            >
              <BookOpen className="w-5 h-5" />
              Choose Your Deck
            </h3>

            {isLoadingDecks ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
              </div>
            ) : decks.length === 0 ? (
              <div
                className={`text-center py-16 rounded-2xl border-2 border-dashed ${
                  isSun ? "border-slate-300 text-slate-500" : "border-white/20 text-slate-400"
                }`}
              >
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-bold mb-1">No decks found</p>
                <p className="text-sm">
                  Create a deck in the Flashcards page first, then come back to fight!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {decks.map((deck, i) => {
                  const hasCards = deck.card_count > 0;
                  return (
                    <motion.button
                      key={deck.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      disabled={!hasCards}
                      onClick={() => onStartBattle(selectedBoss, deck.id, deck.name)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all group ${
                        hasCards
                          ? isSun
                            ? "bg-white/80 border-2 border-slate-200 hover:border-red-400 hover:shadow-lg hover:-translate-y-0.5"
                            : "bg-white/5 border-2 border-white/10 hover:border-red-400/50 hover:bg-white/10 hover:-translate-y-0.5"
                          : isSun
                            ? "bg-slate-100/50 border-2 border-slate-200 opacity-50 cursor-not-allowed"
                            : "bg-white/[0.02] border-2 border-white/5 opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <span className="text-2xl">{deck.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-bold font-[family-name:var(--font-nunito)] truncate ${
                            isSun ? "text-slate-800" : "text-white"
                          }`}
                        >
                          {deck.name}
                        </p>
                        <p className={`text-xs ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                          {deck.card_count} card{deck.card_count !== 1 ? "s" : ""}
                          {!hasCards && " — add cards to use this deck"}
                        </p>
                      </div>
                      {hasCards && (
                        <ChevronRight
                          className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${
                            isSun ? "text-slate-400" : "text-slate-500"
                          }`}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Step 1: Boss selection grid ───────────────────────────

  return (
    <div
      className={`min-h-screen ${
        isSun
          ? "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
          : "bg-gradient-to-br from-slate-900 via-red-950/30 to-slate-900"
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-10 pb-32">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1
            className={`text-4xl font-bold font-[family-name:var(--font-nunito)] flex items-center gap-3 ${
              isSun ? "text-slate-800" : "text-white"
            }`}
          >
            <Swords className="w-9 h-9 text-red-500" />
            Boss Battle
          </h1>
          <p
            className={`mt-2 font-[family-name:var(--font-quicksand)] ${
              isSun ? "text-slate-600" : "text-slate-400"
            }`}
          >
            Choose a boss to challenge with your flashcard knowledge.
          </p>
        </motion.div>

        {/* Boss grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BOSSES.map((boss, i) => {
            const style = getDifficultyStyle(boss.difficulty);
            return (
              <motion.button
                key={boss.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => setSelectedBoss(boss)}
                className={`group relative p-6 rounded-2xl text-left transition-all ${
                  isSun
                    ? "bg-white/80 backdrop-blur-sm border-2 border-slate-200 hover:border-red-400 hover:shadow-xl hover:-translate-y-1"
                    : "bg-white/5 backdrop-blur-sm border-2 border-white/10 hover:border-red-400/40 hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1"
                }`}
              >
                {/* Difficulty badge */}
                <span
                  className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${style.bg} ${style.text} border ${style.border}`}
                >
                  {boss.difficulty}
                </span>

                {/* Boss icon */}
                <div className="mb-4">
                  <Image
                    src={boss.icon}
                    alt={boss.name}
                    width={64}
                    height={64}
                    className="drop-shadow-lg group-hover:scale-110 transition-transform"
                  />
                </div>

                {/* Info */}
                <h3
                  className={`text-lg font-bold font-[family-name:var(--font-nunito)] mb-1 ${
                    isSun ? "text-slate-800" : "text-white"
                  }`}
                >
                  {boss.name}
                </h3>
                <p className={`text-xs mb-3 line-clamp-2 ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                  {boss.description}
                </p>

                {/* Stats row */}
                <div className={`flex items-center gap-3 text-xs ${isSun ? "text-slate-600" : "text-slate-300"}`}>
                  <span className="flex items-center gap-1">
                    <span className="text-red-500 font-bold">{boss.hp}</span> HP
                  </span>
                  <span className="opacity-30">|</span>
                  <span className="flex items-center gap-1">
                    <span className="text-amber-500 font-bold">{boss.xpReward}</span> XP
                  </span>
                  <span className="opacity-30">|</span>
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-500 font-bold">{boss.goldReward}</span> Gold
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
