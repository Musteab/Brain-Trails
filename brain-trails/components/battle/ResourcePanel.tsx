"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Scroll, Swords, Play, BookOpen } from "lucide-react";
import type { SkillNode } from "./SkillTree";

interface Resource {
  id: string;
  title: string;
  type: "pdf" | "notes" | "video";
}

interface Quest {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
}

interface ResourcePanelProps {
  node: SkillNode | null;
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for resources
const mockResources: Resource[] = [
  { id: "1", title: "Introduction Notes.pdf", type: "pdf" },
  { id: "2", title: "Key Formulas Summary", type: "notes" },
  { id: "3", title: "Video Lecture 1", type: "video" },
];

const mockQuests: Quest[] = [
  { id: "1", title: "Practice Problem Set 1", difficulty: "easy", completed: true },
  { id: "2", title: "Challenge Problems", difficulty: "medium", completed: false },
  { id: "3", title: "Boss Quiz: Final Test", difficulty: "hard", completed: false },
];

/**
 * Get difficulty badge color
 */
function getDifficultyColor(difficulty: Quest["difficulty"]) {
  switch (difficulty) {
    case "easy":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "medium":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "hard":
      return "bg-red-500/20 text-red-400 border-red-500/30";
  }
}

/**
 * 📚 ResourcePanel Component
 * 
 * Slide-in panel showing topic resources and quests
 */
export default function ResourcePanel({ node, isOpen, onClose }: ResourcePanelProps) {
  return (
    <AnimatePresence>
      {isOpen && node && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50
              bg-slate-900/80 backdrop-blur-xl border-l border-white/10
              shadow-2xl shadow-black/50"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`
                      w-3 h-3 rounded-full
                      ${node.status === "mastered" ? "bg-amber-400" : 
                        node.status === "active" ? "bg-emerald-400" : "bg-slate-500"}
                    `} />
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                      {node.status}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white font-[family-name:var(--font-nunito)]">
                    {node.label}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Mastery: {node.mastery ?? (node.status === "mastered" ? 100 : 45)}%
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${node.mastery ?? (node.status === "mastered" ? 100 : 45)}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-280px)]">
              {/* Scrolls Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Scroll className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Scrolls
                  </h3>
                </div>
                <div className="space-y-2">
                  {mockResources.map((resource) => (
                    <motion.button
                      key={resource.id}
                      whileHover={{ x: 4 }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl
                        bg-white/5 hover:bg-white/10 border border-white/10
                        transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        {resource.type === "pdf" ? (
                          <FileText className="w-5 h-5 text-amber-400" />
                        ) : resource.type === "video" ? (
                          <Play className="w-5 h-5 text-amber-400" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                      <span className="text-sm text-white font-medium group-hover:text-amber-300 transition-colors">
                        {resource.title}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quests Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Swords className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Quests
                  </h3>
                </div>
                <div className="space-y-2">
                  {mockQuests.map((quest) => (
                    <motion.button
                      key={quest.id}
                      whileHover={{ x: 4 }}
                      className={`
                        w-full flex items-center justify-between p-3 rounded-xl
                        border transition-colors text-left
                        ${quest.completed 
                          ? "bg-emerald-500/10 border-emerald-500/30" 
                          : "bg-white/5 hover:bg-white/10 border-white/10"}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center
                          ${quest.completed 
                            ? "bg-emerald-500 border-emerald-400" 
                            : "border-slate-500"}
                        `}>
                          {quest.completed && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-white rounded-full"
                            />
                          )}
                        </div>
                        <span className={`text-sm font-medium ${quest.completed ? "text-emerald-300" : "text-white"}`}>
                          {quest.title}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getDifficultyColor(quest.difficulty)}`}>
                        {quest.difficulty}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 to-transparent">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-2xl font-bold text-white
                  bg-gradient-to-r from-emerald-500 to-teal-500
                  shadow-lg shadow-emerald-500/30
                  hover:shadow-xl hover:shadow-emerald-500/40
                  transition-shadow"
              >
                <span className="flex items-center justify-center gap-2">
                  <Swords className="w-5 h-5" />
                  Start Studying
                </span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
