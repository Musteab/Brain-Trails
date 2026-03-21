"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ScrollText, Plus, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useGameStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import BackgroundLayer from "@/components/layout/BackgroundLayer";
import QuizCreator from "@/components/quiz/QuizCreator";
import QuizPlayer, { type QuizQuestion } from "@/components/quiz/QuizPlayer";
import QuizResults from "@/components/quiz/QuizResults";

type QuizState = "hub" | "creating" | "playing" | "results";

const BACKEND_URL = process.env.NEXT_PUBLIC_AI_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function QuizPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { card, isSun, title: titleStyle, muted } = useCardStyles();
  const { awardXp, awardGold, logActivity } = useGameStore();

  const [state, setState] = useState<QuizState>("hub");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [xpEarned, setXpEarned] = useState(0);
  const [goldEarned, setGoldEarned] = useState(0);
  const [pastQuizzes, setPastQuizzes] = useState<Array<{
    id: string;
    title: string;
    score: number;
    total: number;
    created_at: string;
  }>>([]);
  const [activeTab, setActiveTab] = useState<"create" | "past">("create");

  // Fetch past quizzes
  const fetchPastQuizzes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("quiz_attempts")
      .select("id, score, total_questions, xp_earned, completed_at, quiz_id")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(20);

    if (data) {
      setPastQuizzes(data.map(d => ({
        id: d.id,
        title: `Quiz Attempt`,
        score: d.score,
        total: d.total_questions,
        created_at: d.completed_at,
      })));
    }
  }, [user]);

  const handleGenerate = useCallback(async (settings: {
    content: string; numQuestions: number; difficulty: string; timeLimit: number; questionTypes: string[];
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
        alert(data.error || "Failed to generate quiz. Please try again.");
      }
    } catch {
      alert("Failed to connect to AI service. Make sure the backend is running.");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleQuizComplete = useCallback(async (playerAnswers: string[], playerScore: number) => {
    setAnswers(playerAnswers);
    setScore(playerScore);

    // Calculate rewards
    const pct = playerScore / questions.length;
    const xp = Math.round(pct * questions.length * 15);
    const gold = Math.round(pct * questions.length * 5);
    setXpEarned(xp);
    setGoldEarned(gold);

    // Award XP and gold
    if (user) {
      await awardXp(user.id, xp);
      await awardGold(user.id, gold);
      await logActivity(user.id, "quest", xp, {
        type: "quiz",
        score: playerScore,
        total: questions.length,
      });

      // Save quiz and attempt to Supabase
      try {
        const { data: quizData } = await (supabase.from("quizzes") as any)
          .insert({
            user_id: user.id,
            title: `Quiz - ${new Date().toLocaleDateString()}`,
            questions: questions as unknown as import("@/lib/database.types").Json,
          })
          .select("id")
          .single();

        if (quizData) {
          await supabase.from("quiz_attempts").insert({
            quiz_id: quizData.id,
            user_id: user.id,
            score: playerScore,
            total_questions: questions.length,
            answers: playerAnswers,
            xp_earned: xp,
            gold_earned: gold,
          });
        }
      } catch {
        // Non-critical — quiz still works without persistence
      }
    }

    setState("results");
  }, [questions, user, awardXp, awardGold, logActivity]);

  return (
    <>
      <BackgroundLayer />
      <div className="min-h-screen pb-24 pt-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (state === "hub") router.push("/");
                else setState("hub");
              }}
              className={`p-2 rounded-xl backdrop-blur-sm border ${
                isSun
                  ? "bg-white/70 border-slate-200 text-slate-600"
                  : "bg-white/10 border-white/20 text-white"
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className={`text-2xl font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
                {state === "playing" ? "⚔️ Trial in Progress" :
                 state === "results" ? "📜 Trial Results" : "📝 Trial Arena"}
              </h1>
              <p className={`text-xs ${muted}`}>
                {state === "playing" ? "Answer wisely, adventurer!" :
                 state === "results" ? "Here are your spoils!" : "Test your knowledge"}
              </p>
            </div>
          </motion.div>

          {/* Hub View */}
          {state === "hub" && (
            <div className="space-y-4">
              {/* Tabs */}
              <div className={`flex rounded-xl overflow-hidden border-2 ${isSun ? "border-slate-200" : "border-slate-700"}`}>
                <button
                  onClick={() => setActiveTab("create")}
                  className={`flex-1 py-2.5 text-sm font-bold font-[family-name:var(--font-nunito)] transition-all ${
                    activeTab === "create"
                      ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                      : isSun ? "bg-white text-slate-600" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <Plus className="w-4 h-4 inline mr-1" /> Create Quiz
                </button>
                <button
                  onClick={() => { setActiveTab("past"); fetchPastQuizzes(); }}
                  className={`flex-1 py-2.5 text-sm font-bold font-[family-name:var(--font-nunito)] transition-all ${
                    activeTab === "past"
                      ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                      : isSun ? "bg-white text-slate-600" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <ScrollText className="w-4 h-4 inline mr-1" /> Past Quizzes
                </button>
              </div>

              {activeTab === "create" ? (
                <QuizCreator
                  onGenerate={(s) => {
                    handleGenerate(s);
                    setState("creating");
                  }}
                  isGenerating={isGenerating}
                />
              ) : (
                <div className="space-y-2">
                  {pastQuizzes.length === 0 ? (
                    <div className={`${card} p-8 text-center`}>
                      <p className="text-3xl mb-3">📝</p>
                      <p className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                        No quizzes yet
                      </p>
                      <p className={`text-xs ${muted} mt-1`}>Create your first quiz to see results here</p>
                    </div>
                  ) : (
                    pastQuizzes.map(q => (
                      <div key={q.id} className={`${card} p-4 flex items-center justify-between`}>
                        <div>
                          <p className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-700" : "text-slate-200"}`}>
                            {q.title}
                          </p>
                          <p className={`text-xs ${muted}`}>
                            {new Date(q.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                          q.score / q.total >= 0.8 ? "bg-emerald-500/20 text-emerald-500" :
                          q.score / q.total >= 0.6 ? "bg-amber-500/20 text-amber-500" :
                          "bg-red-500/20 text-red-500"
                        }`}>
                          {q.score}/{q.total}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Creating (generating) View */}
          {state === "creating" && (
            <div className={`${card} p-8 text-center`}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-purple-500 border-t-transparent"
              />
              <p className={`text-lg font-bold font-[family-name:var(--font-nunito)] ${titleStyle}`}>
                Summoning Questions...
              </p>
              <p className={`text-sm ${muted} mt-2`}>
                The AI Familiar is crafting your trial
              </p>
            </div>
          )}

          {/* Playing View */}
          {state === "playing" && (
            <QuizPlayer
              questions={questions}
              timePerQuestion={timePerQuestion}
              onComplete={handleQuizComplete}
            />
          )}

          {/* Results View */}
          {state === "results" && (
            <QuizResults
              questions={questions}
              answers={answers}
              score={score}
              xpEarned={xpEarned}
              goldEarned={goldEarned}
              onTryAgain={() => {
                setAnswers([]);
                setScore(0);
                setState("playing");
              }}
              onNewQuiz={() => {
                setQuestions([]);
                setAnswers([]);
                setScore(0);
                setState("hub");
              }}
            />
          )}
        </div>
      </div>
      <TravelerHotbar />
    </>
  );
}
