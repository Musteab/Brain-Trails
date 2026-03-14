"use client";

import { motion } from "framer-motion";
import OwlCompanion from "../ui/OwlCompanion";
import { useCardStyles } from "@/hooks/useCardStyles";
import { gameText } from "@/constants/gameText";

/**
 * Status bar component (Energy/Focus style)
 */
function StatusBar({ 
  label, 
  value, 
  maxValue, 
  color,
  isSun
}: { 
  label: string; 
  value: number; 
  maxValue: number; 
  color: string;
  isSun: boolean;
}) {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-sm border ${
      isSun ? "bg-white/80 border-amber-200" : "bg-slate-800/60 border-white/10"
    }`}>
      <div className={`w-16 h-2 rounded-full overflow-hidden ${isSun ? "bg-amber-100" : "bg-white/10"}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: 0.8, duration: 1 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className={`text-xs font-medium font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-700" : "text-white"}`}>{label}</span>
    </div>
  );
}

/**
 * 🦉 StudyRoom Component (Owl Scholar Companion Center)
 * 
 * Main center piece with animated owl companion, status bars, and speech bubble.
 * Scaled up 15% to be the dominant "protagonist" of the screen.
 */
export default function StudyRoom() {
  const { card, isSun } = useCardStyles();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className={`${card} p-5 flex flex-col relative z-10`}
      style={{ 
        transform: "scale(1.05)", 
        transformOrigin: "center center" 
      }}
    >
      {/* Speech Bubble */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`rounded-2xl px-4 py-2 border-2 mx-auto mb-3 ${
          isSun ? "bg-purple-100/80 backdrop-blur-sm border-purple-300" : "bg-[#9D4EDD]/20 backdrop-blur-sm border-[#9D4EDD]/40"
        }`}
      >
        <p className={`text-sm font-medium font-[family-name:var(--font-quicksand)] ${isSun ? "text-purple-700" : "text-white"}`}>
          Ready to study? Let&apos;s go! 🚀
        </p>
      </motion.div>

      {/* Owl Scholar Companion */}
      <div className="w-full h-[340px] flex items-center justify-center relative">
        {/* Contact/Grounding Shadow */}
        <div 
          className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-[40%] h-6 rounded-[100%] blur-xl ${
            isSun ? "bg-amber-900/20" : "bg-purple-900/40"
          }`}
        />
        
        <OwlCompanion 
          mood="idle"
          className="relative z-10"
        />
      </div>

      {/* Status Bars */}
      <div className="flex justify-center gap-4 mt-4">
        <StatusBar 
          label={gameText.study.study} 
          value={85} 
          maxValue={100} 
          color="bg-green-400"
          isSun={isSun}
        />
        <StatusBar 
          label={gameText.study.focus} 
          value={72} 
          maxValue={100} 
          color="bg-blue-400"
          isSun={isSun}
        />
      </div>
    </motion.div>
  );
}