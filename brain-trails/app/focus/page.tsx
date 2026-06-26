"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timer, BookOpen, Volume2, VolumeX, CloudRain, Coffee, Trees, Music, Flame, Play } from "lucide-react";
import FocusTimer from "@/components/focus/FocusTimer";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import type { AmbientSound } from "@/hooks/useAmbientSound";

const DEFAULT_SUBJECTS = ["Math", "Physics", "Biology", "Chemistry", "History", "English", "Computer Science"];
const DURATIONS = [15, 25, 30, 45, 60];

const AMBIENT: { key: AmbientSound; label: string; icon: typeof CloudRain }[] = [
  { key: "none", label: "Silence", icon: VolumeX },
  { key: "rain", label: "Rain", icon: CloudRain },
  { key: "cafe", label: "Cafe", icon: Coffee },
  { key: "forest", label: "Forest", icon: Trees },
  { key: "lofi", label: "Lo-fi", icon: Music },
  { key: "campfire", label: "Campfire", icon: Flame },
];

/**
 * Focus setup - pick a subject, a length, and something calming to focus with,
 * then drop into the timer.
 */
export default function FocusPage() {
  const { settings, isLoading: settingsLoading } = useSettings();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isSun = theme === "sun";

  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [selectedSubject, setSelectedSubject] = useState("Math");
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [customSubject, setCustomSubject] = useState("");
  const [ambient, setAmbient] = useState<AmbientSound>("none");
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (!settingsLoading && settings.focus_duration) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync initial default from settings
      setSelectedDuration(settings.focus_duration);
    }
  }, [settingsLoading, settings.focus_duration]);

  useEffect(() => {
    if (!user) return;
    const fetchSubjects = async () => {
      const { data: semData } = await (supabase.from("semesters") as any)
        .select("id").eq("user_id", user.id).eq("is_active", true).limit(1).single();
      if (semData) {
        const { data: subs } = await (supabase.from("subjects") as any)
          .select("name").eq("semester_id", semData.id).order("name");
        if (subs && subs.length > 0) {
          const names = subs.map((s: { name: string }) => s.name);
          setSubjects(names);
          setSelectedSubject(names[0]);
          return;
        }
      }
      const [decksRes, sessionsRes] = await Promise.all([
        (supabase.from("decks") as any).select("name").eq("user_id", user.id),
        (supabase.from("focus_sessions") as any).select("subject").eq("user_id", user.id),
      ]);
      const set = new Set<string>();
      decksRes.data?.forEach((d: { name: string }) => d.name && set.add(d.name));
      sessionsRes.data?.forEach((s: { subject: string }) => s.subject && set.add(s.subject));
      if (set.size > 0) { setSubjects([...set]); setSelectedSubject([...set][0]); }
    };
    fetchSubjects();
  }, [user]);

  const activeSubject = customSubject.trim() || selectedSubject;

  if (isStarted) {
    return (
      <>
        <FocusTimer
          focusSubject={activeSubject}
          defaultMinutes={selectedDuration}
          ambient={ambient}
          onBack={() => setIsStarted(false)}
        />
        <TravelerHotbar />
      </>
    );
  }

  const chip = (active: boolean) =>
    active
      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
      : isSun
        ? "bg-white/70 text-slate-600 hover:bg-white border border-slate-200"
        : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10";

  const cardCls = isSun ? "bg-white/70 border-white/60" : "bg-white/[0.04] border-white/10";
  const label = isSun ? "text-slate-700" : "text-slate-200";
  const sub = isSun ? "text-slate-500" : "text-slate-400";

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6 py-16">
        {/* Calming, theme-aware backdrop */}
        <div className={`absolute inset-0 -z-10 ${isSun
          ? "bg-gradient-to-br from-stone-100 via-teal-50 to-indigo-100"
          : "bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900"}`} />
        <div className="absolute inset-0 -z-10 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "28px 28px" }} />

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${isSun ? "bg-violet-100 text-violet-600" : "bg-violet-500/15 text-violet-300"}`}>
              <Timer className="w-7 h-7" />
            </div>
            <h1 className={`text-3xl font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-900" : "text-white"}`}>Focus</h1>
            <p className={`mt-1 text-sm ${sub}`}>Pick what you&apos;re working on and settle in.</p>
          </div>

          {/* Subject */}
          <div className={`rounded-2xl border backdrop-blur-xl p-5 mb-3 ${cardCls}`}>
            <label className={`flex items-center gap-1.5 text-sm font-bold mb-3 ${label}`}><BookOpen className="w-4 h-4" /> Subject</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {subjects.map((s) => (
                <button key={s} onClick={() => { setSelectedSubject(s); setCustomSubject(""); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${chip(selectedSubject === s && !customSubject)}`}>
                  {s}
                </button>
              ))}
            </div>
            <input type="text" value={customSubject} onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Or type something else..."
              className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-colors ${isSun ? "bg-white/70 border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-violet-400" : "bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500"}`} />
          </div>

          {/* Duration */}
          <div className={`rounded-2xl border backdrop-blur-xl p-5 mb-3 ${cardCls}`}>
            <label className={`flex items-center gap-1.5 text-sm font-bold mb-3 ${label}`}><Timer className="w-4 h-4" /> Length</label>
            <div className="flex gap-2">
              {DURATIONS.map((m) => (
                <button key={m} onClick={() => setSelectedDuration(m)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${chip(selectedDuration === m)}`}>{m}m</button>
              ))}
            </div>
          </div>

          {/* Ambient sound */}
          <div className={`rounded-2xl border backdrop-blur-xl p-5 mb-6 ${cardCls}`}>
            <label className={`flex items-center gap-1.5 text-sm font-bold mb-3 ${label}`}><Volume2 className="w-4 h-4" /> Focus with</label>
            <div className="grid grid-cols-3 gap-2">
              {AMBIENT.map(({ key, label: l, icon: Icon }) => (
                <button key={key} onClick={() => setAmbient(key)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-colors ${chip(ambient === key)}`}>
                  <Icon className="w-5 h-5" /> {l}
                </button>
              ))}
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} onClick={() => setIsStarted(true)}
            className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-lg shadow-xl shadow-violet-600/30 transition-colors flex items-center justify-center gap-2 font-[family-name:var(--font-nunito)]">
            <Play className="w-5 h-5" fill="white" /> Begin
          </motion.button>
        </motion.div>
      </div>
      <TravelerHotbar />
    </>
  );
}
