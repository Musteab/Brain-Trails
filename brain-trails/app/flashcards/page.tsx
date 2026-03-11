"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronLeft, ChevronRight, Plus, Shuffle, BookOpen } from "lucide-react";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import { useTheme } from "@/context/ThemeContext";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastery: number; // 0-100
}

interface Deck {
  id: string;
  name: string;
  emoji: string;
  cards: Flashcard[];
  color: string;
}

const sampleDecks: Deck[] = [
  {
    id: "deck-1",
    name: "Algebra",
    emoji: "📐",
    color: "from-violet-500 to-purple-600",
    cards: [
      { id: "c1", front: "What is the quadratic formula?", back: "x = (-b ± √(b²-4ac)) / 2a", mastery: 80 },
      { id: "c2", front: "What does FOIL stand for?", back: "First, Outer, Inner, Last — a method for multiplying two binomials", mastery: 100 },
      { id: "c3", front: "What is a polynomial?", back: "An expression with variables, coefficients, and non-negative integer exponents", mastery: 45 },
      { id: "c4", front: "Slope-intercept form?", back: "y = mx + b, where m is slope and b is y-intercept", mastery: 90 },
    ],
  },
  {
    id: "deck-2",
    name: "Physics",
    emoji: "⚡",
    color: "from-emerald-500 to-teal-600",
    cards: [
      { id: "c5", front: "Newton's Second Law?", back: "F = ma (Force equals mass times acceleration)", mastery: 70 },
      { id: "c6", front: "What is kinetic energy?", back: "KE = ½mv² — the energy of motion", mastery: 55 },
      { id: "c7", front: "Speed of light?", back: "≈ 3 × 10⁸ m/s (299,792,458 m/s)", mastery: 100 },
    ],
  },
  {
    id: "deck-3",
    name: "Biology",
    emoji: "🧬",
    color: "from-amber-500 to-orange-600",
    cards: [
      { id: "c8", front: "What is mitosis?", back: "Cell division producing two identical daughter cells with the same chromosome number", mastery: 60 },
      { id: "c9", front: "What is DNA?", back: "Deoxyribonucleic acid — the molecule that carries genetic instructions", mastery: 85 },
    ],
  },
];

function MasteryDots({ mastery }: { mastery: number }) {
  const filled = Math.round(mastery / 20);
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i < filled ? "bg-emerald-400" : "bg-slate-300/50"
          }`}
        />
      ))}
    </div>
  );
}

export default function FlashcardsPage() {
  const { theme } = useTheme();
  const isSun = theme === "sun";
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [decks, setDecks] = useState(sampleDecks);

  const currentCard = selectedDeck?.cards[currentIndex];

  const handleNext = () => {
    if (!selectedDeck) return;
    setIsFlipped(false);
    setCurrentIndex((prev) =>
      prev < selectedDeck.cards.length - 1 ? prev + 1 : 0
    );
  };

  const handlePrev = () => {
    if (!selectedDeck) return;
    setIsFlipped(false);
    setCurrentIndex((prev) =>
      prev > 0 ? prev - 1 : selectedDeck.cards.length - 1
    );
  };

  const handleShuffle = () => {
    if (!selectedDeck) return;
    const shuffled = [...selectedDeck.cards].sort(() => Math.random() - 0.5);
    const updatedDeck = { ...selectedDeck, cards: shuffled };
    setDecks((prev) =>
      prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d))
    );
    setSelectedDeck(updatedDeck);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleAddCard = () => {
    if (!selectedDeck || !newFront.trim() || !newBack.trim()) return;
    const newCard: Flashcard = {
      id: `c-${Date.now()}`,
      front: newFront.trim(),
      back: newBack.trim(),
      mastery: 0,
    };
    const updatedDeck = {
      ...selectedDeck,
      cards: [...selectedDeck.cards, newCard],
    };
    setDecks((prev) =>
      prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d))
    );
    setSelectedDeck(updatedDeck);
    setNewFront("");
    setNewBack("");
    setShowNewCard(false);
  };

  const handleBackToDecks = () => {
    setSelectedDeck(null);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // ===== Deck Selection View =====
  if (!selectedDeck) {
    return (
      <main className="relative min-h-screen">
        <div
          className={`fixed inset-0 ${
            isSun
              ? "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
              : "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
          }`}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 pb-32">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1
              className={`text-4xl font-bold font-[family-name:var(--font-nunito)] ${
                isSun ? "text-slate-800" : "text-white"
              }`}
            >
              🃏 Spell Cards
            </h1>
            <p
              className={`mt-2 ${
                isSun ? "text-slate-600" : "text-slate-400"
              } font-[family-name:var(--font-quicksand)]`}
            >
              Choose a deck to study
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck, i) => (
              <motion.button
                key={deck.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedDeck(deck);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className={`p-6 rounded-2xl text-left transition-shadow ${
                  isSun
                    ? "bg-white/80 backdrop-blur-sm border-2 border-slate-200 hover:shadow-xl hover:border-purple-300"
                    : "bg-white/5 backdrop-blur-sm border-2 border-white/10 hover:shadow-xl hover:border-purple-400/40"
                }`}
              >
                <div className="text-4xl mb-3">{deck.emoji}</div>
                <h3
                  className={`text-lg font-bold font-[family-name:var(--font-nunito)] ${
                    isSun ? "text-slate-800" : "text-white"
                  }`}
                >
                  {deck.name}
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    isSun ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {deck.cards.length} cards
                </p>
                {/* Mastery bar */}
                <div className="mt-3">
                  <div
                    className={`h-1.5 rounded-full overflow-hidden ${
                      isSun ? "bg-slate-100" : "bg-white/10"
                    }`}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          Math.round(
                            deck.cards.reduce((s, c) => s + c.mastery, 0) /
                              deck.cards.length
                          )
                        }%`,
                      }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                      className={`h-full rounded-full bg-gradient-to-r ${deck.color}`}
                    />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <TravelerHotbar />
      </main>
    );
  }

  // ===== Card Study View =====
  return (
    <main className="relative min-h-screen">
      <div
        className={`fixed inset-0 ${
          isSun
            ? "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
            : "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
        }`}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8 pb-32 flex flex-col items-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full flex items-center justify-between mb-8"
        >
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackToDecks}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              isSun
                ? "hover:bg-slate-100 text-slate-600"
                : "hover:bg-white/10 text-slate-300"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Decks</span>
          </motion.button>

          <h2
            className={`text-xl font-bold font-[family-name:var(--font-nunito)] ${
              isSun ? "text-slate-800" : "text-white"
            }`}
          >
            {selectedDeck.emoji} {selectedDeck.name}
          </h2>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShuffle}
              className={`p-2 rounded-xl transition-colors ${
                isSun
                  ? "hover:bg-slate-100 text-slate-500"
                  : "hover:bg-white/10 text-slate-400"
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewCard(!showNewCard)}
              className={`p-2 rounded-xl transition-colors ${
                isSun
                  ? "hover:bg-slate-100 text-slate-500"
                  : "hover:bg-white/10 text-slate-400"
              }`}
              title="Add card"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* New card form */}
        <AnimatePresence>
          {showNewCard && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`w-full mb-6 p-4 rounded-2xl border-2 overflow-hidden ${
                isSun
                  ? "bg-white/80 border-purple-200"
                  : "bg-white/5 border-purple-400/30"
              }`}
            >
              <input
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                placeholder="Front (question)..."
                className={`w-full px-3 py-2 rounded-xl mb-2 text-sm outline-none ${
                  isSun
                    ? "bg-slate-50 border border-slate-200 text-slate-800"
                    : "bg-white/10 border border-white/10 text-white placeholder:text-slate-500"
                }`}
              />
              <input
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                placeholder="Back (answer)..."
                className={`w-full px-3 py-2 rounded-xl mb-3 text-sm outline-none ${
                  isSun
                    ? "bg-slate-50 border border-slate-200 text-slate-800"
                    : "bg-white/10 border border-white/10 text-white placeholder:text-slate-500"
                }`}
              />
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleAddCard}
                disabled={!newFront.trim() || !newBack.trim()}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold disabled:opacity-40"
              >
                Add Card
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card counter */}
        <p
          className={`text-sm mb-4 font-[family-name:var(--font-quicksand)] ${
            isSun ? "text-slate-500" : "text-slate-400"
          }`}
        >
          Card {currentIndex + 1} of {selectedDeck.cards.length}
        </p>

        {/* Flashcard */}
        {currentCard && (
          <motion.div
            key={currentCard.id + (isFlipped ? "-back" : "-front")}
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full cursor-pointer perspective-1000"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isFlipped ? "back" : "front"}
                initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`w-full min-h-[280px] p-8 rounded-3xl flex flex-col items-center justify-center text-center border-2 ${
                  isFlipped
                    ? isSun
                      ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300"
                      : "bg-gradient-to-br from-emerald-950 to-teal-950 border-emerald-500/30"
                    : isSun
                    ? "bg-white border-slate-200 shadow-xl"
                    : "bg-white/5 border-white/10 shadow-xl"
                }`}
              >
                <div
                  className={`text-xs font-bold uppercase tracking-wider mb-4 ${
                    isFlipped
                      ? "text-emerald-500"
                      : isSun
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                >
                  {isFlipped ? "Answer" : "Question"}
                </div>
                <p
                  className={`text-xl font-medium font-[family-name:var(--font-quicksand)] leading-relaxed ${
                    isSun ? "text-slate-800" : "text-white"
                  }`}
                >
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>
                <div className="mt-6">
                  <MasteryDots mastery={currentCard.mastery} />
                </div>
                <p
                  className={`text-xs mt-2 ${
                    isSun ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {isFlipped ? "Click to see question" : "Click to reveal answer"}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-4 mt-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrev}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isSun
                ? "bg-white border-2 border-slate-200 text-slate-500 hover:border-purple-300"
                : "bg-white/10 border-2 border-white/10 text-slate-300 hover:border-purple-400/40"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFlipped(!isFlipped)}
            className={`px-6 py-3 rounded-full flex items-center gap-2 font-bold text-sm transition-colors ${
              isSun
                ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                : "bg-gradient-to-r from-violet-600 to-purple-700 text-white"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Flip
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isSun
                ? "bg-white border-2 border-slate-200 text-slate-500 hover:border-purple-300"
                : "bg-white/10 border-2 border-white/10 text-slate-300 hover:border-purple-400/40"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Card dots */}
        <div className="flex items-center gap-1.5 mt-6">
          {selectedDeck.cards.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i);
                setIsFlipped(false);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-purple-500 w-4"
                  : isSun
                  ? "bg-slate-300 hover:bg-slate-400"
                  : "bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      <TravelerHotbar />
    </main>
  );
}
