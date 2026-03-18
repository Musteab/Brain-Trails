"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const QUOTES = [
  "Even the longest journey begins with a single step.",
  "Knowledge is the true treasure of this realm.",
  "Every quest completed brings you closer to mastery.",
  "Rest when weary, but never surrender.",
  "The stars guide those who seek wisdom.",
  "A sharp mind is stronger than any blade.",
  "Your potential is bound only by your dedication.",
  "Courage is taking the next step when the path is dark.",
];

export default function GreetingBanner() {
  const { profile, user } = useAuth();
  const { theme } = useTheme();
  const isSun = theme === "sun";
  
  const [greeting, setGreeting] = useState("");
  const [icon, setIcon] = useState("");
  const [quote, setQuote] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      
      // Time-aware greeting
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting("Good morning");
        setIcon("🌅");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon");
      setIcon("☀️");
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good evening");
      setIcon("🌙");
    } else {
      setGreeting("Burning the midnight oil");
      setIcon("🦉");
    }

      // Date-seeded quote
      const today = new Date();
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      setQuote(QUOTES[seed % QUOTES.length]);
    }, 0);
  }, []);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || "Traveler";

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full py-4 px-6 mb-6 rounded-2xl border backdrop-blur-sm ${
        isSun
          ? "bg-white/60 border-amber-200/50 shadow-sm"
          : "bg-slate-800/40 border-slate-700/50 shadow-md"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold font-[family-name:var(--font-nunito)] flex items-center gap-2 ${
            isSun ? "text-amber-900" : "text-amber-100"
          }`}>
            <span className="text-2xl drop-shadow-md">{icon}</span>
            {greeting}, {displayName}!
          </h2>
          <p className={`text-sm italic font-[family-name:var(--font-quicksand)] mt-1 ${
            isSun ? "text-amber-700/80" : "text-amber-200/60"
          }`}>
            Ready for today&apos;s adventures?
          </p>
        </div>
        
        {/* Typewriter Quote */}
        <div className={`text-sm font-medium italic sm:text-right max-w-sm ${
          isSun ? "text-slate-600" : "text-slate-300"
        }`}>
          &ldquo;
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 2,
              ease: "easeInOut",
            }}
          >
            {quote}
          </motion.span>
          &rdquo;
        </div>
      </div>
    </motion.div>
  );
}
