"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useQuests, type Quest } from "@/hooks/useQuests";
import { CheckCircle2, Sword, BookOpen, Timer, PenTool, Scroll, Zap } from "lucide-react";

function QuestIcon({ type, isSun }: { type: string; isSun: boolean }) {
  const colorClass = isSun ? "text-purple-600" : "text-white";
  const icons: Record<string, React.ReactNode> = {
    focus: <Timer className={`w-4 h-4 ${colorClass}`} />,
    flashcard: <BookOpen className={`w-4 h-4 ${colorClass}`} />,
    quiz: <Scroll className={`w-4 h-4 ${colorClass}`} />,
    writing: <PenTool className={`w-4 h-4 ${colorClass}`} />,
    boss: <Sword className={`w-4 h-4 ${colorClass}`} />,
  };
  return <>{icons[type] || icons.focus}</>;
}

function PeriodBadge({ period, isSun }: { period: string; isSun: boolean }) {
  const colors: Record<string, string> = {
    daily: isSun ? "bg-purple-100 text-purple-700" : "bg-purple-500/20 text-purple-300",
    weekly: isSun ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-300",
    monthly: isSun ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-300",
  };
  return (
    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${colors[period] || colors.daily}`}>
      {period}
    </span>
  );
}

const QuestLog = memo(function QuestLog() {
  const { card, title: textTitle, isSun, muted } = useCardStyles();
  const { quests, isLoading } = useQuests();

  const totalRewards = quests.reduce((sum, q) => sum + q.xp_reward + q.gold_reward, 0);
  const completedCount = quests.filter(q => q.is_completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${card} p-5 flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-bold ${textTitle} font-[family-name:var(--font-nunito)]`}>
          ⚔️ Daily Quests
        </h2>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${muted}`}>
            {completedCount}/{quests.length}
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/30">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-xs font-bold text-amber-500">{totalRewards}</span>
          </div>
        </div>
      </div>

      {/* Quest List */}
      <div className="flex-1 space-y-2.5">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className={`h-16 rounded-xl animate-pulse ${isSun ? "bg-slate-200" : "bg-slate-800"}`} />
          ))
        ) : quests.length === 0 ? (
          <div className={`text-center py-6 ${muted}`}>
            <p className="text-2xl mb-2">📜</p>
            <p className="text-sm font-bold font-[family-name:var(--font-nunito)]">No active quests</p>
            <p className="text-xs mt-1">Quests refresh daily at midnight</p>
          </div>
        ) : (
          <AnimatePresence>
            {quests.map((quest, index) => {
              const progress = quest.target_value > 0 ? (quest.current_value / quest.target_value) * 100 : 0;
              return (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    quest.is_completed
                      ? isSun ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-500/20 border-emerald-500/30"
                      : isSun ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700"
                  } border shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <div className="flex-shrink-0">
                      {quest.is_completed ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          isSun ? "bg-purple-100" : "bg-purple-500/20"
                        }`}>
                          <QuestIcon type={quest.quest_type} isSun={isSun} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-bold truncate font-[family-name:var(--font-nunito)] ${
                          quest.is_completed
                            ? "text-emerald-600 line-through opacity-70"
                            : isSun ? "text-slate-700" : "text-slate-200"
                        }`}>
                          {quest.title}
                        </p>
                        <PeriodBadge period={quest.period} isSun={isSun} />
                      </div>
                      <p className={`text-[11px] ${muted} truncate`}>{quest.description}</p>
                    </div>

                    {/* Rewards */}
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-purple-500" />
                        <span className="text-[10px] font-bold text-purple-500">+{quest.xp_reward}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px]">🪙</span>
                        <span className="text-[10px] font-bold text-amber-500">+{quest.gold_reward}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {!quest.is_completed && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isSun ? "bg-slate-200" : "bg-slate-700"}`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold ${muted} tabular-nums`}>
                        {quest.current_value}/{quest.target_value}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
});

export default QuestLog;
