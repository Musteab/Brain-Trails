"use client";

import { useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCardStyles } from "@/hooks/useCardStyles";
import { CheckCircle2, Circle, Sword, BookOpen, Timer, PenTool } from "lucide-react";

interface Bounty {
  id: string;
  title: string;
  gold: number;
  completed: boolean;
  icon: "sword" | "book" | "timer" | "pen";
}

function BountyIcon({ type, isSun }: { type: Bounty["icon"]; isSun: boolean }) {
  const colorClass = isSun ? "text-purple-600" : "text-white";
  const icons = {
    sword: <Sword className={`w-4 h-4 ${colorClass}`} />,
    book: <BookOpen className={`w-4 h-4 ${colorClass}`} />,
    timer: <Timer className={`w-4 h-4 ${colorClass}`} />,
    pen: <PenTool className={`w-4 h-4 ${colorClass}`} />,
  };
  return icons[type] || icons.sword;
}

const QuestLog = memo(function QuestLog() {
  const { card, title: textTitle, isSun } = useCardStyles();
  const { user } = useAuth();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDailyActivity = async () => {
      // Get today's start and end times in ISO format
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('adventure_log')
        .select('activity_type')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString());

      if (error) {
        console.error("Error fetching daily activity:", error);
        setIsLoading(false);
        return;
      }

      const activities = data || [];
      const hasFocus = activities.some(a => a.activity_type === 'focus');
      const hasFlashcard = activities.some(a => a.activity_type === 'flashcard');
      const hasNote = activities.some(a => a.activity_type === 'note');

      // Generate dynamic bounties based on today's actual completions
      setBounties([
        {
          id: "1",
          title: "Complete 1 Focus Session",
          gold: 50,
          completed: hasFocus,
          icon: "timer",
        },
        {
          id: "2",
          title: "Review 5 Flashcards",
          gold: 30,
          completed: hasFlashcard,
          icon: "book",
        },
        {
          id: "3",
          title: "Scribe a Magic Note",
          gold: 40,
          completed: hasNote,
          icon: "pen",
        },
      ]);
      setIsLoading(false);
    };

    fetchDailyActivity();

    // Subscribe to new real-time activities for this user
    const channel = supabase
      .channel('questlog_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'adventure_log',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchDailyActivity();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const totalGold = bounties.reduce((sum, b) => sum + b.gold, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${card} p-5 flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-bold ${textTitle} font-[family-name:var(--font-nunito)]`}>
          Daily Bounties
        </h2>
        <div className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/30">
          <span className="text-sm">🪙</span>
          <span className="text-sm font-bold text-amber-500">{totalGold}g</span>
        </div>
      </div>

      {/* Bounty List */}
      <div className="flex-1 space-y-3">
        {isLoading ? (
          // Loading Skeletons
          [1, 2, 3].map((i) => (
            <div key={i} className={`h-16 rounded-xl animate-pulse ${isSun ? "bg-slate-200" : "bg-slate-800"}`} />
          ))
        ) : (
          <AnimatePresence>
            {bounties.map((bounty, index) => (
              <motion.div
                key={bounty.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  bounty.completed 
                    ? isSun ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-500/20 border-emerald-500/30"
                    : isSun ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700"
                } border shadow-sm`}
              >
                {/* Checkbox */}
                <div className="flex-shrink-0">
                  {bounty.completed ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-400/50" />
                  )}
                </div>

                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  isSun 
                    ? bounty.completed ? "bg-emerald-200/50" : "bg-purple-100"
                    : bounty.completed ? "bg-emerald-500/20" : "bg-purple-500/20"
                }`}>
                  <BountyIcon type={bounty.icon} isSun={isSun} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${
                    bounty.completed 
                      ? "text-emerald-600 line-through opacity-70" 
                      : isSun ? "text-slate-700" : "text-slate-200"
                  }`}>
                    {bounty.title}
                  </p>
                </div>

                {/* Gold */}
                <div className="flex items-center gap-1">
                  <span className="text-xs">🪙</span>
                  <span className="text-xs font-bold text-amber-500">+{bounty.gold}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
});

export default QuestLog;
