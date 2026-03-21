"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Castle, Bird, BookOpen, Crown, ScrollText, Sparkles } from "lucide-react";

const TOUR_STEPS = [
  {
    title: "Welcome to your Study Realm!",
    description: "This is your magical dashboard where your study journey comes to life. Every action earns XP and gold.",
    icon: Castle,
    emoji: "🏰",
    gradient: "from-amber-400 to-orange-500",
    bgGlow: "bg-amber-500/20",
  },
  {
    title: "Meet Archie, Your Companion",
    description: "Your faithful owl companion grows stronger as you study. He gains XP and gold from focus sessions, flashcards, and quests.",
    icon: Bird,
    emoji: "🦉",
    gradient: "from-purple-400 to-indigo-500",
    bgGlow: "bg-purple-500/20",
  },
  {
    title: "The Grand Grimoire",
    description: "Track your syllabus mastery on the left. Complete topics, manage your study plan, and watch your progress grow.",
    icon: BookOpen,
    emoji: "📚",
    gradient: "from-emerald-400 to-teal-500",
    bgGlow: "bg-emerald-500/20",
  },
  {
    title: "The Guild Hall",
    description: "See the top scholars on the right. Study hard to climb the leaderboard and earn exclusive titles and cosmetics.",
    icon: Crown,
    emoji: "👑",
    gradient: "from-yellow-400 to-amber-500",
    bgGlow: "bg-yellow-500/20",
  },
  {
    title: "Your Adventure Log",
    description: "The bottom panel tracks your quests and recent activity. Every flashcard reviewed and timer finished is recorded.",
    icon: ScrollText,
    emoji: "📜",
    gradient: "from-blue-400 to-cyan-500",
    bgGlow: "bg-blue-500/20",
  },
  {
    title: "Ready to begin?",
    description: "Start a focus session, review flashcards, or check the shop for rare cosmetics. Your adventure awaits!",
    icon: Sparkles,
    emoji: "✨",
    gradient: "from-pink-400 to-rose-500",
    bgGlow: "bg-pink-500/20",
  }
];

export default function DashboardTour() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const isSun = theme === "sun";
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (profile?.onboarding_completed) {
      const hasSeenTour = localStorage.getItem("dashboard_tour_seen");
      if (!hasSeenTour) {
        setIsVisible(true);
      }
    }
  }, [profile]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("dashboard_tour_seen", "true");
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`w-full max-w-md rounded-[32px] shadow-2xl border overflow-hidden ${
            isSun ? "bg-white/95 border-white/60" : "bg-slate-900/95 border-white/10"
          }`}
        >
          {/* Animated Header with Gradient + Icon */}
          <div className={`relative p-8 pb-10 bg-gradient-to-br ${step.gradient} overflow-hidden`}>
            {/* Decorative circles */}
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute bottom-[-30px] left-[-10px] w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute top-[30px] left-[20px] w-8 h-8 rounded-full bg-white/15 animate-pulse" />
            
            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.15, damping: 10 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg border border-white/30">
                <StepIcon className="w-10 h-10 text-white" />
              </div>
              <span className="text-4xl">{step.emoji}</span>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 pt-6">
            <motion.div 
              key={`content-${currentStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-6"
            >
              <h2 className={`text-xl font-bold mb-3 font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
                {step.title}
              </h2>
              <p className={`text-sm leading-relaxed font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-600" : "text-slate-300"}`}>
                {step.description}
              </p>
            </motion.div>

            {/* Step indicator + buttons */}
            <div className="flex items-center justify-between">
              {/* Progress dots */}
              <div className="flex gap-2">
                {TOUR_STEPS.map((s, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      width: i === currentStep ? 24 : 8,
                      opacity: i === currentStep ? 1 : 0.4 
                    }}
                    className={`h-2 rounded-full bg-gradient-to-r ${s.gradient}`}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className={`text-sm font-bold px-3 py-1.5 rounded-full transition-colors ${
                    isSun ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                  }`}
                >
                  Skip
                </button>
                <motion.button
                  onClick={handleNext}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-2 rounded-full text-sm font-bold text-white shadow-lg bg-gradient-to-r ${step.gradient}`}
                >
                  {currentStep === TOUR_STEPS.length - 1 ? "Let's Go! 🚀" : "Next →"}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}