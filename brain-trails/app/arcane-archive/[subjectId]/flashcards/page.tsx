"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronLeft, ChevronRight, Plus, Shuffle, BrainCircuit, Trash2, Loader2, BookMarked } from "lucide-react";
import { useParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useGameStore } from "@/stores";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { supabase } from "@/lib/supabase";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastery: number;
  review_count: number;
}

interface Deck {
  id: string;
  name: string;
  emoji: string;
  color: string;
  cards: Flashcard[];
}

function MasteryDots({ mastery }: { mastery: number }) {
  const filled = Math.round(mastery / 20);
  return (
    <div className="flex gap-1 justify-center">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i < filled
              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
              : "bg-slate-200 dark:bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

const EMOJIS = ["📚", "📐", "⚡", "🧬", "🌍", "💻", "🧠", "🔥", "✨", "🔮"];
const COLORS = [
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-blue-500 to-cyan-600",
  "from-rose-500 to-pink-600",
];

export default function SubjectFlashcardsPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const { theme } = useTheme();
  const { user, profile, refreshProfile } = useAuth();
  const { awardXp, logActivity } = useGameStore();
  const playSound = useSoundEffects();
  const isSun = theme === "sun";

  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");

  // Fetch decks for this subject
  useEffect(() => {
    if (!user || !subjectId) return;

    const fetchDecks = async () => {
      setIsLoading(true);
      const { data, error } = await (supabase.from("decks") as any)
        .select(`
          id, name, emoji, color,
          cards ( id, front, back, mastery, review_count )
        `)
        .eq("user_id", user.id)
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching decks:", error);
      } else {
        const raw = (data ?? []) as unknown as Deck[];
        const formattedDecks = raw.map((d) => ({
          ...d,
          cards: (d.cards || []).sort((a: Flashcard, b: Flashcard) =>
            a.id.localeCompare(b.id)
          ),
        }));
        setDecks(formattedDecks);
      }
      setIsLoading(false);
    };

    fetchDecks();
  }, [user, subjectId]);

  const currentCard = selectedDeck?.cards[currentIndex];
  const deckProgress = selectedDeck
    ? selectedDeck.cards.length > 0
      ? Math.round(
          (selectedDeck.cards.reduce((sum, c) => sum + c.mastery, 0) /
            selectedDeck.cards.length) *
            100
        ) / 100
      : 0
    : 0;

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
    setSelectedDeck(updatedDeck);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleCreateDeck = async () => {
    if (!user || !newDeckName.trim() || !subjectId) return;

    const newDeck = {
      user_id: user.id,
      subject_id: subjectId,
      name: newDeckName.trim(),
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };

    const { data, error } = await (supabase.from("decks") as any)
      .insert(newDeck)
      .select()
      .single();

    if (!error && data) {
      const created: Deck = {
        id: data.id,
        name: data.name,
        emoji: data.emoji,
        color: data.color,
        cards: [],
      };
      setDecks([...decks, created]);
      setNewDeckName("");
      setShowNewDeck(false);
    }
  };

  const handleDeleteDeck = async (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation();
    if (
      !confirm(
        "Are you sure you want to delete this deck? All cards inside will be lost!"
      )
    )
      return;

    const { error } = await (supabase.from("decks") as any)
      .delete()
      .eq("id", deckId);
    if (!error) {
      setDecks(decks.filter((d) => d.id !== deckId));
      if (selectedDeck?.id === deckId) {
        setSelectedDeck(null);
      }
    }
  };

  const handleAddCard = async () => {
    if (
      !selectedDeck ||
      !newFront.trim() ||
      !newBack.trim() ||
      !user
    )
      return;

    const { data, error } = await (supabase.from("cards") as any)
      .insert({
        deck_id: selectedDeck.id,
        front: newFront.trim(),
        back: newBack.trim(),
        mastery: 0,
        review_count: 0,
      })
      .select()
      .single();

    if (!error && data) {
      const updatedDeck = {
        ...selectedDeck,
        cards: [...selectedDeck.cards, data],
      };
      setDecks((prev) =>
        prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d))
      );
      setSelectedDeck(updatedDeck);
      setNewFront("");
      setNewBack("");
      setShowNewCard(false);
      setCurrentIndex(updatedDeck.cards.length - 1);
    }
  };

  const handleGradeCard = async (quality: number) => {
    if (!currentCard || !selectedDeck) return;
    playSound(quality >= 2 ? "success" : "click");

    let newMastery = currentCard.mastery;

    if (quality === 0) newMastery = Math.max(0, newMastery - 20);
    else if (quality === 1) newMastery = Math.min(100, newMastery + 10);
    else if (quality === 2) newMastery = Math.min(100, newMastery + 20);
    else if (quality === 3) newMastery = Math.min(100, newMastery + 40);

    const updatedCard = {
      ...currentCard,
      mastery: newMastery,
      review_count: currentCard.review_count + 1,
    };

    const updatedCards = [...selectedDeck.cards];
    updatedCards[currentIndex] = updatedCard;
    const updatedDeck = { ...selectedDeck, cards: updatedCards };

    setSelectedDeck(updatedDeck);
    setDecks((prev) =>
      prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d))
    );

    await (supabase.from("cards") as any)
      .update({ mastery: newMastery, review_count: updatedCard.review_count })
      .eq("id", currentCard.id);

    if (profile && user) {
      const gainedXp = 2;
      await awardXp(user.id, gainedXp);
      await logActivity(user.id, "flashcard", gainedXp, {
        deck_id: selectedDeck.id,
        deck_name: selectedDeck.name,
        card_id: currentCard.id,
      });
      refreshProfile();
    }

    handleNext();
  };

  const handleBackToDecks = () => {
    setSelectedDeck(null);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // ===== Deck Selection View =====
  if (!selectedDeck) {
    return (
      <div className="w-full px-6 py-12 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex justify-between items-end"
        >
          <div>
            <h2 className={`text-3xl font-bold mb-2 ${
              isSun ? "text-slate-800" : "text-white"
            }`}>
              ✨ Spell Cards Collection
            </h2>
            <p className={`text-sm ${isSun ? "text-slate-500" : "text-slate-400"}`}>
              Create or choose a deck to practice your spells. Each card you master strengthens your knowledge.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewDeck(!showNewDeck)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/30 font-bold"
          >
            <Plus className="w-5 h-5" />
            New Deck
          </motion.button>
        </motion.div>

        {/* New Deck Form */}
        <AnimatePresence>
          {showNewDeck && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-8 p-6 rounded-2xl border-2 overflow-hidden ${
                isSun
                  ? "bg-white/80 border-purple-200"
                  : "bg-slate-800/95 border-purple-500/30"
              }`}
            >
              <h3 className={`text-base font-bold mb-4 ${
                isSun ? "text-slate-700" : "text-white"
              }`}>
                Create New Deck
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Deck name (e.g., Vocabulary, Formulas)..."
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCreateDeck()}
                  className={`flex-1 px-4 py-2 rounded-lg border outline-none transition-all ${
                    isSun
                      ? "bg-white border-purple-200 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20"
                      : "bg-slate-700/80 border-purple-500/30 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/20"
                  }`}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateDeck}
                  disabled={!newDeckName.trim()}
                  className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all disabled:opacity-50"
                >
                  Create
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decks Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`w-8 h-8 border-3 rounded-full ${
                isSun
                  ? "border-purple-200 border-t-purple-600"
                  : "border-purple-500/20 border-t-purple-400"
              }`}
            />
          </div>
        ) : decks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <BookMarked className={`w-16 h-16 mx-auto mb-4 ${
              isSun ? "text-slate-300" : "text-slate-600"
            }`} />
            <h3 className={`text-xl font-bold mb-2 ${
              isSun ? "text-slate-500" : "text-slate-300"
            }`}>
              No spell card decks yet
            </h3>
            <p className={`text-sm ${
              isSun ? "text-slate-400" : "text-slate-500"
            }`}>
              Create your first deck above to begin practicing spells!
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {decks.map((deck) => (
              <motion.button
                key={deck.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedDeck(deck)}
                className={`group rounded-2xl p-6 text-left transition-all border ${
                  isSun
                    ? "bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:border-purple-300 hover:shadow-lg"
                    : "bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{deck.emoji}</div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleDeleteDeck(e, deck.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className={`w-4 h-4 ${
                      isSun ? "text-red-600" : "text-red-400"
                    }`} />
                  </motion.button>
                </div>

                <h3 className={`text-lg font-bold mb-2 group-hover:text-purple-600 transition-colors ${
                  isSun ? "text-slate-800" : "text-white"
                }`}>
                  {deck.name}
                </h3>

                <div className={`text-xs font-semibold mb-3 ${
                  isSun ? "text-slate-500" : "text-slate-400"
                }`}>
                  {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={isSun ? "text-slate-500" : "text-slate-400"}>
                      Mastery
                    </span>
                    <span className={`font-bold ${
                      isSun ? "text-slate-700" : "text-slate-300"
                    }`}>
                      {deckProgress}%
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${
                    isSun ? "bg-slate-200" : "bg-slate-700"
                  }`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${deckProgress}%` }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-violet-400 to-purple-500"
                    />
                  </div>
                  <MasteryDots mastery={deckProgress} />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    );
  }

  // ===== Card Study View =====
  return (
    <div className="w-full flex flex-col items-center justify-center px-6 py-12 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mb-8 flex items-center justify-between"
      >
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBackToDecks}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
            isSun
              ? "hover:bg-slate-100 text-slate-600"
              : "hover:bg-white/10 text-slate-300"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Decks</span>
        </motion.button>

        <div className="text-center">
          <h2 className={`text-2xl font-bold ${
            isSun ? "text-slate-800" : "text-white"
          }`}>
            {selectedDeck.emoji} {selectedDeck.name}
          </h2>
          <p className={`text-xs mt-1 ${
            isSun ? "text-slate-500" : "text-slate-400"
          }`}>
            Card {currentIndex + 1} of {selectedDeck.cards.length}
          </p>
        </div>

        <div className="w-20" />
      </motion.div>

      {/* Card Area */}
      <div className="w-full max-w-2xl">
        {selectedDeck.cards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <BrainCircuit className={`w-16 h-16 mx-auto mb-4 ${
              isSun ? "text-slate-300" : "text-slate-600"
            }`} />
            <h3 className={`text-xl font-bold mb-2 ${
              isSun ? "text-slate-500" : "text-slate-300"
            }`}>
              No cards in this deck yet
            </h3>
            <p className={`text-sm mb-6 ${
              isSun ? "text-slate-400" : "text-slate-500"
            }`}>
              Add your first card below to begin studying!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewCard(!showNewCard)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold shadow-lg shadow-purple-500/30"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Add Card
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Flashcard */}
            <motion.div
              key={currentCard?.id}
              initial={{ opacity: 0, rotateY: isFlipped ? 180 : 0 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setIsFlipped(!isFlipped)}
                style={{
                  perspective: "1000px",
                  transformStyle: "preserve-3d",
                }}
                className={`h-80 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all border-2 ${
                  isSun
                    ? "bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-lg"
                    : "bg-gradient-to-br from-slate-800 to-slate-900 border-purple-500/30 shadow-lg shadow-purple-500/10"
                }`}
              >
                <div className={`text-center ${
                  isSun ? "text-slate-800" : "text-white"
                }`}>
                  <p className={`text-xs font-semibold mb-4 opacity-60 ${
                    isSun ? "text-slate-500" : "text-slate-400"
                  }`}>
                    {isFlipped ? "ANSWER" : "QUESTION"}
                  </p>
                  <p className="text-2xl font-bold leading-relaxed">
                    {isFlipped ? currentCard?.back : currentCard?.front}
                  </p>
                  <p className={`text-xs mt-4 opacity-50 ${
                    isSun ? "text-slate-500" : "text-slate-400"
                  }`}>
                    Click to reveal answer
                  </p>
                </div>
              </motion.div>

              {/* Mastery Indicator */}
              <div className="mt-4 flex items-center gap-3">
                <span className={`text-xs font-semibold ${
                  isSun ? "text-slate-600" : "text-slate-400"
                }`}>
                  Mastery:
                </span>
                <MasteryDots mastery={currentCard?.mastery || 0} />
                <span className={`text-xs font-bold ${
                  isSun ? "text-slate-700" : "text-slate-300"
                }`}>
                  {currentCard?.mastery || 0}%
                </span>
              </div>
            </motion.div>

            {/* Navigation & Grading */}
            <div className="space-y-4">
              {/* Navigation */}
              <div className="flex items-center gap-2 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrev}
                  className={`p-2 rounded-lg transition-colors ${
                    isSun
                      ? "hover:bg-slate-100 text-slate-600"
                      : "hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>

                <div className={`px-4 py-2 rounded-lg text-sm font-bold ${
                  isSun
                    ? "bg-slate-100 text-slate-800"
                    : "bg-slate-800 text-white"
                }`}>
                  {currentIndex + 1} / {selectedDeck.cards.length}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className={`p-2 rounded-lg transition-colors ${
                    isSun
                      ? "hover:bg-slate-100 text-slate-600"
                      : "hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShuffle}
                  className={`p-2 rounded-lg transition-colors ml-4 ${
                    isSun
                      ? "hover:bg-slate-100 text-slate-600"
                      : "hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <Shuffle className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Grading Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Again", quality: 0, color: "from-red-500 to-red-600" },
                  { label: "Hard", quality: 1, color: "from-orange-500 to-orange-600" },
                  { label: "Good", quality: 2, color: "from-emerald-500 to-teal-600" },
                  { label: "Easy", quality: 3, color: "from-blue-500 to-cyan-600" },
                ].map(({ label, quality, color }) => (
                  <motion.button
                    key={label}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleGradeCard(quality)}
                    className={`py-3 rounded-lg font-bold text-white transition-all bg-gradient-to-r ${color} shadow-lg`}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Add Card Form */}
            <AnimatePresence>
              {showNewCard && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mt-8 p-6 rounded-2xl border-2 overflow-hidden ${
                    isSun
                      ? "bg-white/80 border-purple-200"
                      : "bg-slate-800/95 border-purple-500/30"
                  }`}
                >
                  <h4 className={`text-base font-bold mb-4 ${
                    isSun ? "text-slate-700" : "text-white"
                  }`}>
                    Add New Card
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Question/Front..."
                      value={newFront}
                      onChange={(e) => setNewFront(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border outline-none transition-all ${
                        isSun
                          ? "bg-white border-purple-200 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20"
                          : "bg-slate-700/80 border-purple-500/30 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/20"
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Answer/Back..."
                      value={newBack}
                      onChange={(e) => setNewBack(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddCard()}
                      className={`w-full px-4 py-2 rounded-lg border outline-none transition-all ${
                        isSun
                          ? "bg-white border-purple-200 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20"
                          : "bg-slate-700/80 border-purple-500/30 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/20"
                      }`}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddCard}
                      disabled={!newFront.trim() || !newBack.trim()}
                      className="w-full px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all disabled:opacity-50"
                    >
                      Add Card
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add Card Button */}
            <div className="mt-6 text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewCard(!showNewCard)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  isSun
                    ? "bg-purple-100 hover:bg-purple-200 text-purple-700"
                    : "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300"
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                {showNewCard ? "Cancel" : "Add Card"}
              </motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
