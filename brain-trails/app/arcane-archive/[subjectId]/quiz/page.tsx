"use client";

import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import { BarChart3 } from "lucide-react";

export default function QuizPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const { theme } = useTheme();
  const isSun = theme === "sun";

  return (
    <div className="w-full px-6 py-12 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-32"
      >
        <BarChart3 className={`w-24 h-24 mx-auto mb-6 ${
          isSun ? "text-emerald-300" : "text-emerald-600"
        }`} />
        <h1 className={`text-3xl font-bold mb-4 ${
          isSun ? "text-slate-800" : "text-white"
        }`}>
          ⚔️ Trials Refactoring in Progress
        </h1>
        <p className={`text-lg mb-6 max-w-2xl mx-auto ${
          isSun ? "text-slate-500" : "text-slate-400"
        }`}>
          The quiz system for this subject is being refactored from the original architecture.
          This page will soon display thrilling quiz battles with AI-generated questions based on your notes and flashcards.
        </p>
        <div className="text-6xl mb-6">🎯</div>
        <p className={`text-sm ${
          isSun ? "text-slate-400" : "text-slate-500"
        }`}>
          Subject ID: <code className="font-mono text-xs">{subjectId}</code>
        </p>
      </motion.div>
      <TravelerHotbar />
    </div>
  );
}
