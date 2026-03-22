"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, AlertCircle, Lock } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useGameStore } from "@/stores";
import { useUIStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import QuizCreator from "@/components/quiz/QuizCreator";
import QuizPlayer, { type QuizQuestion } from "@/components/quiz/QuizPlayer";
import QuizResults from "@/components/quiz/QuizResults";

type QuizState = "hub" | "creating" | "playing" | "results" | "locked";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_AI_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

export default function SubjectQuizPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const { awardXp, awardGold, logActivity } = useGameStore();
  const { addToast } = useUIStore();
  const isSun = theme === "sun";

  const [state, setState] = useState<QuizState>("hub");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [xpEarned, setXpEarned] = useState(0);
  const [goldEarned, setGoldEarned] = useState(0);
  const [pastQuizzes, setPastQuizzes] = useState<any[]>([]);
  const [masteryData, setMasteryData] = useState({
    notesCompletion: 0,
    cardsMastery: 0,
    isUnlocked: false,
  });
  const [isLoadingMastery, setIsLoadingMastery] = useState(true);

  // Check mastery requirements
  useEffect(() => {
    if (!user || !subjectId) return;

    const checkMastery = async () => {
      setIsLoadingMastery(true);
      
      // Fetch notes count for this subject
      const { data: notesData } = await (supabase.from("notes") as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("subject_id", subjectId);

      // Fetch cards for this subject (via decks)
      const { data: decksData } = await (supabase.from("decks") as any)
        .select("id, cards(mastery)")
        .eq("user_id", user.id)
        .eq("subject_id", subjectId);

      const notesCompletion = notesData
        ? Math.min((notesData.length / 10) * 100, 100)
        : 0;

      let cardsMastery = 0;
      if (decksData && decksData.length > 0) {
        const allCards = decksData.flatMap((d: any) => d.cards || []);
        if (allCards.length > 0) {
          cardsMastery =
            allCards.reduce((sum: number, c: any) => sum + (c.mastery || 0), 0) /
            allCards.length;
        }
      }

      const isUnlocked = notesCompletion >= 30 && cardsMastery >= 40;

      setMasteryData({
        notesCompletion,
        cardsMastery,
        isUnlocked,
      });

      if (!isUnlocked) {
        setState("locked");
      }

      setIsLoadingMastery(false);
    };

    checkMastery();
  }, [user, subjectId]);

  // Fetch past quizzes for this subject
  const fetchPastQuizzes = useCallback(async () => {
    if (!user || !subjectId) return;
    const { data } = await (supabase.from("quiz_attempts") as any)
      .select("id, score, total_questions, xp_earned, completed_at, quiz_id")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(10);

    if (data) {
      setPastQuizzes(
        data.map((d: any) => ({
          id: d.id,
          title: `Quiz Attempt`,
          score: d.score,
          total: d.total_questions,
          created_at: d.completed_at,
        }))
      );
    }
  }, [user, subjectId]);

  useEffect(() => {
    fetchPastQuizzes();
  }, [fetchPastQuizzes]);

  const handleGenerate = useCallback(
    async (settings: {
      content: string;
      numQuestions: number;
      difficulty: string;
      timeLimit: number;
      questionTypes: string[];
    }) => {
      setIsGenerating(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/ai/generate-quiz`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: settings.content,
            num_questions: settings.numQuestions,
            difficulty: settings.difficulty,
            question_types: settings.questionTypes,
          }),
        });

        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setTimePerQuestion(settings.timeLimit);
          setState("playing");
        } else {
          addToast(data.error || "Failed to generate quiz", "error");
        }
      } catch (error) {
        addToast(
          "Failed to connect to AI service. Make sure the backend is running.",
          "error"
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [addToast]
  );

  const handleQuizComplete = useCallback(
    async (playerAnswers: string[], playerScore: number) => {
      setAnswers(playerAnswers);
      setScore(playerScore);

      const pct = playerScore / questions.length;
      const xp = Math.round(pct * questions.length * 15);
      const gold = Math.round(pct * questions.length * 5);
      setXpEarned(xp);
      setGoldEarned(gold);

      if (user) {
        await awardXp(user.id, xp);
        await awardGold(user.id, gold);
        await logActivity(user.id, "quest", xp, {
          type: "quiz",
          subject_id: subjectId,
          score: playerScore,
          total: questions.length,
        });

        try {
          const { data: quizData } = await (supabase.from("quizzes") as any)
            .insert({
              user_id: user.id,
              subject_id: subjectId,
              title: `Quiz - ${new Date().toLocaleDateString()}`,
              questions: questions as unknown as import("@/lib/database.types").Json,
            })
            .select("id")
            .single();

          if (quizData) {
            await (supabase.from("quiz_attempts") as any).insert({
              quiz_id: quizData.id,
              user_id: user.id,
              score: playerScore,
              total_questions: questions.length,
              answers: playerAnswers,
              xp_earned: xp,
              gold_earned: gold,
            });
          }
        } catch (error) {
          console.error("Failed to save quiz attempt:", error);
        }
      }

      setState("results");
    },
    [questions, user, subjectId, awardXp, awardGold, logActivity]
  );

  const handleBackToHub = () => {
    setState("hub");
    setQuestions([]);
    setAnswers([]);
  };

  // ===== Locked State =====
  if (state === "locked" && !isLoadingMastery) {
    return (
      <div className="w-full px-6 py-12 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border-2 p-8 text-center ${
            isSun
              ? "bg-white/50 border-amber-200"
              : "bg-slate-800/50 border-amber-500/30"
          }`}
        >
          <Lock className={`w-20 h-20 mx-auto mb-6 ${
            isSun ? "text-amber-600" : "text-amber-400"
          }`} />

          <h2 className={`text-3xl font-bold mb-4 ${
            isSun ? "text-slate-800" : "text-white"
          }`}>
            🔒 Trials Locked
          </h2>

          <p className={`text-lg mb-8 ${
            isSun ? "text-slate-600" : "text-slate-300"
          }`}>
            Master your spellbook and spell cards before attempting trials.
          </p>

          {/* Requirements */}
          <div className="space-y-4 mb-8">
            {/* Spellbook */}
            <div className={`p-4 rounded-lg border ${
              masteryData.notesCompletion >= 30
                ? isSun
                  ? "bg-green-50 border-green-200"
                  : "bg-green-500/10 border-green-500/30"
                : isSun
                ? "bg-red-50 border-red-200"
                : "bg-red-500/10 border-red-500/30"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold ${
                  masteryData.notesCompletion >= 30
                    ? "text-green-700"
                    : "text-red-700"
                }`}>
                  📖 Spellbook
                </span>
                <span className={`font-bold ${
                  masteryData.notesCompletion >= 30
                    ? isSun
                      ? "text-green-600"
                      : "text-green-400"
                    : isSun
                    ? "text-red-600"
                    : "text-red-400"
                }`}>
                  {Math.round(masteryData.notesCompletion)}%
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${
                isSun ? "bg-slate-200" : "bg-slate-700"
              }`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${masteryData.notesCompletion}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className={`h-full bg-gradient-to-r ${
                    masteryData.notesCompletion >= 30
                      ? "from-green-400 to-emerald-500"
                      : "from-red-400 to-orange-500"
                  }`}
                />
              </div>
              <p className={`text-xs mt-2 ${
                isSun ? "text-slate-500" : "text-slate-400"
              }`}>
                Need 30% - {Math.round(30 - masteryData.notesCompletion)} more needed
              </p>
            </div>

            {/* Spell Cards */}
            <div className={`p-4 rounded-lg border ${
              masteryData.cardsMastery >= 40
                ? isSun
                  ? "bg-green-50 border-green-200"
                  : "bg-green-500/10 border-green-500/30"
                : isSun
                ? "bg-red-50 border-red-200"
                : "bg-red-500/10 border-red-500/30"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold ${
                  masteryData.cardsMastery >= 40
                    ? "text-green-700"
                    : "text-red-700"
                }`}>
                  ✨ Spell Cards
                </span>
                <span className={`font-bold ${
                  masteryData.cardsMastery >= 40
                    ? isSun
                      ? "text-green-600"
                      : "text-green-400"
                    : isSun
                    ? "text-red-600"
                    : "text-red-400"
                }`}>
                  {Math.round(masteryData.cardsMastery)}%
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${
                isSun ? "bg-slate-200" : "bg-slate-700"
              }`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${masteryData.cardsMastery}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className={`h-full bg-gradient-to-r ${
                    masteryData.cardsMastery >= 40
                      ? "from-green-400 to-emerald-500"
                      : "from-red-400 to-orange-500"
                  }`}
                />
              </div>
              <p className={`text-xs mt-2 ${
                isSun ? "text-slate-500" : "text-slate-400"
              }`}>
                Need 40% - {Math.round(Math.max(0, 40 - masteryData.cardsMastery))} more needed
              </p>
            </div>
          </div>

          {/* Help text */}
          <div className={`mb-8 p-4 rounded-lg flex gap-3 ${
            isSun
              ? "bg-blue-50 border border-blue-200"
              : "bg-blue-500/10 border border-blue-500/30"
          }`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              isSun ? "text-blue-600" : "text-blue-400"
            }`} />
            <p className={`text-sm ${
              isSun ? "text-blue-700" : "text-blue-300"
            }`}>
              Visit your Spellbook to write more notes and your Spell Cards to review cards. Progress will update in real-time!
            </p>
          </div>

          {/* Navigation */}
          <div className="flex gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/arcane-archive/${subjectId}/spellbook`)}
              className="px-6 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold"
            >
              📖 Study Spellbook
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/arcane-archive/${subjectId}/flashcards`)}
              className="px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold"
            >
              ✨ Practice Cards
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ===== Hub/Creator State =====
  if (state === "hub" || state === "creating") {
    return (
      <div className="w-full px-6 py-12 max-w-4xl mx-auto">
        {state === "hub" && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <h2 className={`text-3xl font-bold mb-2 ${
                isSun ? "text-slate-800" : "text-white"
              }`}>
                ⚔️ Trials
              </h2>
              <p className={`text-sm ${
                isSun ? "text-slate-500" : "text-slate-400"
              }`}>
                Test your knowledge with AI-generated quizzes based on your notes and flashcards.
              </p>
            </motion.div>

            {/* Past Quizzes */}
            {pastQuizzes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h3 className={`text-lg font-bold mb-4 ${
                  isSun ? "text-slate-800" : "text-white"
                }`}>
                  Recent Attempts
                </h3>
                <div className="space-y-2">
                  {pastQuizzes.slice(0, 5).map((quiz) => (
                    <div
                      key={quiz.id}
                      className={`p-3 rounded-lg flex items-center justify-between ${
                        isSun
                          ? "bg-slate-50 border border-slate-200"
                          : "bg-slate-800 border border-slate-700"
                      }`}
                    >
                      <div>
                        <p className={`font-semibold ${
                          isSun ? "text-slate-800" : "text-white"
                        }`}>
                          {quiz.title}
                        </p>
                        <p className={`text-xs ${
                          isSun ? "text-slate-500" : "text-slate-400"
                        }`}>
                          {new Date(quiz.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`text-lg font-bold ${
                        quiz.score / quiz.total >= 0.7
                          ? "text-emerald-600"
                          : "text-orange-600"
                      }`}>
                        {quiz.score}/{quiz.total}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Create New Quiz Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setState("creating")}
              className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Create New Trial
            </motion.button>
          </>
        )}

        {state === "creating" && (
          <QuizCreator
            onGenerate={handleGenerate}
            isLoading={isGenerating}
            onCancel={handleBackToHub}
          />
        )}
      </div>
    );
  }

  // ===== Playing State =====
  if (state === "playing") {
    return (
      <div className="w-full px-6 py-12">
        <QuizPlayer
          questions={questions}
          timePerQuestion={timePerQuestion}
          onComplete={handleQuizComplete}
          onCancel={handleBackToHub}
        />
      </div>
    );
  }

  // ===== Results State =====
  if (state === "results") {
    return (
      <div className="w-full px-6 py-12">
        <QuizResults
          questions={questions}
          answers={answers}
          score={score}
          xpEarned={xpEarned}
          goldEarned={goldEarned}
          onRetry={handleBackToHub}
        />
      </div>
    );
  }

  return null;
}
