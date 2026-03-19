"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Lock, Swords, Crown, ChevronDown, ChevronUp } from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";
import { supabase } from "@/lib/supabase";

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  node_type: "topic" | "boss";
  sort_order: number;
  mastery_pct: number;
  is_unlocked: boolean;
  is_completed: boolean;
  xp_reward: number;
}

export interface SkillPath {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
}

interface KnowledgeMapProps {
  path: SkillPath;
  nodes: SkillNode[];
  onNodesChanged: () => void;
}

export default function KnowledgeMap({ path, nodes, onNodesChanged }: KnowledgeMapProps) {
  const { isSun } = useCardStyles();
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  /* Sort nodes linearly by sort_order */
  const sorted = useMemo(() => {
    return [...nodes].sort((a, b) => a.sort_order - b.sort_order);
  }, [nodes]);

  /* Toggle topic completion */
  const handleToggleComplete = async (node: SkillNode) => {
    if (!node.is_unlocked) return;

    // Determine if this is an exam (boss) or topic
    const table = node.node_type === "boss" ? "exams" : "topics";
    const newCompleted = !node.is_completed;
    const newMastery = newCompleted ? 100 : 0;

    await supabase
      .from(table)
      .update({ is_completed: newCompleted, ...(table === "topics" ? { mastery_pct: newMastery } : {}) })
      .eq("id", node.id);

    onNodesChanged();
  };

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-20">
          <p className="text-6xl mb-4">🗺️</p>
          <p className={`text-lg font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-500" : "text-slate-400"}`}>
            No topics yet
          </p>
          <p className={`text-sm font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-400" : "text-slate-500"}`}>
            Add topics via onboarding to see your skill tree
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-8 py-6">
      <div className="max-w-lg mx-auto relative">
        {/* Vertical trail line */}
        <div
          className={`absolute left-[27px] sm:left-[31px] top-0 bottom-0 w-[3px] rounded-full ${
            isSun ? "bg-gradient-to-b from-purple-200 via-purple-300 to-purple-200" : "bg-gradient-to-b from-purple-800 via-purple-600 to-purple-800"
          }`}
        />

        {/* Nodes */}
        <div className="relative space-y-2">
          {sorted.map((node, index) => {
            const isBoss = node.node_type === "boss";
            const isExpanded = expandedNode === node.id;

            // Status colors
            let dotBg = "";
            let dotBorder = "";
            let dotIcon = null;

            if (node.is_completed) {
              dotBg = "bg-emerald-500";
              dotBorder = "border-emerald-400";
              dotIcon = <CheckCircle className="w-4 h-4 text-white" />;
            } else if (!node.is_unlocked) {
              dotBg = isSun ? "bg-slate-200" : "bg-slate-700";
              dotBorder = isSun ? "border-slate-300" : "border-slate-600";
              dotIcon = <Lock className="w-3 h-3 text-slate-400" />;
            } else if (isBoss) {
              dotBg = "bg-red-500";
              dotBorder = "border-red-400";
              dotIcon = <Swords className="w-4 h-4 text-white" />;
            } else {
              dotBg = isSun ? "bg-purple-500" : "bg-purple-600";
              dotBorder = isSun ? "border-purple-400" : "border-purple-500";
            }

            // Card styling
            const cardBase = isSun
              ? "bg-white/90 border-slate-200"
              : "bg-slate-800/80 border-white/10";

            const completedCard = node.is_completed
              ? isSun
                ? "bg-emerald-50/90 border-emerald-200"
                : "bg-emerald-950/40 border-emerald-500/20"
              : "";

            const lockedCard = !node.is_unlocked
              ? isSun
                ? "bg-slate-50/60 border-slate-200 opacity-60"
                : "bg-slate-900/40 border-slate-700 opacity-50"
              : "";

            const bossCard = isBoss && node.is_unlocked && !node.is_completed
              ? isSun
                ? "bg-red-50/90 border-red-200 shadow-red-100"
                : "bg-red-950/30 border-red-500/20 shadow-red-900/20"
              : "";

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
                className="flex items-start gap-4"
              >
                {/* Trail dot */}
                <div className="relative flex-shrink-0 mt-4">
                  <div
                    className={`w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] rounded-full border-[3px] flex items-center justify-center z-10 relative transition-all
                      ${dotBg} ${dotBorder}
                      ${isBoss ? "w-[26px] h-[26px] sm:w-[30px] sm:h-[30px] -ml-1" : ""}
                    `}
                  >
                    {dotIcon}
                  </div>
                  {/* Glow effect for boss */}
                  {isBoss && node.is_unlocked && !node.is_completed && (
                    <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                  )}
                </div>

                {/* Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (node.is_unlocked) {
                        setExpandedNode(isExpanded ? null : node.id);
                      }
                    }
                  }}
                  onClick={() => {
                    if (node.is_unlocked) {
                      setExpandedNode(isExpanded ? null : node.id);
                    }
                  }}
                  className={`flex-1 rounded-xl border p-3 sm:p-4 text-left transition-all backdrop-blur-sm
                    ${completedCard || lockedCard || bossCard || cardBase}
                    ${node.is_unlocked ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : "cursor-default"}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {isBoss && (
                        <span className="flex-shrink-0">
                          {node.is_completed ? <Crown className="w-4 h-4 text-amber-500" /> : <Swords className="w-4 h-4 text-red-500" />}
                        </span>
                      )}
                      <h4
                        className={`font-bold text-sm sm:text-base font-[family-name:var(--font-nunito)] truncate ${
                          node.is_completed
                            ? isSun ? "text-emerald-700" : "text-emerald-300"
                            : !node.is_unlocked
                            ? isSun ? "text-slate-400" : "text-slate-500"
                            : isBoss
                            ? isSun ? "text-red-700" : "text-red-300"
                            : isSun ? "text-slate-800" : "text-white"
                        }`}
                      >
                        {node.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {/* Mastery badge */}
                      {node.is_unlocked && !isBoss && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            node.mastery_pct >= 80
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                              : node.mastery_pct >= 40
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                              : isSun
                              ? "bg-slate-100 text-slate-500"
                              : "bg-white/10 text-slate-400"
                          }`}
                        >
                          {node.mastery_pct}%
                        </span>
                      )}
                      {node.is_unlocked && (
                        isExpanded ? <ChevronUp className="w-4 h-4 opacity-40" /> : <ChevronDown className="w-4 h-4 opacity-40" />
                      )}
                    </div>
                  </div>

                  {/* Description / exam date */}
                  {node.description && (
                    <p className={`text-xs mt-1 ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                      {isBoss ? `📅 ${node.description}` : node.description}
                    </p>
                  )}

                  {/* Mastery bar for topics */}
                  {node.is_unlocked && !isBoss && node.mastery_pct > 0 && node.mastery_pct < 100 && (
                    <div className={`mt-2 h-1 rounded-full overflow-hidden ${isSun ? "bg-slate-100" : "bg-white/10"}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${node.mastery_pct}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      />
                    </div>
                  )}

                  {/* Expanded actions */}
                  <AnimatePresence>
                    {isExpanded && node.is_unlocked && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-dashed flex items-center gap-2"
                        style={{ borderColor: isSun ? "#e2e8f0" : "rgba(255,255,255,0.1)" }}
                      >
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleComplete(node);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            node.is_completed
                              ? isSun
                                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                : "bg-white/10 text-slate-300 hover:bg-white/20"
                              : "bg-emerald-500 text-white hover:bg-emerald-600"
                          }`}
                        >
                          {node.is_completed ? "Mark Incomplete" : isBoss ? "Mark Exam Complete" : "Mark as Mastered"}
                        </motion.button>

                        <span className={`text-xs ${isSun ? "text-slate-400" : "text-slate-500"}`}>
                          +{node.xp_reward} XP
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}

          {/* Completion marker at the end */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: sorted.length * 0.04 + 0.2 }}
            className="flex items-center gap-4 pt-2"
          >
            <div className="flex-shrink-0">
              <div className={`w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] rounded-full border-[3px] flex items-center justify-center z-10 relative ${
                sorted.every((n) => n.is_completed)
                  ? "bg-amber-400 border-amber-300"
                  : isSun ? "bg-slate-200 border-slate-300" : "bg-slate-700 border-slate-600"
              }`}>
                <Crown className={`w-3 h-3 ${sorted.every((n) => n.is_completed) ? "text-white" : "text-slate-400"}`} />
              </div>
            </div>
            <p className={`text-sm font-bold font-[family-name:var(--font-nunito)] ${
              sorted.every((n) => n.is_completed)
                ? "text-amber-500"
                : isSun ? "text-slate-300" : "text-slate-600"
            }`}>
              {sorted.every((n) => n.is_completed) ? "🎉 Path Complete!" : "Path End"}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
