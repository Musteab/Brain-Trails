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

  // Card Study View - Magical Card Reading Stand
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8 pb-32 relative">
      {/* Mystical Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl ${
          isSun ? "bg-amber-200/20" : "bg-purple-900/20"
        }`} />
      </div>

      {/* Header with ornate design */}
      <div className="relative z-10 w-full max-w-3xl mb-8">
        <div className={`flex items-center justify-between p-4 rounded-2xl border-2 ${
          isSun 
            ? "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-200" 
            : "bg-gradient-to-r from-purple-950/40 via-violet-950/40 to-purple-950/40 border-purple-800/40"
        }`}>
          <button
            onClick={() => {
              setSelectedDeck(null);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              isSun 
                ? "hover:bg-amber-100 text-amber-800" 
                : "hover:bg-purple-900/50 text-purple-300"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Return to Collection</span>
          </button>

          <h2 className={`text-xl font-bold flex items-center gap-3 font-[family-name:var(--font-cinzel)] ${
            isSun ? "text-amber-900" : "text-purple-200"
          }`}>
            <span className="text-3xl">{selectedDeck.emoji}</span>
            {selectedDeck.name}
          </h2>

          <div className="flex gap-2">
            <button 
              onClick={handleShuffle} 
              className={`p-2.5 rounded-xl transition-all ${
                isSun ? "hover:bg-amber-100 text-amber-700" : "hover:bg-purple-900/50 text-purple-400"
              }`}
              title="Shuffle cards"
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowNewCard(!showNewCard)} 
              className={`p-2.5 rounded-xl transition-all ${
                isSun ? "hover:bg-amber-100 text-amber-700" : "hover:bg-purple-900/50 text-purple-400"
              }`}
              title="Add new card"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* New Card Form */}
      <AnimatePresence>
        {showNewCard && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className={`w-full max-w-3xl overflow-hidden rounded-2xl border-2 ${
              isSun 
                ? "bg-amber-50/80 border-amber-200" 
                : "bg-purple-950/40 border-purple-800/40"
            }`}
          >
            <div className="p-6">
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 font-[family-name:var(--font-cinzel)] ${
                isSun ? "text-amber-800" : "text-purple-300"
              }`}>
                ✨ Inscribe New Card
              </h3>
              <input
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                placeholder="Front (question)..."
                className={`w-full px-4 py-3 rounded-xl mb-3 outline-none border-2 ${
                  isSun 
                    ? "bg-white border-amber-200 text-slate-800 focus:border-amber-400" 
                    : "bg-purple-950/60 border-purple-800/40 text-white placeholder:text-purple-400/50 focus:border-purple-600"
                }`}
              />
              <input
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                placeholder="Back (answer)..."
                className={`w-full px-4 py-3 rounded-xl mb-4 outline-none border-2 ${
                  isSun 
                    ? "bg-white border-amber-200 text-slate-800 focus:border-amber-400" 
                    : "bg-purple-950/60 border-purple-800/40 text-white placeholder:text-purple-400/50 focus:border-purple-600"
                }`}
              />
              <button
                onClick={handleAddCard}
                disabled={!newFront.trim() || !newBack.trim()}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  isSun 
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600" 
                    : "bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                Add Card
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Reading Stand */}
      <div className="relative z-10 w-full max-w-3xl">
        {selectedDeck.cards.length === 0 ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-16 text-center rounded-3xl border-4 border-dashed ${
              isSun ? "border-amber-300 bg-amber-50/50" : "border-purple-800/50 bg-purple-950/20"
            }`}
          >
            <Brain className={`w-24 h-24 mx-auto mb-6 ${isSun ? "text-amber-300" : "text-purple-600/50"}`} />
            <h3 className={`text-2xl font-bold mb-3 font-[family-name:var(--font-cinzel)] ${
              isSun ? "text-amber-800" : "text-purple-300"
            }`}>
              Empty Deck
            </h3>
            <p className={isSun ? "text-amber-700/70" : "text-purple-400/60"}>
              Add cards using the + button above to begin your studies
            </p>
          </motion.div>
        ) : currentCard && (
          <>
            {/* Card Counter */}
            <p className={`text-center text-sm mb-6 font-[family-name:var(--font-cinzel)] ${
              isSun ? "text-amber-600" : "text-purple-400"
            }`}>
              Card {currentIndex + 1} of {selectedDeck.cards.length}
            </p>

            {/* Ornate Card Stand Base */}
            <div className="relative">
              {/* Stand Pedestal */}
              <div className={`absolute left-1/2 -translate-x-1/2 bottom-0 w-32 h-12 rounded-b-3xl ${
                isSun 
                  ? "bg-gradient-to-b from-amber-800 to-amber-900" 
                  : "bg-gradient-to-b from-purple-950 to-black"
              }`} style={{
                boxShadow: isSun 
                  ? "0 10px 30px rgba(139, 92, 46, 0.4), inset 0 -2px 6px rgba(0,0,0,0.3)"
                  : "0 10px 30px rgba(88, 28, 135, 0.6), inset 0 -2px 6px rgba(0,0,0,0.5)"
              }} />
              
              {/* Magical Glow Effect */}
              <motion.div
                animate={{
                  scale: [1, 1.02, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`absolute inset-0 rounded-3xl blur-2xl ${
                  isFlipped 
                    ? (isSun ? "bg-emerald-300/40" : "bg-emerald-600/30")
                    : (isSun ? "bg-amber-300/40" : "bg-purple-600/30")
                }`}
              />

              {/* The Card Itself */}
              <motion.div
                key={currentCard.id + (isFlipped ? "-back" : "-front")}
                onClick={() => {
                  playSound("cardFlip");
                  setIsFlipped(!isFlipped);
                }}
                className="cursor-pointer relative"
                whileHover={{ y: -10, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isFlipped ? "back" : "front"}
                    initial={{ rotateY: isFlipped ? -180 : 180, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: isFlipped ? 180 : -180, opacity: 0 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className={`min-h-[400px] p-10 rounded-3xl flex flex-col items-center justify-center text-center border-4 relative overflow-hidden ${
                      isFlipped 
                        ? (isSun 
                            ? "bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 border-emerald-400" 
                            : "bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 border-emerald-600/50")
                        : (isSun 
                            ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 border-amber-400" 
                            : "bg-gradient-to-br from-purple-950 via-violet-950 to-purple-900 border-purple-600/50")
                    }`}
                    style={{
                      boxShadow: isFlipped 
                        ? (isSun 
                            ? "0 20px 60px rgba(16, 185, 129, 0.3), inset 0 2px 20px rgba(255,255,255,0.4)" 
                            : "0 20px 60px rgba(16, 185, 129, 0.5), inset 0 2px 20px rgba(16, 185, 129, 0.1)")
                        : (isSun 
                            ? "0 20px 60px rgba(245, 158, 11, 0.3), inset 0 2px 20px rgba(255,255,255,0.4)" 
                            : "0 20px 60px rgba(147, 51, 234, 0.5), inset 0 2px 20px rgba(147, 51, 234, 0.1)")
                    }}
                  >
                    {/* Decorative corners */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 rounded-tl-2xl opacity-30" 
                      style={{ borderColor: isFlipped ? (isSun ? "#10b981" : "#34d399") : (isSun ? "#f59e0b" : "#a855f7") }} 
                    />
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 rounded-tr-2xl opacity-30" 
                      style={{ borderColor: isFlipped ? (isSun ? "#10b981" : "#34d399") : (isSun ? "#f59e0b" : "#a855f7") }} 
                    />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 rounded-bl-2xl opacity-30" 
                      style={{ borderColor: isFlipped ? (isSun ? "#10b981" : "#34d399") : (isSun ? "#f59e0b" : "#a855f7") }} 
                    />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 rounded-br-2xl opacity-30" 
                      style={{ borderColor: isFlipped ? (isSun ? "#10b981" : "#34d399") : (isSun ? "#f59e0b" : "#a855f7") }} 
                    />

                    {/* Card label */}
                    <div className={`text-xs font-bold uppercase tracking-widest mb-8 px-4 py-2 rounded-full ${
                      isFlipped 
                        ? (isSun ? "bg-emerald-200 text-emerald-800" : "bg-emerald-900/50 text-emerald-300")
                        : (isSun ? "bg-amber-200 text-amber-800" : "bg-purple-900/50 text-purple-300")
                    }`}>
                      {isFlipped ? "✦ Answer ✦" : "✧ Question ✧"}
                    </div>

                    {/* Card content */}
                    <p className={`text-2xl font-bold leading-relaxed max-w-lg font-[family-name:var(--font-nunito)] ${
                      isFlipped 
                        ? (isSun ? "text-emerald-900" : "text-emerald-100")
                        : (isSun ? "text-amber-900" : "text-purple-100")
                    }`}>
                      {isFlipped ? currentCard.back : currentCard.front}
                    </p>

                    {/* Instruction hint */}
                    <p className={`text-xs mt-10 italic ${
                      isFlipped 
                        ? (isSun ? "text-emerald-600/70" : "text-emerald-400/60")
                        : (isSun ? "text-amber-600/70" : "text-purple-400/60")
                    }`}>
                      {isFlipped ? "Grade your knowledge below" : "Click to reveal answer"}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          </>
        )}
      </div>

      {/* Navigation & Grading Controls */}
      {selectedDeck.cards.length > 0 && (
        <div className="relative z-10 w-full max-w-3xl mt-10">
          <AnimatePresence mode="wait">
            {!isFlipped ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex items-center justify-center gap-8"
              >
                <button 
                  onClick={handlePrev} 
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all border-2 ${
                    isSun 
                      ? "bg-amber-100 border-amber-300 hover:bg-amber-200 text-amber-800" 
                      : "bg-purple-950/50 border-purple-700/50 hover:bg-purple-900/50 text-purple-300"
                  }`}
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                
                <button
                  onClick={() => setIsFlipped(true)}
                  className={`px-10 py-5 rounded-2xl flex items-center gap-3 font-bold text-lg transition-all ${
                    isSun 
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30" 
                      : "bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700 shadow-lg shadow-purple-600/50"
                  }`}
                >
                  <RotateCcw className="w-6 h-6" />
                  Reveal Answer
                </button>
                
                <button 
                  onClick={handleNext} 
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all border-2 ${
                    isSun 
                      ? "bg-amber-100 border-amber-300 hover:bg-amber-200 text-amber-800" 
                      : "bg-purple-950/50 border-purple-700/50 hover:bg-purple-900/50 text-purple-300"
                  }`}
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="grid grid-cols-4 gap-4"
              >
                {[
                  { q: 0, label: "Again", color: isSun ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-red-500/20 text-red-400 hover:bg-red-500/30", icon: "❌" },
                  { q: 1, label: "Hard", color: isSun ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30", icon: "⚠️" },
                  { q: 2, label: "Good", color: isSun ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30", icon: "✓" },
                  { q: 3, label: "Easy", color: isSun ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30", icon: "✓✓" },
                ].map((btn) => (
                  <button
                    key={btn.q}
                    onClick={() => handleGradeCard(btn.q)}
                    className={`flex flex-col items-center justify-center py-5 rounded-xl transition-all font-bold border-2 border-transparent hover:border-current ${btn.color}`}
                  >
                    <span className="text-2xl mb-2">{btn.icon}</span>
                    <BrainCircuit className="w-5 h-5 mb-1" />
                    <span className="text-sm">{btn.label}</span>
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
