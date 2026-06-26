"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Coins, Zap, RotateCcw, ChevronDown, ChevronUp, CheckCircle2, XCircle, Share2 } from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";
import TrialResultCard from "@/components/ui/TrialResultCard";
import { isAnswerCorrect, resolveCorrectOption } from "@/lib/quizScoring";
import type { QuizQuestion } from "./QuizPlayer";

interface QuizResultsProps {
  questions: QuizQuestion[];
  answers: string[];
  score: number;
  xpEarned: number;
  goldEarned: number;
  subjectName?: string;
  onTryAgain: () => void;
  onNewQuiz: () => void;
}

function getGrade(pct: number): { letter: string; color: string; word: string; glow: string } {
  if (pct >= 95) return { letter: "S", color: "from-amber-400 to-yellow-500", word: "FLAWLESS", glow: "shadow-amber-500/50" };
  if (pct >= 85) return { letter: "A", color: "from-emerald-500 to-green-600", word: "MASTERED", glow: "shadow-emerald-500/50" };
  if (pct >= 70) return { letter: "B", color: "from-blue-500 to-cyan-600", word: "SOLID", glow: "shadow-blue-500/50" };
  if (pct >= 55) return { letter: "C", color: "from-amber-500 to-orange-600", word: "GETTING THERE", glow: "shadow-orange-500/50" };
  return { letter: "D", color: "from-red-500 to-rose-600", word: "KEEP TRAINING", glow: "shadow-red-500/50" };
}

export default function QuizResults({
  questions, answers, score, xpEarned, goldEarned, subjectName, onTryAgain, onNewQuiz,
}: QuizResultsProps) {
  const { card, isSun, title: titleStyle, muted } = useCardStyles();
  const [showReview, setShowReview] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const pct = Math.round((score / questions.length) * 100);
  const grade = getGrade(pct);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      {/* Grade Card */}
      <div className={`${card} p-8 text-center relative overflow-hidden`}>
        <motion.div
          initial={{ scale: 0, rotate: -18 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.15 }}
          className={`w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br ${grade.color} flex items-center justify-center text-white shadow-2xl ${grade.glow} mb-4`}
        >
          <span className="text-6xl font-black font-[family-name:var(--font-nunito)] drop-shadow-lg">
            {grade.letter}
          </span>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className={`text-sm font-black tracking-[0.25em] bg-gradient-to-r ${grade.color} bg-clip-text text-transparent mb-1`}
        >
          {grade.word}
        </motion.p>
        <h2 className={`text-2xl font-bold font-[family-name:var(--font-nunito)] ${titleStyle}`}>
          {pct >= 85 ? "Outstanding!" : pct >= 70 ? "Great job!" : pct >= 55 ? "Not bad!" : "Keep training!"}
        </h2>
        <p className={`text-sm ${muted} mt-1`}>
          You scored {score} out of {questions.length} ({pct}%)
        </p>
      </div>

      {/* Rewards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className={`${card} p-4 text-center`}
        >
          <Zap className={`w-6 h-6 mx-auto mb-2 ${isSun ? "text-purple-600" : "text-purple-400"}`} />
          <p className={`text-xl font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-purple-700" : "text-purple-300"}`}>
            +{xpEarned} XP
          </p>
          <p className={`text-xs ${muted}`}>Experience earned</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className={`${card} p-4 text-center`}
        >
          <Coins className={`w-6 h-6 mx-auto mb-2 text-amber-500`} />
          <p className="text-xl font-bold font-[family-name:var(--font-nunito)] text-amber-500">
            +{goldEarned} Gold
          </p>
          <p className={`text-xs ${muted}`}>Treasure collected</p>
        </motion.div>
      </div>

      {/* Share result - the flex */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setShareOpen(true)}
        className="w-full py-3 rounded-xl text-sm font-bold font-[family-name:var(--font-nunito)] flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-lg"
      >
        <Share2 className="w-4 h-4" /> Share your result
      </motion.button>

      <TrialResultCard
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        result={{ subjectName: subjectName || "Trial by Fire", score, total: questions.length, xpEarned }}
      />

      {/* Review Answers Toggle */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setShowReview(!showReview)}
        className={`w-full ${card} p-4 flex items-center justify-between`}
      >
        <span className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-700" : "text-slate-200"}`}>
          Review answers
        </span>
        {showReview ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </motion.button>

      {/* Review List */}
      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-2"
          >
            {questions.map((q, i) => {
              const userAnswer = answers[i] || "";
              const correct = isAnswerCorrect(userAnswer, q);
              return (
                <div key={i} className={`${card} p-4`}>
                  <div className="flex items-start gap-3">
                    {correct ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
                        {i + 1}. {q.question}
                      </p>
                      <p className={`text-xs mt-1 ${correct ? "text-emerald-500" : "text-red-500"}`}>
                        Your answer: {userAnswer || "(no answer)"}
                      </p>
                      {!correct && (
                        <p className={`text-xs text-emerald-500 mt-0.5`}>Correct: {resolveCorrectOption(q)}</p>
                      )}
                      <p className={`text-xs ${muted} mt-1`}>{q.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onTryAgain}
          className={`py-3 rounded-xl text-sm font-bold font-[family-name:var(--font-nunito)] flex items-center justify-center gap-2 ${
            isSun ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewQuiz}
          className="py-3 rounded-xl text-sm font-bold font-[family-name:var(--font-nunito)] bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg flex items-center justify-center gap-2"
        >
          <Trophy className="w-4 h-4" /> New Quiz
        </motion.button>
      </div>
    </motion.div>
  );
}
