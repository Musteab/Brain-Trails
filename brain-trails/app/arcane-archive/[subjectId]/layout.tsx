"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Wand2, BarChart3, Lock } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type KnowledgePath = Database["public"]["Tables"]["knowledge_paths"]["Row"];

interface ArcaneArchiveLayoutProps {
  children: React.ReactNode;
}

export default function ArcaneArchiveLayout({ children }: ArcaneArchiveLayoutProps) {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isSun = theme === "sun";
  
  const subjectId = params.subjectId as string;
  const [subject, setSubject] = useState<KnowledgePath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [masteryData, setMasteryData] = useState({
    notesCompletion: 0,
    flashcardsCompletion: 0,
    quizUnlocked: false,
  });

  // Fetch subject data
  useEffect(() => {
    if (!user || !subjectId) return;

    const fetchSubject = async () => {
      setIsLoading(true);
      const { data, error } = await (supabase.from("knowledge_paths") as any)
        .select("*")
        .eq("id", subjectId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching subject:", error);
        router.push("/arcane-archive");
      } else {
        setSubject(data);
      }
      setIsLoading(false);
    };

    fetchSubject();
  }, [user, subjectId, router]);

  // Calculate mastery data (simplified for now)
  useEffect(() => {
    if (!user || !subjectId) return;

    const calculateMastery = async () => {
      // Fetch notes count for this subject
      const { data: notes } = await (supabase.from("notes") as any)
        .select("id")
        .eq("user_id", user.id);
      // .eq("subject_id", subjectId); // Will add this field

      // Fetch flashcards for this subject
      const { data: cards } = await (supabase.from("cards") as any)
        .select("mastery")
        .eq("user_id", user.id);
      // .eq("subject_id", subjectId); // Will add this field

      const notesCompletion = notes ? Math.min((notes.length / 10) * 100, 100) : 0;
      const cardsAvgMastery = cards
        ? cards.reduce((sum, c) => sum + (c.mastery || 0), 0) / cards.length
        : 0;

      const quizUnlocked = notesCompletion >= 30 && cardsAvgMastery >= 40;

      setMasteryData({
        notesCompletion,
        flashcardsCompletion: cardsAvgMastery,
        quizUnlocked,
      });
    };

    calculateMastery();
  }, [user, subjectId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    );
  }

  if (!subject) {
    return null;
  }

  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  const isSpellbook = currentPath.includes("/spellbook");
  const isFlashcards = currentPath.includes("/flashcards");
  const isQuiz = currentPath.includes("/quiz");

  return (
    <main className={`relative min-h-screen flex flex-col ${
      isSun
        ? "bg-gradient-to-br from-teal-50 via-emerald-50 to-amber-50"
        : "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950"
    }`}>
      {/* Background texture */}
      <div className={`fixed inset-0 opacity-30 pointer-events-none ${
        isSun ? "" : "opacity-10"
      }`} style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, ${
          isSun ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.05)"
        } 1px, transparent 0)`,
        backgroundSize: "32px 32px"
      }} />

      {/* Header with subject info */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-40 backdrop-blur-xl border-b ${
          isSun
            ? "bg-white/70 border-slate-200/50"
            : "bg-slate-900/70 border-slate-700/50"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Back button */}
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/arcane-archive")}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
              isSun
                ? "hover:bg-slate-100 text-slate-600"
                : "hover:bg-white/10 text-slate-300"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Archive</span>
          </motion.button>

          {/* Subject info */}
          <div className="flex items-center gap-3">
            <div className="text-2xl">{subject.emoji || "📚"}</div>
            <div>
              <h1 className={`font-bold text-lg ${
                isSun ? "text-slate-800" : "text-white"
              }`}>
                {subject.name}
              </h1>
              {subject.description && (
                <p className={`text-xs ${
                  isSun ? "text-slate-500" : "text-slate-400"
                }`}>
                  {subject.description}
                </p>
              )}
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex gap-2">
            {/* Spellbook */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/arcane-archive/${subjectId}/spellbook`)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                isSpellbook
                  ? isSun
                    ? "bg-amber-100 text-amber-700"
                    : "bg-amber-500/20 text-amber-300"
                  : isSun
                  ? "hover:bg-slate-100 text-slate-600"
                  : "hover:bg-white/10 text-slate-300"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-medium">Spellbook</span>
            </motion.button>

            {/* Flashcards */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/arcane-archive/${subjectId}/flashcards`)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                isFlashcards
                  ? isSun
                    ? "bg-violet-100 text-violet-700"
                    : "bg-violet-500/20 text-violet-300"
                  : isSun
                  ? "hover:bg-slate-100 text-slate-600"
                  : "hover:bg-white/10 text-slate-300"
              }`}
            >
              <Wand2 className="w-4 h-4" />
              <span className="text-xs font-medium">Flashcards</span>
            </motion.button>

            {/* Quiz (with lock indicator) */}
            <motion.button
              whileHover={masteryData.quizUnlocked ? { scale: 1.05 } : {}}
              whileTap={masteryData.quizUnlocked ? { scale: 0.95 } : {}}
              onClick={() => {
                if (masteryData.quizUnlocked) {
                  router.push(`/arcane-archive/${subjectId}/quiz`);
                }
              }}
              disabled={!masteryData.quizUnlocked}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isQuiz
                  ? isSun
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-emerald-500/20 text-emerald-300"
                  : isSun
                  ? "hover:bg-slate-100 text-slate-600"
                  : "hover:bg-white/10 text-slate-300"
              }`}
            >
              {!masteryData.quizUnlocked && <Lock className="w-4 h-4" />}
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs font-medium">Trials</span>
            </motion.button>
          </div>
        </div>

        {/* Mastery progress bar */}
        <div className={`border-t ${
          isSun ? "border-slate-100" : "border-slate-800"
        }`}>
          <div className="max-w-7xl mx-auto px-6 py-2 flex gap-6">
            {/* Notes progress */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${
                  isSun ? "text-slate-600" : "text-slate-400"
                }`}>
                  📖 Spellbook
                </span>
                <span className={`text-xs font-bold ${
                  isSun ? "text-slate-700" : "text-slate-300"
                }`}>
                  {Math.round(masteryData.notesCompletion)}%
                </span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${
                isSun ? "bg-slate-200" : "bg-slate-700"
              }`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${masteryData.notesCompletion}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                />
              </div>
            </div>

            {/* Flashcards progress */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${
                  isSun ? "text-slate-600" : "text-slate-400"
                }`}>
                  ✨ Spell Cards
                </span>
                <span className={`text-xs font-bold ${
                  isSun ? "text-slate-700" : "text-slate-300"
                }`}>
                  {Math.round(masteryData.flashcardsCompletion)}%
                </span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${
                isSun ? "bg-slate-200" : "bg-slate-700"
              }`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${masteryData.flashcardsCompletion}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-violet-400 to-purple-500"
                />
              </div>
            </div>

            {/* Quiz unlock status */}
            <div className="flex items-center gap-2">
              {masteryData.quizUnlocked ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20"
                >
                  <span className="text-lg">🔓</span>
                  <span className={`text-xs font-semibold ${
                    isSun ? "text-emerald-700" : "text-emerald-300"
                  }`}>
                    Trials Unlocked!
                  </span>
                </motion.div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-500/20">
                  <span className="text-lg">🔒</span>
                  <span className={`text-xs font-semibold ${
                    isSun ? "text-slate-600" : "text-slate-400"
                  }`}>
                    Locked
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content area */}
      <div className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
