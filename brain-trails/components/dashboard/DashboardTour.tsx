"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const TOUR_STEPS = [
  {
    title: "Welcome to your Study Realm! 🏰",
    description: "This is your magical dashboard where your study journey comes to life.",
  },
  {
    title: "Meet Archie 🦉",
    description: "Your faithful companion. He gains experience (XP) and gold as you complete study sessions and quests.",
  },
  {
    title: "The Grand Grimoire 📚",
    description: "On the left, track your syllabus mastery and active daily quests. Complete them for bonus rewards!",
  },
  {
    title: "The Guild Hall 👑",
    description: "On the right, see the top scholars in the realm. Study hard to climb the ranks and earn exclusive titles.",
  },
  {
    title: "Your Adventure Log 📜",
    description: "Scroll down to see your recent activities. Every flashcard reviewed and focus timer finished is recorded here.",
  },
  {
    title: "Ready to begin? ✨",
    description: "Click 'Train' to start reviewing flashcards, or 'Mana Garden' for a focus session. Good luck!",
  }
];

export default function DashboardTour() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const isSun = theme === "sun";
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if onboarding is complete but tour hasn't been seen
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`w-full max-w-md p-6 sm:p-8 rounded-[32px] shadow-2xl border ${
            isSun ? "bg-white/90 border-white/60" : "bg-slate-900/90 border-white/10"
          }`}
        >
          <div className="text-center mb-6">
            <h2 className={`text-2xl font-bold mb-2 font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
              {step.title}
            </h2>
            <p className={`text-sm font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-600" : "text-slate-300"}`}>
              {step.description}
            </p>
          </div>

          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentStep 
                      ? isSun ? "bg-purple-500 w-4" : "bg-purple-400 w-4" 
                      : isSun ? "bg-slate-300" : "bg-slate-700"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className={`text-sm font-bold ${isSun ? "text-slate-400 hover:text-slate-600" : "text-slate-500 hover:text-slate-300"}`}
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-transform hover:scale-105 shadow-md ${
                  isSun ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white" : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                }`}
              >
                {currentStep === TOUR_STEPS.length - 1 ? "Let's Go!" : "Next"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}