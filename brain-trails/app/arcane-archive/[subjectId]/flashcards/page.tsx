"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Brain, BrainCircuit, RotateCcw, ChevronLeft, ChevronRight, Shuffle, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useGameStore } from "@/stores";
import { useSoundEffects } from "@/hooks/useSoundEffects";

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

const EMOJIS = ["📚", "📐", "⚡", "🧬", "🌍", "💻", "🧠", "🔥", "✨", "🔮"];
const COLORS = [
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-blue-500 to-cyan-600",
  "from-rose-500 to-pink-600",
];

/**
 * Subject-Specific Flashcards
 * Shows only decks belonging to this subject
 */
export default function SubjectFlashcardsPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;

  const { user, profile, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const { awardXp, logActivity } = useGameStore();
  const playSound = useSoundEffects();
  const isSun = theme === "sun";

  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subjectName, setSubjectName] = useState("");
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [showNewCard, setShowNewCard] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");

  // Fetch subject and decks
  useEffect(() => {
    if (!user || !subjectId) return;

    const fetchData = async () => {
      // Get subject name
      const { data: subData } = await (supabase.from("subjects") as any)
        .select("name, emoji")
        .eq("id", subjectId)
        .single();

      if (subData) {
        setSubjectName(`${subData.emoji || "📚"} ${subData.name}`);
      }

      // Get decks for this subject
      const { data: decksData } = await (supabase.from("decks") as any)
        .select(`
          id, name, emoji, color,
          cards ( id, front, back, mastery, review_count )
        `)
        .eq("user_id", user.id)
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: true });

      if (decksData) {
        const formattedDecks = decksData.map((d: Deck) => ({
          ...d,
          cards: (d.cards || []).sort((a: Flashcard, b: Flashcard) => a.id.localeCompare(b.id)),
        }));
        setDecks(formattedDecks);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [user, subjectId]);

  const currentCard = selectedDeck?.cards[currentIndex];

  const handleNext = () => {
    if (!selectedDeck) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev < selectedDeck.cards.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    if (!selectedDeck) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : selectedDeck.cards.length - 1));
  };

  const handleShuffle = () => {
    if (!selectedDeck) return;
    const shuffled = [...selectedDeck.cards].sort(() => Math.random() - 0.5);
    setSelectedDeck({ ...selectedDeck, cards: shuffled });
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleCreateDeck = async () => {
    if (!user || !newDeckName.trim()) return;

    const { data, error } = await (supabase.from("decks") as any)
      .insert({
        user_id: user.id,
        subject_id: subjectId,
        name: newDeckName.trim(),
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
      .select()
      .single();

    if (!error && data) {
      setDecks([...decks, { ...data, cards: [] }]);
      setNewDeckName("");
      setShowNewDeck(false);
    }
  };

  const handleDeleteDeck = async (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation();
    if (!confirm("Delete this deck? All cards will be lost!")) return;

    await (supabase.from("decks") as any).delete().eq("id", deckId);
    setDecks(decks.filter(d => d.id !== deckId));
  };

  const handleAddCard = async () => {
    if (!selectedDeck || !newFront.trim() || !newBack.trim()) return;

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
      setDecks(decks.map(d => (d.id === updatedDeck.id ? updatedDeck : d)));
      setSelectedDeck(updatedDeck);
      setNewFront("");
      setNewBack("");
      setShowNewCard(false);
      setCurrentIndex(updatedDeck.cards.length - 1);
    }
  };

  const handleGradeCard = async (quality: number) => {
    if (!currentCard || !selectedDeck || !user) return;
    playSound(quality >= 2 ? "success" : "click");

    let newMastery = currentCard.mastery;
    if (quality === 0) newMastery = Math.max(0, newMastery - 20);
    else if (quality === 1) newMastery = Math.min(100, newMastery + 10);
    else if (quality === 2) newMastery = Math.min(100, newMastery + 20);
    else if (quality === 3) newMastery = Math.min(100, newMastery + 40);

    const updatedCard = { ...currentCard, mastery: newMastery, review_count: currentCard.review_count + 1 };
    const updatedCards = [...selectedDeck.cards];
    updatedCards[currentIndex] = updatedCard;
    const updatedDeck = { ...selectedDeck, cards: updatedCards };

    setSelectedDeck(updatedDeck);
    setDecks(decks.map(d => (d.id === updatedDeck.id ? updatedDeck : d)));

    await (supabase.from("cards") as any)
      .update({ mastery: newMastery, review_count: updatedCard.review_count })
      .eq("id", currentCard.id);

    if (profile) {
      const gainedXp = 2;
      await awardXp(user.id, gainedXp);
      await logActivity(user.id, "flashcard", gainedXp, {
        deck_id: selectedDeck.id,
        subject_id: subjectId,
      });
      refreshProfile();
    }

    handleNext();
  };

  const glassCard = isSun
    ? "bg-white/40 border border-white/60 backdrop-blur-xl"
    : "bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Deck Selection View
  if (!selectedDeck) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/arcane-archive/${subjectId}`)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                isSun ? "hover:bg-white/50 text-slate-600" : "hover:bg-white/10 text-slate-400"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${isSun ? "text-slate-800" : "text-white"}`}>
                {subjectName} - Spell Cards
              </h1>
              <p className={`text-sm ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                {decks.length} decks
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNewDeck(!showNewDeck)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium"
          >
            <Plus className="w-4 h-4" />
            New Deck
          </button>
        </div>

        {/* New Deck Form */}
        <AnimatePresence>
          {showNewDeck && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-6 p-6 rounded-2xl ${glassCard}`}
            >
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="Deck name..."
                  className={`flex-1 px-4 py-3 rounded-xl outline-none ${
                    isSun ? "bg-white/60 text-slate-800" : "bg-white/10 text-white placeholder:text-slate-500"
                  }`}
                />
                <button
                  onClick={handleCreateDeck}
                  disabled={!newDeckName.trim()}
                  className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Brain className={`w-16 h-16 mx-auto mb-4 ${isSun ? "text-slate-300" : "text-slate-600"}`} />
              <p className={isSun ? "text-slate-500" : "text-slate-400"}>
                No decks yet. Create your first deck!
              </p>
            </div>
          ) : (
            decks.map((deck, i) => (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative group"
              >
                <button
                  onClick={() => {
                    setSelectedDeck(deck);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`w-full p-6 rounded-2xl text-left transition-all ${glassCard} hover:scale-[1.02] hover:shadow-xl`}
                >
                  <div className="text-3xl mb-3">{deck.emoji}</div>
                  <h3 className={`text-lg font-bold ${isSun ? "text-slate-800" : "text-white"}`}>
                    {deck.name}
                  </h3>
                  <p className={`text-sm ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                    {deck.cards.length} cards
                  </p>
                  {deck.cards.length > 0 && (
                    <div className={`mt-4 h-1.5 rounded-full overflow-hidden ${isSun ? "bg-slate-100" : "bg-white/10"}`}>
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${deck.color}`}
                        style={{
                          width: `${Math.round(deck.cards.reduce((s, c) => s + c.mastery, 0) / deck.cards.length)}%`,
                        }}
                      />
                    </div>
                  )}
                </button>
                <button
                  onClick={(e) => handleDeleteDeck(e, deck.id)}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Card Study View
  return (
    <div className="max-w-2xl mx-auto px-6 py-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => {
            setSelectedDeck(null);
            setCurrentIndex(0);
            setIsFlipped(false);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
            isSun ? "hover:bg-white/50 text-slate-600" : "hover:bg-white/10 text-slate-400"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Decks</span>
        </button>

        <h2 className={`text-xl font-bold flex items-center gap-2 ${isSun ? "text-slate-800" : "text-white"}`}>
          <span>{selectedDeck.emoji}</span> {selectedDeck.name}
        </h2>

        <div className="flex gap-2">
          <button onClick={handleShuffle} className={`p-2 rounded-xl ${isSun ? "hover:bg-white/50" : "hover:bg-white/10"}`}>
            <Shuffle className="w-4 h-4" />
          </button>
          <button onClick={() => setShowNewCard(!showNewCard)} className={`p-2 rounded-xl ${isSun ? "hover:bg-white/50" : "hover:bg-white/10"}`}>
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Card Form */}
      <AnimatePresence>
        {showNewCard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-6 p-4 rounded-2xl ${glassCard}`}
          >
            <input
              value={newFront}
              onChange={(e) => setNewFront(e.target.value)}
              placeholder="Front (question)..."
              className={`w-full px-3 py-2 rounded-xl mb-2 outline-none ${
                isSun ? "bg-white/60 text-slate-800" : "bg-white/10 text-white placeholder:text-slate-500"
              }`}
            />
            <input
              value={newBack}
              onChange={(e) => setNewBack(e.target.value)}
              placeholder="Back (answer)..."
              className={`w-full px-3 py-2 rounded-xl mb-3 outline-none ${
                isSun ? "bg-white/60 text-slate-800" : "bg-white/10 text-white placeholder:text-slate-500"
              }`}
            />
            <button
              onClick={handleAddCard}
              disabled={!newFront.trim() || !newBack.trim()}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold disabled:opacity-40"
            >
              Add Card
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Counter */}
      {selectedDeck.cards.length > 0 && (
        <p className={`text-center text-sm mb-4 ${isSun ? "text-slate-500" : "text-slate-400"}`}>
          Card {currentIndex + 1} of {selectedDeck.cards.length}
        </p>
      )}

      {/* Flashcard */}
      {selectedDeck.cards.length === 0 ? (
        <div className={`mt-20 p-12 text-center rounded-3xl border-2 border-dashed ${isSun ? "border-slate-300" : "border-white/20"}`}>
          <Brain className={`w-16 h-16 mx-auto mb-4 ${isSun ? "text-slate-300" : "text-slate-600"}`} />
          <h3 className={`text-xl font-bold mb-2 ${isSun ? "text-slate-600" : "text-slate-400"}`}>Empty deck</h3>
          <p className={isSun ? "text-slate-500" : "text-slate-500"}>Add cards using the + button above.</p>
        </div>
      ) : currentCard && (
        <motion.div
          key={currentCard.id + (isFlipped ? "-back" : "-front")}
          onClick={() => {
            playSound("cardFlip");
            setIsFlipped(!isFlipped);
          }}
          className="cursor-pointer"
          whileHover={{ scale: 1.01 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isFlipped ? "back" : "front"}
              initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`min-h-[320px] p-8 rounded-3xl flex flex-col items-center justify-center text-center ${glassCard} ${
                isFlipped ? "border-emerald-500/30" : ""
              }`}
            >
              <div className={`text-xs font-bold uppercase tracking-wider mb-6 ${isFlipped ? "text-emerald-500" : (isSun ? "text-slate-400" : "text-slate-500")}`}>
                {isFlipped ? "Answer" : "Question"}
              </div>
              <p className={`text-2xl font-medium leading-relaxed ${isSun ? "text-slate-800" : "text-white"}`}>
                {isFlipped ? currentCard.back : currentCard.front}
              </p>
              <p className={`text-xs mt-8 ${isSun ? "text-slate-400" : "text-slate-500"}`}>
                {isFlipped ? "Grade your knowledge below" : "Click to reveal answer"}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* Navigation & Grading */}
      {selectedDeck.cards.length > 0 && (
        <div className="mt-8">
          <AnimatePresence mode="wait">
            {!isFlipped ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-6"
              >
                <button onClick={handlePrev} className={`w-14 h-14 rounded-full flex items-center justify-center ${glassCard}`}>
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setIsFlipped(true)}
                  className="px-8 py-4 rounded-2xl flex items-center gap-3 font-bold bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reveal Answer
                </button>
                <button onClick={handleNext} className={`w-14 h-14 rounded-full flex items-center justify-center ${glassCard}`}>
                  <ChevronRight className="w-6 h-6" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-4 gap-3"
              >
                {[
                  { q: 0, label: "Again", color: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400" },
                  { q: 1, label: "Hard", color: "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400" },
                  { q: 2, label: "Good", color: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" },
                  { q: 3, label: "Easy", color: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400" },
                ].map((btn) => (
                  <button
                    key={btn.q}
                    onClick={() => handleGradeCard(btn.q)}
                    className={`flex flex-col items-center justify-center py-3 rounded-xl transition-colors ${btn.color}`}
                  >
                    <BrainCircuit className="w-5 h-5 mb-1" />
                    <span className="font-bold text-sm">{btn.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
