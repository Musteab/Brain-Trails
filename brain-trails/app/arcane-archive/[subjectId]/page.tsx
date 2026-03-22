"use client";

import { motion } from "framer-motion";
import { BookOpen, Wand2, BarChart3, ArrowRight } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

export default function SubjectOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const { theme } = useTheme();
  const isSun = theme === "sun";
  const subjectId = params.subjectId as string;

  const sections = [
    {
      icon: BookOpen,
      title: "Spellbook",
      description: "Take rich notes and organize your knowledge",
      color: "from-amber-500 to-orange-500",
      action: () => router.push(`/arcane-archive/${subjectId}/spellbook`),
    },
    {
      icon: Wand2,
      title: "Spell Cards",
      description: "Practice with flashcards and improve mastery",
      color: "from-violet-500 to-purple-500",
      action: () => router.push(`/arcane-archive/${subjectId}/flashcards`),
    },
    {
      icon: BarChart3,
      title: "Trials",
      description: "Test your knowledge with quizzes",
      color: "from-emerald-500 to-teal-500",
      action: () => router.push(`/arcane-archive/${subjectId}/quiz`),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  return (
    <div className="w-full px-6 py-12 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h2 className={`text-2xl font-bold mb-2 ${
          isSun ? "text-slate-800" : "text-white"
        }`}>
          Your Learning Hub
        </h2>
        <p className={`text-sm ${
          isSun ? "text-slate-500" : "text-slate-400"
        }`}>
          Choose how you want to study this subject. Start with the Spellbook to take notes, then practice with Spell Cards and test yourself with Trials.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <motion.button
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.98 }}
              onClick={section.action}
              className={`group relative rounded-2xl overflow-hidden p-8 text-left transition-all ${
                isSun
                  ? "bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-xl"
                  : "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-slate-600 hover:shadow-xl hover:shadow-purple-500/10"
              }`}
            >
              {/* Background gradient accent */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${section.color} transition-opacity`} />

              {/* Content */}
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${section.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className={`text-lg font-bold mb-2 ${
                  isSun ? "text-slate-800" : "text-white"
                }`}>
                  {section.title}
                </h3>

                <p className={`text-sm mb-6 ${
                  isSun ? "text-slate-600" : "text-slate-400"
                }`}>
                  {section.description}
                </p>

                <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 group-hover:gap-3 transition-all">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
