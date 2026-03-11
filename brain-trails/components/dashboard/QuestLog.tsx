"use client";

import { motion } from "framer-motion";
import { gameText } from "@/constants/gameText";
import { CheckCircle2, Circle, Sword, BookOpen, Timer } from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";

/**
 * Quest item structure (Daily Bounty)
 */
interface Bounty {
  id: string;
  title: string;
  gold: number;
  completed: boolean;
  icon: "sword" | "book" | "timer";
}

/**
 * Sample hardcoded bounties for demo
 */
const sampleBounties: Bounty[] = [
  {
    id: "1",
    title: "Slay Chapter 1",
    gold: 50,
    completed: false,
    icon: "sword",
  },
  {
    id: "2",
    title: "Complete 10 Flashcards",
    gold: 30,
    completed: true,
    icon: "book",
  },
  {
    id: "3",
    title: "Focus for 25 Minutes",
    gold: 40,
    completed: false,
    icon: "timer",
  },
];

/**
 * Get icon component based on type
 */
function BountyIcon({ type, isSun }: { type: Bounty["icon"]; isSun: boolean }) {
  const colorClass = isSun ? "text-purple-600" : "text-accent";
  const icons = {
    sword: <Sword className={`w-3 h-3 ${colorClass}`} />,
    book: <BookOpen className={`w-3 h-3 ${colorClass}`} />,
    timer: <Timer className={`w-3 h-3 ${colorClass}`} />,
  };
  return icons[type];
}

/**
 * Individual bounty item component
 */
function BountyItem({ bounty, index, isSun }: { bounty: Bounty; index: number; isSun: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        flex items-center gap-2 p-2.5 rounded-lg transition-all duration-200 cursor-pointer group
        ${bounty.completed 
          ? isSun ? "bg-green-100/80 border border-green-300" : "bg-green-500/20 border border-green-400/30"
          : isSun ? "bg-amber-50/50 border border-amber-200/30 hover:bg-amber-100/50" : "bg-white/5 border border-white/10 hover:border-white/20"
        }
      `}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0">
        {bounty.completed ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center"
          >
            <CheckCircle2 className="w-3 h-3 text-white" />
          </motion.div>
        ) : (
          <div className={`w-5 h-5 rounded-full border-2 transition-colors ${
            isSun ? "border-slate-300 group-hover:border-slate-400" : "border-white/30 group-hover:border-white/50"
          }`} />
        )}
      </div>

      {/* Icon */}
      <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${
        isSun ? "bg-purple-100" : "bg-accent/10"
      }`}>
        <BountyIcon type={bounty.icon} isSun={isSun} />
      </div>

      {/* Bounty Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${
          bounty.completed 
            ? "text-slate-400 line-through" 
            : isSun ? "text-slate-700" : "text-white"
        }`}>
          {bounty.title}
        </p>
      </div>

      {/* Gold Reward */}
      <div className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200">
        <span className="text-xs">🪙</span>
        <span className="text-xs font-bold text-amber-600">+{bounty.gold}g</span>
      </div>
    </motion.div>
  );
}

/**
 * 📋 QuestLog Component (Daily Bounties)
 * 
 * Displays daily tasks/bounties with gold rewards.
 * Matches the Figma "Daily Bounties" card design.
 */
export default function QuestLog() {
  const { card, title, isSun } = useCardStyles();
  const totalGold = sampleBounties.reduce((sum, b) => sum + b.gold, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${card} p-5 flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className={`text-base font-bold ${title} font-[family-name:var(--font-nunito)]`}>
          Daily Bounties
        </h2>
        <div className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200">
          <span className="text-xs">🪙</span>
          <span className="text-xs font-bold text-amber-600">{totalGold}g</span>
        </div>
      </div>

      {/* Bounty List */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {sampleBounties.map((bounty, index) => (
          <BountyItem key={bounty.id} bounty={bounty} index={index} isSun={isSun} />
        ))}
      </div>
    </motion.div>
  );
}
