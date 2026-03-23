"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Swords, CheckCircle2, XCircle, Loader2, Trophy, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useGameStore } from "@/stores";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

interface Topic {
  id: string;
  name: string;
}

/**
 * Subject-Specific Quiz (Trial by Fire)
 * AI-generated quizzes for the subject
 */
export default function SubjectQuizPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;

  const { user, profile, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const { awardXp, awardGold, logActivity } = useGameStore();
  const playSound = useSoundEffects();
  const isSun = theme === "sun";

  const [subjectName, setSubjectName] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Fetch subject and topics
  useEffect(() => {
    if (!user || !subjectId) return;

    const fetchData = async () => {
      const { data: subData } = await (supabase.from("subjects") as any)
        .select(`
          name, emoji,
          topics ( id, name )
        `)
        .eq("id", subjectId)
        .single();

      if (subData) {
        setSubjectName(`${subData.emoji || "📚"} ${subData.name}`);
        setTopics(subData.topics || []);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [user, subjectId]);

  const handleGenerateQuiz = async () => {
    if (!user) return;

    setIsGenerating(true);

    try {
      const { data: subData } = await (supabase.from("subjects") as any)
        .select("name")
        .eq("id", subjectId)
        .single();

      const topic = topics.find(t => t.id === selectedTopicId);
      const topicName = topic ? topic.name : "General";

      const aiUrl = process.env.NEXT_PUBLIC_AI_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${aiUrl}/api/ai/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subData?.name || "General",
          topic: topicName,
          count: 10,
          type: "multiple_choice",
        }),
      });

      const data = await res.json();

      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions generated");
      }

      // Transform questions to our format
      const formattedQuestions: Question[] = data.questions.map((q: {
        question: string;
        options: string[];
        correct_answer: string;
      }) => ({
        question: q.question,
        options: q.options,
        correctIndex: q.options.indexOf(q.correct_answer),
      }));

      setQuestions(formattedQuestions);
      setCurrentIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setIsComplete(false);

      playSound("success");
    } catch (err) {
      console.error("Quiz generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = async (index: number) => {
    if (isAnswered) return;

    setSelectedAnswer(index);
    setIsAnswered(true);

    const isCorrect = index === questions[currentIndex].correctIndex;
    if (isCorrect) {
      setScore(score + 1);
      playSound("success");
    } else {
      playSound("click");
    }
  };

  const handleNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      // Quiz complete
      setIsComplete(true);

      if (user && profile) {
        const accuracy = Math.round((score / questions.length) * 100);
        const xpEarned = accuracy >= 70 ? 100 : 50;
        const goldEarned = accuracy >= 80 ? 30 : 15;

        await awardXp(user.id, xpEarned);
        await awardGold(user.id, goldEarned);
        await logActivity(user.id, "flashcard", xpEarned, {
          subject_id: subjectId,
          score: score,
          total: questions.length,
          accuracy,
        });
        refreshProfile();

        playSound("timerEnd");
      }
    }
  };

  const handleRestartQuiz = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsComplete(false);
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

  // Quiz Results
  if (isComplete) {
    const accuracy = Math.round((score / questions.length) * 100);
    const passed = accuracy >= 70;

    return (
      <div className="max-w-xl mx-auto px-6 py-12 pb-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${glassCard} rounded-3xl p-8 text-center`}
        >
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
            passed ? "bg-emerald-500/20" : "bg-orange-500/20"
          }`}>
            {passed ? (
              <Trophy className="w-10 h-10 text-emerald-500" />
            ) : (
              <Swords className="w-10 h-10 text-orange-500" />
            )}
          </div>

          <h2 className={`text-2xl font-bold mb-2 ${isSun ? "text-slate-800" : "text-white"}`}>
            {passed ? "Victory!" : "Keep Practicing!"}
          </h2>
          <p className={`mb-6 ${isSun ? "text-slate-600" : "text-slate-400"}`}>
            You scored {score} out of {questions.length}
          </p>

          <div className={`text-5xl font-black mb-6 ${
            accuracy >= 80 ? "text-emerald-500" : accuracy >= 60 ? "text-amber-500" : "text-red-500"
          }`}>
            {accuracy}%
          </div>

          <div className={`flex items-center justify-center gap-6 mb-8 py-4 px-6 rounded-xl ${
            isSun ? "bg-amber-50" : "bg-amber-500/10"
          }`}>
            <div className="text-center">
              <div className={`text-lg font-bold ${isSun ? "text-amber-600" : "text-amber-400"}`}>
                +{accuracy >= 70 ? 100 : 50}
              </div>
              <div className={`text-xs ${isSun ? "text-amber-500" : "text-amber-500"}`}>XP</div>
            </div>
            <div className={`w-px h-8 ${isSun ? "bg-amber-200" : "bg-amber-500/30"}`} />
            <div className="text-center">
              <div className={`text-lg font-bold ${isSun ? "text-amber-600" : "text-amber-400"}`}>
                +{accuracy >= 80 ? 30 : 15}
              </div>
              <div className={`text-xs ${isSun ? "text-amber-500" : "text-amber-500"}`}>Gold</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRestartQuiz}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors ${
                isSun ? "bg-white/60 text-slate-700 hover:bg-white/80" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
            <button
              onClick={() => router.push(`/arcane-archive/${subjectId}`)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold"
            >
              Back to Subject
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Quiz in Progress
  if (questions.length > 0) {
    const currentQuestion = questions[currentIndex];

    return (
      <div className="max-w-2xl mx-auto px-6 py-8 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleRestartQuiz}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
              isSun ? "hover:bg-white/50 text-slate-600" : "hover:bg-white/10 text-slate-400"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Exit Quiz</span>
          </button>

          <div className={`text-sm font-bold ${isSun ? "text-slate-600" : "text-slate-400"}`}>
            Question {currentIndex + 1} of {questions.length}
          </div>

          <div className={`px-4 py-2 rounded-xl ${isSun ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400"}`}>
            Score: {score}
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`h-2 rounded-full overflow-hidden mb-8 ${isSun ? "bg-slate-200" : "bg-white/10"}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500"
          />
        </div>

        {/* Question */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`${glassCard} rounded-3xl p-8 mb-6`}
        >
          <h2 className={`text-xl font-bold mb-6 ${isSun ? "text-slate-800" : "text-white"}`}>
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, i) => {
              const isCorrect = i === currentQuestion.correctIndex;
              const isSelected = selectedAnswer === i;
              const showResult = isAnswered;

              let bgColor = isSun ? "bg-white/60 hover:bg-white/80" : "bg-white/10 hover:bg-white/20";
              let borderColor = "border-transparent";

              if (showResult) {
                if (isCorrect) {
                  bgColor = isSun ? "bg-emerald-100" : "bg-emerald-500/20";
                  borderColor = "border-emerald-500";
                } else if (isSelected && !isCorrect) {
                  bgColor = isSun ? "bg-red-100" : "bg-red-500/20";
                  borderColor = "border-red-500";
                }
              } else if (isSelected) {
                bgColor = isSun ? "bg-violet-100" : "bg-violet-500/20";
                borderColor = "border-violet-500";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelectAnswer(i)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-xl text-left transition-all border-2 ${bgColor} ${borderColor} ${
                    isAnswered ? "cursor-default" : "cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      showResult && isCorrect
                        ? "bg-emerald-500 text-white"
                        : showResult && isSelected && !isCorrect
                        ? "bg-red-500 text-white"
                        : (isSun ? "bg-slate-200 text-slate-600" : "bg-white/20 text-white")
                    }`}>
                      {showResult ? (
                        isCorrect ? <CheckCircle2 className="w-5 h-5" /> : isSelected ? <XCircle className="w-5 h-5" /> : String.fromCharCode(65 + i)
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </div>
                    <span className={isSun ? "text-slate-700" : "text-white"}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Next Button */}
        <AnimatePresence>
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center"
            >
              <button
                onClick={handleNextQuestion}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-lg"
              >
                {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Quiz Setup
  return (
    <div className="max-w-xl mx-auto px-6 py-12 pb-32">
      {/* Header */}
      <button
        onClick={() => router.push(`/arcane-archive/${subjectId}`)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-6 transition-colors ${
          isSun ? "hover:bg-white/50 text-slate-600" : "hover:bg-white/10 text-slate-400"
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${glassCard} rounded-3xl p-8`}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500`}>
            <Swords className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${isSun ? "text-slate-800" : "text-white"}`}>
              Trial by Fire
            </h1>
            <p className={`text-sm ${isSun ? "text-slate-500" : "text-slate-400"}`}>
              {subjectName}
            </p>
          </div>
        </div>

        <p className={`mb-6 ${isSun ? "text-slate-600" : "text-slate-400"}`}>
          Test your knowledge with an AI-generated quiz. Answer 10 questions to earn XP and Gold!
        </p>

        {/* Topic Selection */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${isSun ? "text-slate-700" : "text-slate-300"}`}>
            Select Topic (optional)
          </label>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl outline-none ${
              isSun
                ? "bg-white/60 text-slate-800"
                : "bg-white/10 text-white [&>option]:bg-slate-800"
            }`}
          >
            <option value="">All Topics (General)</option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>{topic.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerateQuiz}
          disabled={isGenerating}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              <Swords className="w-5 h-5" />
              Start Quiz
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
