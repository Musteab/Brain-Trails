"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Shield, Swords, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";

export interface QuizQuestion {
  type: "mcq" | "true_false" | "fill_blank" | "short_answer";
  question: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
}

interface QuizPlayerProps {
  questions: QuizQuestion[];
  timePerQuestion: number; // seconds, 0 = no limit
  onComplete: (answers: string[], score: number) => void;
}

export default function QuizPlayer({ questions, timePerQuestion, onComplete }: QuizPlayerProps) {
  const { card, isSun, title: titleStyle, muted } = useCardStyles();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const question = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const bossHp = 100 - ((currentIndex) / questions.length) * 100;

  // Timer
  useEffect(() => {
    if (timePerQuestion === 0 || showFeedback) return;
    setTimeLeft(timePerQuestion);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, timePerQuestion]);

  const handleSubmit = useCallback((answer: string) => {
    const finalAnswer = answer || selectedAnswer;
    const correct = finalAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowFeedback(true);

    const newAnswers = [...answers, finalAnswer];
    setAnswers(newAnswers);

    // Auto-advance after feedback
    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer("");

      if (currentIndex + 1 >= questions.length) {
        const score = newAnswers.filter(
          (a, i) => a.toLowerCase().trim() === questions[i].correct_answer.toLowerCase().trim()
        ).length;
        onComplete(newAnswers, score);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 1500);
  }, [selectedAnswer, question, answers, currentIndex, questions, onComplete]);

  const timerPct = timePerQuestion > 0 ? (timeLeft / timePerQuestion) * 100 : 100;
  const timerColor = timerPct > 50 ? "bg-emerald-500" : timerPct > 25 ? "bg-amber-500" : "bg-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Boss HP Bar */}
      <div className={`${card} p-4`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Swords className={`w-5 h-5 ${isSun ? "text-red-600" : "text-red-400"}`} />
            <span className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-700" : "text-slate-200"}`}>
              Quiz Boss
            </span>
          </div>
          <span className={`text-xs font-bold ${muted}`}>
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className={`h-3 rounded-full overflow-hidden ${isSun ? "bg-slate-200" : "bg-slate-700"}`}>
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${bossHp}%` }}
            className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-600"
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Timer Bar */}
      {timePerQuestion > 0 && (
        <div className={`h-1.5 rounded-full overflow-hidden ${isSun ? "bg-slate-200" : "bg-slate-700"}`}>
          <motion.div
            className={`h-full rounded-full ${timerColor}`}
            animate={{ width: `${timerPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className={`${card} p-6`}
        >
          {/* Question Type Badge */}
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              isSun ? "bg-purple-100 text-purple-700" : "bg-purple-500/20 text-purple-300"
            }`}>
              {question.type === "mcq" ? "Multiple Choice" :
               question.type === "true_false" ? "True / False" :
               question.type === "fill_blank" ? "Fill in the Blank" : "Short Answer"}
            </span>
            {timePerQuestion > 0 && (
              <div className="flex items-center gap-1">
                <Clock className={`w-4 h-4 ${timerPct < 25 ? "text-red-500 animate-pulse" : muted}`} />
                <span className={`text-sm font-bold ${timerPct < 25 ? "text-red-500" : muted}`}>
                  {timeLeft}s
                </span>
              </div>
            )}
          </div>

          {/* Question Text */}
          <h3 className={`text-lg font-bold font-[family-name:var(--font-nunito)] mb-6 ${isSun ? "text-slate-800" : "text-white"}`}>
            {question.question}
          </h3>

          {/* Answer Options */}
          {(question.type === "mcq" || question.type === "true_false") && question.options && (
            <div className="space-y-2">
              {question.options.map((option, i) => (
                <motion.button
                  key={i}
                  whileHover={!showFeedback ? { scale: 1.01 } : {}}
                  whileTap={!showFeedback ? { scale: 0.99 } : {}}
                  disabled={showFeedback}
                  onClick={() => {
                    if (!showFeedback) {
                      setSelectedAnswer(option);
                      handleSubmit(option);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 font-[family-name:var(--font-quicksand)] text-sm font-medium transition-all ${
                    showFeedback
                      ? option === question.correct_answer
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-500"
                        : option === selectedAnswer
                          ? "border-red-500 bg-red-500/20 text-red-500"
                          : isSun ? "border-slate-200 bg-white text-slate-500" : "border-slate-700 bg-slate-800 text-slate-500"
                      : selectedAnswer === option
                        ? isSun ? "border-purple-400 bg-purple-50 text-purple-700" : "border-purple-500 bg-purple-500/20 text-purple-300"
                        : isSun ? "border-slate-200 bg-white text-slate-700 hover:border-purple-300" : "border-slate-700 bg-slate-800 text-slate-200 hover:border-purple-600"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      showFeedback && option === question.correct_answer
                        ? "bg-emerald-500 text-white"
                        : showFeedback && option === selectedAnswer
                          ? "bg-red-500 text-white"
                          : isSun ? "bg-slate-100 text-slate-500" : "bg-slate-700 text-slate-400"
                    }`}>
                      {showFeedback && option === question.correct_answer ? <CheckCircle2 className="w-4 h-4" /> :
                       showFeedback && option === selectedAnswer ? <XCircle className="w-4 h-4" /> :
                       String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </span>
                </motion.button>
              ))}
            </div>
          )}

          {/* Text Input for fill_blank / short_answer */}
          {(question.type === "fill_blank" || question.type === "short_answer") && (
            <div className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={selectedAnswer}
                onChange={e => setSelectedAnswer(e.target.value)}
                disabled={showFeedback}
                placeholder={question.type === "fill_blank" ? "Fill in the blank..." : "Type your answer..."}
                onKeyDown={e => { if (e.key === "Enter" && selectedAnswer.trim()) handleSubmit(selectedAnswer); }}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-[family-name:var(--font-quicksand)] outline-none transition-all ${
                  showFeedback
                    ? isCorrect
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                      : "border-red-500 bg-red-500/10 text-red-600"
                    : isSun
                      ? "bg-white border-slate-200 focus:border-purple-400 text-slate-700"
                      : "bg-slate-800 border-slate-700 focus:border-purple-500 text-slate-200"
                }`}
              />
              {!showFeedback && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubmit(selectedAnswer)}
                  disabled={!selectedAnswer.trim()}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold font-[family-name:var(--font-nunito)] ${
                    selectedAnswer.trim()
                      ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg"
                      : isSun ? "bg-slate-200 text-slate-400" : "bg-slate-800 text-slate-500"
                  }`}
                >
                  Submit Answer
                </motion.button>
              )}
            </div>
          )}

          {/* Feedback */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-4 p-3 rounded-xl border-2 ${
                  isCorrect
                    ? isSun ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : isSun ? "bg-red-50 border-red-300 text-red-800" : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                <p className="text-sm font-bold font-[family-name:var(--font-nunito)] mb-1">
                  {isCorrect ? "✅ Correct!" : `❌ Wrong — Answer: ${question.correct_answer}`}
                </p>
                <p className="text-xs font-[family-name:var(--font-quicksand)]">
                  {question.explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
