"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface StuckOwlProps {
  onOpenAI: () => void;
  idleTimeoutMs?: number;
}

export default function StuckOwl({ onOpenAI, idleTimeoutMs = 30000 }: StuckOwlProps) {
  const { theme } = useTheme();
  const isSun = theme === "sun";
  
  const [isIdle, setIsIdle] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reset idle timer on any user activity
    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsIdle(false);
      setDismissed(false); // They can be shown the owl again if they go idle again
      
      timeoutRef.current = setTimeout(() => {
        setIsIdle(true);
      }, idleTimeoutMs);
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((event) => document.addEventListener(event, resetTimer, { passive: true }));
    
    // Initial timer start
    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => document.removeEventListener(event, resetTimer));
    };
  }, [idleTimeoutMs]);

  const handleOpenAI = () => {
    setIsIdle(false);
    setDismissed(true);
    onOpenAI();
  };

  return (
    <AnimatePresence>
      {isIdle && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className={`fixed bottom-24 right-8 z-40 p-4 rounded-2xl shadow-xl border flex gap-3 max-w-sm cursor-pointer ${
            isSun
              ? "bg-white border-amber-200/50 shadow-amber-900/10"
              : "bg-slate-800 border-slate-700/50 shadow-black/40"
          }`}
          onClick={handleOpenAI}
        >
          {/* Close button - prevents click from propagating to the parent div */}
          <button 
            className={`absolute -top-2 -right-2 p-1 rounded-full border shadow-sm ${
              isSun ? "bg-white text-slate-400 border-slate-200 hover:text-slate-600" : "bg-slate-700 text-slate-300 border-slate-600 hover:text-white"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
          >
            <X className="w-3 h-3" />
          </button>

          <div className="text-4xl animate-bounce">🦉</div>
          <div>
            <h4 className={`font-bold text-sm ${isSun ? "text-amber-900" : "text-amber-100"}`}>
              Feeling stuck?
            </h4>
            <p className={`text-xs mt-1 ${isSun ? "text-slate-600" : "text-slate-400"}`}>
              I can help you brainstorm or summarize your notes. Click me to summon your familiar!
            </p>
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${
              isSun ? "text-violet-600" : "text-violet-400"
            }`}>
              <Sparkles className="w-3 h-3" />
              Ask AI
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
