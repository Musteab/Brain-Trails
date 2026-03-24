"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FocusTimer from "@/components/focus/FocusTimer";
import CrystalFocusOrb from "@/components/focus/CrystalFocusOrb";
import WizardsDeskLayout from "@/components/layout/WizardsDeskLayout";
import { ManaBoostBurst } from "@/components/effects/ManaBoostParticles";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { gameText } from "@/constants/gameText";
import { Sparkles, Clock, BookOpen, Flame } from "lucide-react";

const DEFAULT_SUBJECTS = ["Math", "Physics", "Biology", "Chemistry", "History", "English", "Computer Science"];
const durations = [15, 25, 30, 45, 60];

type TimerStyle = "classic" | "crystal";

/**
 * Focus Garden Page
 *
 * Pomodoro timer with subject selection and duration picker.
 * Now features the Crystal Focus Orb - a magical glass sphere timer.
 */
export default function FocusPage() {
  const { settings, isLoading: settingsLoading } = useSettings();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [selectedSubject, setSelectedSubject] = useState("Math");
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [customSubject, setCustomSubject] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [timerStyle, setTimerStyle] = useState<TimerStyle>("crystal");
  const [orbVariant, setOrbVariant] = useState<"cyan" | "purple" | "fire">("cyan");
  const [showCompleteBurst, setShowCompleteBurst] = useState(false);

  // Pre-select duration from user settings once loaded
  useEffect(() => {
    if (!settingsLoading && settings.focus_duration) {
      setSelectedDuration(settings.focus_duration);
    }
  }, [settingsLoading, settings.focus_duration]);

  // Fetch user's subjects from syllabus, then fall back to decks/past sessions
  useEffect(() => {
    if (!user) return;

    const fetchSubjects = async () => {
      // Try fetching from the active semester's subjects first
      const { data: semData } = await (supabase.from("semesters") as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (semData) {
        const { data: subs } = await (supabase.from("subjects") as any)
          .select("id, name, emoji")
          .eq("semester_id", semData.id)
          .order("name");

        if (subs && subs.length > 0) {
          const syllabusSubjects = subs.map((s: { name: string }) => s.name);
          setSubjects(syllabusSubjects);
          setSelectedSubject(syllabusSubjects[0]);
          return;
        }
      }

      // Fallback: decks + past focus sessions
      const [decksRes, sessionsRes] = await Promise.all([
        (supabase.from("decks") as any).select("name").eq("user_id", user.id),
        (supabase.from("focus_sessions") as any).select("subject").eq("user_id", user.id),
      ]);

      const userSubjects = new Set<string>();

      if (decksRes.data) {
        for (const d of decksRes.data) {
          if (d.name) userSubjects.add(d.name);
        }
      }
      if (sessionsRes.data) {
        for (const s of sessionsRes.data) {
          if (s.subject) userSubjects.add(s.subject);
        }
      }

      if (userSubjects.size > 0) {
        setSubjects(Array.from(userSubjects));
        setSelectedSubject(Array.from(userSubjects)[0]);
      }
    };

    fetchSubjects();
  }, [user]);

  const activeSubject = customSubject.trim() || selectedSubject;

  const handleOrbComplete = () => {
    setShowCompleteBurst(true);
    setTimeout(() => {
      setShowCompleteBurst(false);
      setIsStarted(false);
    }, 2000);
  };

  // Classic timer view
  if (isStarted && timerStyle === "classic") {
    return (
      <WizardsDeskLayout showPlaque={false}>
        <FocusTimer
          focusSubject={activeSubject}
          defaultMinutes={selectedDuration}
          onBack={() => setIsStarted(false)}
        />
      </WizardsDeskLayout>
    );
  }

  // Crystal orb timer view
  if (isStarted && timerStyle === "crystal") {
    return (
      <WizardsDeskLayout showPlaque={false}>
        <div className="min-h-screen flex flex-col items-center justify-center relative p-6">
          {/* Subject label */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400/80 text-sm font-medium uppercase tracking-wider">
                Focusing On
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white font-[family-name:var(--font-cinzel)]">
              {activeSubject}
            </h2>
          </motion.div>

          {/* Crystal Focus Orb */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="relative"
          >
            <CrystalFocusOrb
              totalMinutes={selectedDuration}
              variant={orbVariant}
              size="lg"
              onComplete={handleOrbComplete}
            />
            
            {/* Completion burst effect */}
            {showCompleteBurst && (
              <ManaBoostBurst variant="gold" count={80} origin={{ x: 50, y: 50 }} />
            )}
          </motion.div>

          {/* Back button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => setIsStarted(false)}
            className="mt-8 px-6 py-2 rounded-xl text-amber-400/70 hover:text-amber-400 transition-colors text-sm font-medium"
          >
            ← Back to Setup
          </motion.button>
        </div>
      </WizardsDeskLayout>
    );
  }

  // Setup screen
  return (
    <WizardsDeskLayout showPlaque={false}>
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{
                background: "linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(168, 85, 247, 0.2))",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 0 30px rgba(0, 255, 255, 0.2), inset 0 0 20px rgba(168, 85, 247, 0.1)",
              }}
            >
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </motion.div>
            <h1 
              className="text-3xl font-bold text-white mb-2"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {gameText.study.focus}
            </h1>
            <p className="text-white/50 font-[family-name:var(--font-quicksand)]">
              Channel your magical energy into focused study
            </p>
          </div>

          {/* Timer Style Selection */}
          <div 
            className="rounded-2xl p-5 mb-4 border"
            style={{
              background: "linear-gradient(135deg, rgba(45, 30, 20, 0.8), rgba(30, 20, 15, 0.9))",
              borderColor: "rgba(255, 200, 150, 0.15)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            }}
          >
            <label className="text-sm font-bold text-amber-400/80 block mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Timer Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimerStyle("crystal")}
                className={`p-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                  timerStyle === "crystal"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400/30 to-purple-500/30" />
                Crystal Orb
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimerStyle("classic")}
                className={`p-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                  timerStyle === "classic"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400/30 to-green-500/30 flex items-center justify-center">
                  🌿
                </div>
                Classic Garden
              </motion.button>
            </div>
          </div>

          {/* Orb Color Selection (only for crystal style) */}
          <AnimatePresence>
            {timerStyle === "crystal" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div 
                  className="rounded-2xl p-5 mb-4 border"
                  style={{
                    background: "linear-gradient(135deg, rgba(45, 30, 20, 0.8), rgba(30, 20, 15, 0.9))",
                    borderColor: "rgba(255, 200, 150, 0.15)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <label className="text-sm font-bold text-amber-400/80 block mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Orb Energy
                  </label>
                  <div className="flex gap-3 justify-center">
                    {(["cyan", "purple", "fire"] as const).map((v) => (
                      <motion.button
                        key={v}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                        onClick={() => setOrbVariant(v)}
                        className={`w-12 h-12 rounded-full transition-all ${
                          orbVariant === v ? "ring-2 ring-offset-2 ring-offset-transparent" : ""
                        }`}
                        style={{
                          background: v === "cyan" 
                            ? "radial-gradient(circle, #00ffff 0%, #0891b2 100%)"
                            : v === "purple"
                            ? "radial-gradient(circle, #a855f7 0%, #7c3aed 100%)"
                            : "radial-gradient(circle, #f97316 0%, #dc2626 100%)",
                          boxShadow: orbVariant === v 
                            ? v === "cyan"
                              ? "0 0 20px rgba(0, 255, 255, 0.5)"
                              : v === "purple"
                              ? "0 0 20px rgba(168, 85, 247, 0.5)"
                              : "0 0 20px rgba(249, 115, 22, 0.5)"
                            : "none",
                          ringColor: v === "cyan" ? "#00ffff" : v === "purple" ? "#a855f7" : "#f97316",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subject Selection */}
          <div 
            className="rounded-2xl p-5 mb-4 border"
            style={{
              background: "linear-gradient(135deg, rgba(45, 30, 20, 0.8), rgba(30, 20, 15, 0.9))",
              borderColor: "rgba(255, 200, 150, 0.15)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            }}
          >
            <label className="text-sm font-bold text-amber-400/80 block mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Subject
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {subjects.slice(0, 6).map((subject) => (
                <motion.button
                  key={subject}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setSelectedSubject(subject); setCustomSubject(""); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedSubject === subject && !customSubject
                      ? "bg-amber-500/30 text-amber-400 border border-amber-500/50"
                      : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {subject}
                </motion.button>
              ))}
            </div>
            <input
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Or type a custom subject..."
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Duration Selection */}
          <div 
            className="rounded-2xl p-5 mb-6 border"
            style={{
              background: "linear-gradient(135deg, rgba(45, 30, 20, 0.8), rgba(30, 20, 15, 0.9))",
              borderColor: "rgba(255, 200, 150, 0.15)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            }}
          >
            <label className="text-sm font-bold text-amber-400/80 block mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4" /> Duration
            </label>
            <div className="flex gap-2">
              {durations.map((min) => (
                <motion.button
                  key={min}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDuration(min)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    selectedDuration === min
                      ? "bg-amber-500/30 text-amber-400 border border-amber-500/50"
                      : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {min}m
                </motion.button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsStarted(true)}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all"
            style={{
              background: timerStyle === "crystal"
                ? `linear-gradient(135deg, ${
                    orbVariant === "cyan" ? "#0891b2" : orbVariant === "purple" ? "#7c3aed" : "#dc2626"
                  }, ${
                    orbVariant === "cyan" ? "#06b6d4" : orbVariant === "purple" ? "#a855f7" : "#f97316"
                  })`
                : "linear-gradient(135deg, #059669, #10b981)",
              color: "white",
              boxShadow: timerStyle === "crystal"
                ? orbVariant === "cyan"
                  ? "0 10px 40px rgba(0, 255, 255, 0.3)"
                  : orbVariant === "purple"
                  ? "0 10px 40px rgba(168, 85, 247, 0.3)"
                  : "0 10px 40px rgba(249, 115, 22, 0.3)"
                : "0 10px 40px rgba(16, 185, 129, 0.3)",
              fontFamily: "var(--font-nunito), sans-serif",
            }}
          >
            {timerStyle === "crystal" ? "✨" : "🌱"} {gameText.actions.start}
          </motion.button>
        </motion.div>
      </div>
    </WizardsDeskLayout>
  );
}
