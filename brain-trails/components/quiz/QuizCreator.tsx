"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, Clock, Target, Zap, Minus, Plus } from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";

interface QuizSettings {
  content: string;
  numQuestions: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number; // seconds per question, 0 = no limit
  questionTypes: string[];
}

interface QuizCreatorProps {
  onGenerate: (settings: QuizSettings) => void;
  isGenerating: boolean;
}

const QUESTION_TYPES = [
  { id: "mcq", label: "Multiple Choice", emoji: "🔘" },
  { id: "true_false", label: "True / False", emoji: "⚖️" },
  { id: "fill_blank", label: "Fill in Blank", emoji: "✏️" },
  { id: "short_answer", label: "Short Answer", emoji: "📝" },
];

const DIFFICULTIES = [
  { id: "easy", label: "Easy", emoji: "🌱", color: "from-emerald-500 to-green-600" },
  { id: "medium", label: "Medium", emoji: "⚔️", color: "from-amber-500 to-orange-600" },
  { id: "hard", label: "Hard", emoji: "🔥", color: "from-red-500 to-rose-600" },
];

export default function QuizCreator({ onGenerate, isGenerating }: QuizCreatorProps) {
  const { card, isSun, title: titleStyle, muted } = useCardStyles();
  const [content, setContent] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [timeLimit, setTimeLimit] = useState(30);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["mcq"]);

  const toggleType = useCallback((typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  }, []);

  const canGenerate = content.trim().length > 10 && selectedTypes.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${card} p-6 space-y-6`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className={`text-lg font-bold font-[family-name:var(--font-nunito)] ${titleStyle}`}>
            Forge a Trial
          </h2>
          <p className={`text-xs ${muted}`}>Paste study material to generate a quiz</p>
        </div>
      </div>

      {/* Content Input */}
      <div>
        <label className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-700" : "text-slate-200"}`}>
          Study Material
        </label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Paste your notes, textbook excerpts, or study material here..."
          rows={6}
          className={`mt-2 w-full px-4 py-3 rounded-xl border-2 text-sm font-[family-name:var(--font-quicksand)] transition-all resize-none ${
            isSun
              ? "bg-white border-slate-200 focus:border-purple-400 text-slate-700 placeholder:text-slate-400"
              : "bg-slate-800 border-slate-700 focus:border-purple-500 text-slate-200 placeholder:text-slate-500"
          } outline-none`}
        />
        <p className={`text-xs mt-1 ${muted}`}>
          {content.length} chars — minimum 10 required
        </p>
      </div>

      {/* Question Count */}
      <div>
        <label className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-700" : "text-slate-200"}`}>
          <Target className="w-4 h-4 inline mr-1" />
          Questions: {numQuestions}
        </label>
        <div className="flex items-center gap-3 mt-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setNumQuestions(n => Math.max(5, n - 5))}
            className={`p-2 rounded-lg ${isSun ? "bg-slate-100 text-slate-600" : "bg-slate-800 text-slate-300"}`}
          >
            <Minus className="w-4 h-4" />
          </motion.button>
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={numQuestions}
            onChange={e => setNumQuestions(+e.target.value)}
            className="flex-1 accent-purple-500"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setNumQuestions(n => Math.min(30, n + 5))}
            className={`p-2 rounded-lg ${isSun ? "bg-slate-100 text-slate-600" : "bg-slate-800 text-slate-300"}`}
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <label className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-700" : "text-slate-200"}`}>
          <Zap className="w-4 h-4 inline mr-1" />
          Difficulty
        </label>
        <div className="flex gap-2 mt-2">
          {DIFFICULTIES.map(d => (
            <motion.button
              key={d.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDifficulty(d.id as "easy" | "medium" | "hard")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold font-[family-name:var(--font-nunito)] transition-all border-2 ${
                difficulty === d.id
                  ? `bg-gradient-to-r ${d.color} text-white border-transparent shadow-lg`
                  : isSun
                    ? "bg-white border-slate-200 text-slate-600"
                    : "bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              <span className="mr-1">{d.emoji}</span> {d.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Time Limit */}
      <div>
        <label className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-700" : "text-slate-200"}`}>
          <Clock className="w-4 h-4 inline mr-1" />
          Time per question: {timeLimit === 0 ? "No limit" : `${timeLimit}s`}
        </label>
        <input
          type="range"
          min={0}
          max={120}
          step={15}
          value={timeLimit}
          onChange={e => setTimeLimit(+e.target.value)}
          className="w-full mt-2 accent-purple-500"
        />
      </div>

      {/* Question Types */}
      <div>
        <label className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-700" : "text-slate-200"}`}>
          Question Types
        </label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {QUESTION_TYPES.map(type => (
            <motion.button
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleType(type.id)}
              className={`py-2.5 px-3 rounded-xl text-sm font-bold font-[family-name:var(--font-quicksand)] transition-all border-2 ${
                selectedTypes.includes(type.id)
                  ? isSun
                    ? "bg-purple-100 border-purple-400 text-purple-700"
                    : "bg-purple-500/20 border-purple-500/60 text-purple-300"
                  : isSun
                    ? "bg-white border-slate-200 text-slate-600"
                    : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              <span className="mr-1">{type.emoji}</span> {type.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <motion.button
        whileHover={canGenerate ? { scale: 1.02 } : {}}
        whileTap={canGenerate ? { scale: 0.98 } : {}}
        onClick={() => {
          if (canGenerate) {
            onGenerate({
              content,
              numQuestions,
              difficulty,
              timeLimit,
              questionTypes: selectedTypes,
            });
          }
        }}
        disabled={!canGenerate || isGenerating}
        className={`w-full py-3.5 rounded-xl text-base font-bold font-[family-name:var(--font-nunito)] transition-all ${
          canGenerate && !isGenerating
            ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
            : isSun
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
        }`}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Summoning questions...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate with AI ✨
          </span>
        )}
      </motion.button>
    </motion.div>
  );
}
