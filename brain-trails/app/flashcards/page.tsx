"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronLeft, ChevronRight, Plus, Shuffle, Brain, BrainCircuit, Zap, Trash2 } from "lucide-react";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useGameStore } from "@/stores";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { supabase } from "@/lib/supabase";
import { gameText } from "@/constants/gameText";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastery: number; // 0-100
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
            i < filled ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-slate-200 dark:bg-slate-700"
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

export default function FlashcardsPage() {
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

  // AI Generation state
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [syllabusSubjects, setSyllabusSubjects] = useState<{id: string; name: string; emoji: string; topics: {id: string; name: string}[]}[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch syllabus subjects for AI generator
  useEffect(() => {
    if (!user) return;
    const fetchSyllabusSubjects = async () => {
      const { data: semData } = await (supabase.from("semesters") as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!semData) return;

      const { data: subs } = await (supabase.from("subjects") as any)
        .select("id, name, emoji")
        .eq("semester_id", semData.id)
        .order("name");

      if (!subs || subs.length === 0) return;

      const subjectIds = subs.map((s: { id: string }) => s.id);
      const { data: topics } = await (supabase.from("topics") as any)
        .select("id, name, subject_id")
        .in("subject_id", subjectIds)
        .order("sort_order");

      const enriched = subs.map((s: { id: string; name: string; emoji: string }) => ({
        ...s,
        topics: (topics ?? []).filter((t: { subject_id: string }) => t.subject_id === s.id).map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })),
      }));

      setSyllabusSubjects(enriched);
    };
    fetchSyllabusSubjects();
  }, [user]);

  const handleAiGenerate = async () => {
    if (!user || !selectedSubjectId) return;

    const subject = syllabusSubjects.find(s => s.id === selectedSubjectId);
    if (!subject) return;

    const topic = subject.topics.find(t => t.id === selectedTopicId);
    const topicName = topic ? topic.name : "General";

    setIsGenerating(true);

    try {
      // Call the AI backend to generate flashcard content
      const aiUrl = process.env.NEXT_PUBLIC_AI_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${aiUrl}/api/ai/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.name,
          topic: topicName,
          count: 8,
          type: "flashcard",
        }),
      });

      const data = await res.json();

      if (!data.questions || data.questions.length === 0) {
        throw new Error("No flashcards generated");
      }

      // Create the deck
      const deckName = `${subject.emoji} ${subject.name} — ${topicName}`;
      const emoji = subject.emoji || EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];

      const { data: deckData, error: deckErr } = await supabase
        .from("decks")
        .insert({ user_id: user.id, name: deckName, emoji, color, subject_id: subject.id })
        .select()
        .single();

      if (deckErr || !deckData) throw new Error("Failed to create deck");

      // Insert cards
      const cardInserts = data.questions.map((q: { question: string; answer: string }) => ({
        deck_id: deckData.id,
        front: q.question,
        back: q.answer,
        mastery: 0,
        review_count: 0,
      }));

      const { data: cardData } = await supabase.from("cards").insert(cardInserts).select();

      const newDeck: Deck = {
        id: deckData.id,
        name: deckName,
        emoji,
        color,
        cards: (cardData ?? []) as Flashcard[],
      };

      setDecks(prev => [...prev, newDeck]);
      setShowAiGenerator(false);
      setSelectedSubjectId("");
      setSelectedTopicId("");

      // Award XP for generating a deck
      await awardXp(user.id, 25);
      await logActivity(user.id, "flashcard", 25, {
        type: "ai_deck_generated",
        deck_name: deckName,
      });
      refreshProfile();

      playSound("success");
    } catch (err) {
      console.error("AI generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchDecks = async () => {
      const { data, error } = await supabase
        .from('decks')
        .select(`
          id, name, emoji, color,
          cards ( id, front, back, mastery, review_count )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching decks:", error);
      } else {
        // Sort cards within decks by created_at or id so they have a stable order
        const raw = (data ?? []) as unknown as Deck[];
        const formattedDecks = raw.map(d => ({
          ...d,
          cards: (d.cards || []).sort((a: Flashcard, b: Flashcard) => a.id.localeCompare(b.id))
        }));
        setDecks(formattedDecks);
      }
      setIsLoading(false);
    };

    fetchDecks();
  }, [user]);

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
    setSelectedDeck(updatedDeck);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleCreateDeck = async () => {
    if (!user || !newDeckName.trim()) return;

    const newDeck = {
      user_id: user.id,
      name: newDeckName.trim(),
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };

    const { data, error } = await supabase
      .from('decks')
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
    if (!confirm("Are you sure you want to delete this deck? All cards inside will be lost!")) return;

    const { error } = await supabase.from('decks').delete().eq('id', deckId);
    if (!error) {
      setDecks(decks.filter(d => d.id !== deckId));
    }
  };

  const handleAddCard = async () => {
    if (!selectedDeck || !newFront.trim() || !newBack.trim() || !user) return;
    
    const { data, error } = await supabase
      .from('cards')
      .insert({
        deck_id: selectedDeck.id,
        front: newFront.trim(),
        back: newBack.trim(),
        mastery: 0,
        review_count: 0
      })
      .select()
      .single();

    if (!error && data) {
      const updatedDeck = {
        ...selectedDeck,
        cards: [...selectedDeck.cards, data],
      };
      setDecks((prev) => prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)));
      setSelectedDeck(updatedDeck);
      setNewFront("");
      setNewBack("");
      setShowNewCard(false);
      
      // Jump to the newly added card instance
      setCurrentIndex(updatedDeck.cards.length - 1);
    }
  };

  const handleGradeCard = async (quality: number) => {
    if (!currentCard || !selectedDeck) return;
    playSound(quality >= 2 ? "success" : "click");

    // Very simple SM-2 inspired grading
    // quality: 0 (Again), 1 (Hard), 2 (Good), 3 (Easy)
    let newMastery = currentCard.mastery;
    
    if (quality === 0) newMastery = Math.max(0, newMastery - 20);
    else if (quality === 1) newMastery = Math.min(100, newMastery + 10);
    else if (quality === 2) newMastery = Math.min(100, newMastery + 20);
    else if (quality === 3) newMastery = Math.min(100, newMastery + 40);

    const updatedCard = { 
      ...currentCard, 
      mastery: newMastery,
      review_count: currentCard.review_count + 1
    };

    // Update locally immediately for responsiveness
    const updatedCards = [...selectedDeck.cards];
    updatedCards[currentIndex] = updatedCard;
    const updatedDeck = { ...selectedDeck, cards: updatedCards };
    
    setSelectedDeck(updatedDeck);
    setDecks(prev => prev.map(d => d.id === updatedDeck.id ? updatedDeck : d));

    // Update in background
    await supabase
      .from('cards')
      .update({ mastery: newMastery, review_count: updatedCard.review_count })
      .eq('id', currentCard.id);

    // Also award some DB XP for studying
    if (profile && user) {
      const gainedXp = 2; // small amount per card

      await awardXp(user.id, gainedXp);
      await logActivity(user.id, 'flashcard', gainedXp, {
        deck_id: selectedDeck.id,
        deck_name: selectedDeck.name,
        card_id: currentCard.id,
      });

      refreshProfile();
    }

    // Move to next card automatically after grading
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
            className="mb-10 flex justify-between items-end"
          >
            <div>
              <h1 className={`text-4xl font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
                🃏 {gameText.study.flashcards}
              </h1>
              <p className={`mt-2 ${isSun ? "text-slate-600" : "text-slate-400"} font-[family-name:var(--font-quicksand)]`}>
                Choose a deck to study, or create a new one.
              </p>
            </div>
            
            <div className="flex gap-2">
              {syllabusSubjects.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowAiGenerator(!showAiGenerator); setShowNewDeck(false); }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/30"
                >
                  <BrainCircuit className="w-5 h-5" />
                  <span className="font-bold hidden sm:inline">AI Generate</span>
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setShowNewDeck(!showNewDeck); setShowAiGenerator(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/30"
              >
                <Plus className="w-5 h-5" />
                <span className="font-bold">New Deck</span>
              </motion.button>
            </div>
          </motion.div>

          {/* AI Generator Panel */}
          <AnimatePresence>
            {showAiGenerator && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-8 p-6 rounded-2xl border-2 overflow-hidden ${isSun ? "bg-white/80 border-amber-200" : "bg-slate-800/95 border-amber-500/30"}`}
              >
                <h3 className={`text-base font-bold mb-1 ${isSun ? "text-slate-700" : "text-white"}`}>
                  🤖 AI Flashcard Generator
                </h3>
                <p className={`text-xs mb-4 ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                  Pick a subject and topic from your syllabus — AI will create 8 study cards.
                </p>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => { setSelectedSubjectId(e.target.value); setSelectedTopicId(""); }}
                      className={`flex-1 px-4 py-3 rounded-xl outline-none font-medium ${
                        isSun
                          ? "bg-slate-50 border border-slate-200 text-slate-800"
                          : "bg-slate-700/80 border border-slate-600 text-white [&>option]:bg-slate-700 [&>option]:text-white"
                      }`}
                    >
                      <option value="">Select Subject...</option>
                      {syllabusSubjects.map(s => (
                        <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
                      ))}
                    </select>

                    {selectedSubjectId && (
                      <select
                        value={selectedTopicId}
                        onChange={(e) => setSelectedTopicId(e.target.value)}
                        className={`flex-1 px-4 py-3 rounded-xl outline-none font-medium ${
                          isSun
                            ? "bg-slate-50 border border-slate-200 text-slate-800"
                            : "bg-slate-700/80 border border-slate-600 text-white [&>option]:bg-slate-700 [&>option]:text-white"
                        }`}
                      >
                        <option value="">All Topics (General)</option>
                        {syllabusSubjects.find(s => s.id === selectedSubjectId)?.topics.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <button
                    onClick={handleAiGenerate}
                    disabled={!selectedSubjectId || isGenerating}
                    className="w-full sm:w-auto self-start px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                  >
                    {isGenerating ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
                    ) : (
                      <><BrainCircuit className="w-4 h-4" /> Generate 8 Cards</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showNewDeck && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-8 p-6 rounded-2xl border-2 ${isSun ? "bg-white/80 border-purple-200" : "bg-white/5 border-purple-400/30"}`}
              >
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    placeholder="Enter deck name (e.g. Astrophysics 101)"
                    className={`flex-1 px-4 py-3 rounded-xl outline-none ${
                      isSun ? "bg-slate-50 border border-slate-200 text-slate-800" : "bg-white/10 border border-white/10 text-white placeholder:text-slate-400"
                    }`}
                  />
                  <button
                    onClick={handleCreateDeck}
                    disabled={!newDeckName.trim()}
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.length === 0 ? (
                 <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12 text-slate-500 italic">
                   No decks yet! Create your first deck and earn 50 XP 🎴
                 </div>
              ) : decks.map((deck, i) => (
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
                    className={`w-full h-full p-6 rounded-2xl text-left transition-all ${
                      isSun
                        ? "bg-white/80 backdrop-blur-sm border-2 border-slate-200 hover:shadow-xl hover:border-purple-300 hover:-translate-y-1"
                        : "bg-slate-800/90 backdrop-blur-sm border-2 border-purple-400/20 hover:shadow-xl hover:border-purple-400/50 hover:-translate-y-1"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-4xl">{deck.emoji}</div>
                    </div>
                    <h3 className={`text-lg font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white drop-shadow-sm"}`}>
                      {deck.name}
                    </h3>
                    <p className={`text-sm mt-1 ${isSun ? "text-slate-500" : "text-slate-300"}`}>
                      {deck.cards.length} cards
                    </p>
                    {/* Mastery bar */}
                    {deck.cards.length > 0 && (
                      <div className="mt-4">
                        <div className={`h-1.5 rounded-full overflow-hidden ${isSun ? "bg-slate-100" : "bg-white/10"}`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.round(deck.cards.reduce((s, c) => s + c.mastery, 0) / deck.cards.length)}%`,
                            }}
                            className={`h-full rounded-full bg-gradient-to-r ${deck.color}`}
                          />
                        </div>
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
              ))}
            </div>
          )}
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
              isSun ? "hover:bg-slate-100 text-slate-600" : "hover:bg-white/10 text-slate-300"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Decks</span>
          </motion.button>

          <h2 className={`text-xl font-bold font-[family-name:var(--font-nunito)] flex items-center gap-2 ${isSun ? "text-slate-800" : "text-white"}`}>
            <span>{selectedDeck.emoji}</span> {selectedDeck.name}
          </h2>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShuffle}
              className={`p-2 rounded-xl transition-colors ${isSun ? "hover:bg-slate-100 text-slate-500" : "hover:bg-white/10 text-slate-400"}`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewCard(!showNewCard)}
              className={`p-2 rounded-xl transition-colors ${isSun ? "hover:bg-slate-100 text-slate-500" : "hover:bg-white/10 text-slate-400"}`}
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
                isSun ? "bg-white/80 border-purple-200" : "bg-white/5 border-purple-400/30"
              }`}
            >
              <input
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                placeholder="Front (question)..."
                className={`w-full px-3 py-2 rounded-xl mb-2 text-sm outline-none ${
                  isSun ? "bg-slate-50 border border-slate-200 text-slate-800" : "bg-white/10 border border-white/10 text-white placeholder:text-slate-500"
                }`}
              />
              <input
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                placeholder="Back (answer)..."
                className={`w-full px-3 py-2 rounded-xl mb-3 text-sm outline-none ${
                  isSun ? "bg-slate-50 border border-slate-200 text-slate-800" : "bg-white/10 border border-white/10 text-white placeholder:text-slate-500"
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
        {selectedDeck.cards.length > 0 && (
          <p className={`text-sm mb-4 font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-500" : "text-slate-400"}`}>
            Card {currentIndex + 1} of {selectedDeck.cards.length}
          </p>
        )}

        {/* Flashcard */}
        {selectedDeck.cards.length === 0 ? (
          <div className={`mt-20 p-12 text-center rounded-3xl border-2 border-dashed ${isSun ? "border-slate-300 text-slate-500" : "border-white/20 text-slate-400"}`}>
            <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">This deck is empty</h3>
            <p>Add some cards using the + button above to start studying.</p>
          </div>
        ) : currentCard && (
          <motion.div
            key={currentCard.id + (isFlipped ? "-back" : "-front")}
            onClick={() => { playSound("cardFlip"); setIsFlipped(!isFlipped); }}
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
                className={`w-full min-h-[320px] p-8 rounded-3xl flex flex-col items-center justify-center text-center border-2 ${
                  isFlipped
                    ? isSun
                      ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300"
                      : "bg-gradient-to-br from-emerald-950 to-teal-950 border-emerald-500/30"
                    : isSun
                    ? "bg-white border-slate-200 shadow-xl"
                    : "bg-white/5 border-white/10 shadow-xl"
                }`}
              >
                <div className={`text-xs font-bold uppercase tracking-wider mb-6 ${isFlipped ? "text-emerald-500" : isSun ? "text-slate-400" : "text-slate-500"}`}>
                  {isFlipped ? "Answer" : "Question"}
                </div>
                
                <p className={`text-2xl font-medium font-[family-name:var(--font-quicksand)] leading-relaxed flex-1 flex items-center ${isSun ? "text-slate-800" : "text-white"}`}>
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>
                
                <div className="mt-8 w-full">
                  <MasteryDots mastery={currentCard.mastery} />
                  <p className={`text-xs mt-3 opacity-60 ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                    {isFlipped ? "Grade your knowledge below" : "Click to reveal answer"}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* Navigation & Grading */}
        {selectedDeck.cards.length > 0 && (
          <div className="w-full mt-8">
            <AnimatePresence mode="wait">
              {!isFlipped ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center gap-6"
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={handlePrev}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${isSun ? "bg-white text-slate-600 hover:text-purple-600" : "bg-slate-800 text-slate-300 hover:text-purple-400"}`}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsFlipped(true)}
                    className="px-8 py-4 rounded-2xl flex items-center gap-3 font-bold text-lg transition-colors shadow-lg shadow-purple-500/30 bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Reveal Answer
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={handleNext}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${isSun ? "bg-white text-slate-600 hover:text-purple-600" : "bg-slate-800 text-slate-300 hover:text-purple-400"}`}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-4 gap-3 w-full"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleGradeCard(0)}
                    className="flex flex-col items-center justify-center py-3 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                  >
                    <BrainCircuit className="w-5 h-5 mb-1" />
                    <span className="font-bold text-sm">Again</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleGradeCard(1)}
                    className="flex flex-col items-center justify-center py-3 rounded-xl bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-500/30 transition-colors"
                  >
                    <Zap className="w-5 h-5 mb-1" />
                    <span className="font-bold text-sm">Hard</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleGradeCard(2)}
                    className="flex flex-col items-center justify-center py-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors"
                  >
                    <Brain className="w-5 h-5 mb-1" />
                    <span className="font-bold text-sm">Good</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleGradeCard(3)}
                    className="flex flex-col items-center justify-center py-3 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors"
                  >
                    <Zap className="w-5 h-5 mb-1 text-blue-500" style={{ fill: "currentColor" }} />
                    <span className="font-bold text-sm">Easy</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Card tracker pagination dots */}
        {selectedDeck.cards.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-8 max-w-sm">
            {selectedDeck.cards.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentIndex(i);
                  setIsFlipped(false);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "bg-purple-500 w-6"
                    : isSun
                    ? "w-2 bg-slate-300 hover:bg-slate-400"
                    : "w-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <TravelerHotbar />
    </main>
  );
}
