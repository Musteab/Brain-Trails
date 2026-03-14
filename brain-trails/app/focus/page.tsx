"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FocusTimer from "@/components/focus/FocusTimer";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import { useSettings } from "@/hooks/useSettings";

const subjects = ["Math", "Physics", "Biology", "Chemistry", "History", "English", "Computer Science"];
const durations = [15, 25, 30, 45, 60];

/**
 * Focus Garden Page
 *
 * Pomodoro timer with subject selection and duration picker.
 * Pre-selects the default duration from user settings.
 */
export default function FocusPage() {
  const { settings, isLoading: settingsLoading } = useSettings();
  const [selectedSubject, setSelectedSubject] = useState("Math");
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [customSubject, setCustomSubject] = useState("");
  const [isStarted, setIsStarted] = useState(false);

  // Pre-select duration from user settings once loaded
  useEffect(() => {
    if (!settingsLoading && settings.focus_duration) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync initial default from user settings
      setSelectedDuration(settings.focus_duration);
    }
  }, [settingsLoading, settings.focus_duration]);

  const activeSubject = customSubject.trim() || selectedSubject;

  if (isStarted) {
    return (
      <>
        <FocusTimer
          focusSubject={activeSubject}
          defaultMinutes={selectedDuration}
          onBack={() => setIsStarted(false)}
        />
        <TravelerHotbar />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-300 via-blue-200 to-slate-400 -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md px-6"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-5xl mb-4"
            >
              🌿
            </motion.div>
            <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-nunito)] drop-shadow-md">
              Focus Garden
            </h1>
            <p className="text-white/70 mt-2 font-[family-name:var(--font-quicksand)]">
              What will you grow today?
            </p>
          </div>

          {/* Subject Selection */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/50 mb-4">
            <label className="text-sm font-bold text-slate-700 font-[family-name:var(--font-nunito)] block mb-3">
              📚 Subject
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {subjects.map((subject) => (
                <motion.button
                  key={subject}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setSelectedSubject(subject); setCustomSubject(""); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedSubject === subject && !customSubject
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-white/60 text-slate-600 hover:bg-white/80 border border-slate-200"
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
              className="w-full px-3 py-2 rounded-xl bg-white/60 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Duration Selection */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/50 mb-6">
            <label className="text-sm font-bold text-slate-700 font-[family-name:var(--font-nunito)] block mb-3">
              ⏱️ Duration
            </label>
            <div className="flex gap-2">
              {durations.map((min) => (
                <motion.button
                  key={min}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDuration(min)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    selectedDuration === min
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-white/60 text-slate-600 hover:bg-white/80 border border-slate-200"
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
            className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-lg shadow-xl shadow-emerald-500/30 hover:bg-emerald-600 transition-colors font-[family-name:var(--font-nunito)]"
          >
            🌱 Start Growing
          </motion.button>
        </motion.div>
      </div>
      <TravelerHotbar />
    </>
  );
}
