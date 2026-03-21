"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, GraduationCap, Flame } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";

type Semester = {
  id: string;
  name: string;
  is_active: boolean;
};

type Subject = {
  id: string;
  name: string;
  topics: { id: string; is_completed: boolean }[];
};

/**
 * Left Panel - My Study Profile
 * Compact frosted glass panel with Season Mastery progress + action buttons
 */
export default function SyllabusWidget() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const isSun = theme === "sun";
  const router = useRouter();

  const [semester, setSemester] = useState<Semester | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const fetchSyllabus = async () => {
    if (!user) return;
    try {
      const { data: semData } = await (supabase.from("semesters") as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (semData) {
        setSemester(semData);
        const { data: subData } = await (supabase.from("subjects") as any)
          .select(`id, name, topics ( id, is_completed )`)
          .eq("semester_id", semData.id);

        if (subData) {
          setSubjects(subData as unknown as Subject[]);
        }
      }
    } catch (error) {
      console.error("Error fetching syllabus:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSyllabus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCompleteSemester = async () => {
    if (!user || !semester) return;
    setIsCompleting(true);
    try {
      await (supabase.from("semesters") as any)
        .update({ is_active: false })
        .eq("id", semester.id);
      
      await (supabase.from("profiles") as any)
        .update({ onboarding_completed: false })
        .eq("id", user.id);
      
      router.push("/onboarding");
    } catch (error) {
      console.error("Failed to complete semester:", error);
      setIsCompleting(false);
    }
  };

  const glassPanel = isSun 
    ? "bg-white/30 border border-white/50 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]" 
    : "bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]";

  const glassInner = isSun
    ? "inset 0 1px 0 rgba(255,255,255,0.6)"
    : "inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(255,255,255,0.03)";

  if (isLoading) {
    return (
      <div className={`p-5 rounded-[24px] ${glassPanel} animate-pulse h-48`} />
    );
  }

  let totalTopics = 0;
  let completedTopics = 0;
  subjects.forEach(sub => {
    totalTopics += sub.topics.length;
    completedTopics += sub.topics.filter(t => t.is_completed).length;
  });
  const progressPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const streakDays = profile?.streak_days || 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Season Mastery Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-5 rounded-[24px] ${glassPanel}`}
        style={{ boxShadow: glassInner }}
      >
        {semester ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${isSun ? "bg-amber-100/80 text-amber-600" : "bg-indigo-500/15 text-indigo-400"}`}>
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`font-bold text-sm ${isSun ? "text-slate-800" : "text-white"}`}>Season Mastery</h3>
                <p className={`text-[10px] ${isSun ? "text-slate-400" : "text-white/40"}`}>{semester.name}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs ${isSun ? "text-slate-500" : "text-slate-400"}`}>Progress</span>
                <span className={`text-xs font-bold ${isSun ? "text-slate-800" : "text-white"}`}>{progressPct}%</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isSun ? "bg-slate-200/60" : "bg-white/[0.06]"}`}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className={`h-full rounded-full ${isSun ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-indigo-400 to-purple-500"}`}
                />
              </div>
              <p className={`text-[10px] ${isSun ? "text-slate-400" : "text-white/30"}`}>
                {subjects.length} Subjects &middot; {completedTopics}/{totalTopics} Topics
              </p>
            </div>

            {/* Pill Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/knowledge")}
                className={`flex-1 py-2 rounded-full text-[11px] font-bold text-center transition-all ${
                  isSun 
                    ? "bg-white/60 text-slate-600 border border-white/80 hover:bg-white/80" 
                    : "bg-white/[0.06] text-white/70 border border-white/[0.08] hover:bg-white/[0.1]"
                }`}
              >
                Current Plan
              </button>
              <button
                onClick={handleCompleteSemester}
                disabled={isCompleting}
                className={`flex-1 py-2 rounded-full text-[11px] font-bold text-center transition-all ${
                  isSun 
                    ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white hover:shadow-md" 
                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25"
                }`}
              >
                {isCompleting ? "..." : "Set New Goal"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-3">
            <GraduationCap className={`w-7 h-7 mx-auto ${isSun ? "text-slate-300" : "text-slate-600"}`} />
            <p className={`text-xs ${isSun ? "text-slate-400" : "text-slate-400"}`}>
              No active syllabus
            </p>
            <button
              onClick={() => {
                (supabase.from("profiles") as any).update({ onboarding_completed: false }).eq("id", user?.id || "").then(() => {
                  router.push("/onboarding");
                });
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 mx-auto transition-all ${
                isSun ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-indigo-500 text-white hover:bg-indigo-600"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Create Syllabus
            </button>
          </div>
        )}
      </motion.div>

      {/* Streak Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`p-4 rounded-[20px] ${glassPanel} flex items-center gap-3`}
        style={{ boxShadow: glassInner }}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
          isSun ? "bg-orange-100/80" : "bg-orange-500/15"
        }`}>
          <Flame className={`w-4.5 h-4.5 ${isSun ? "text-orange-500" : "text-orange-400"}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-black ${isSun ? "text-slate-800" : "text-white"}`}>{streakDays}</span>
            <span className={`text-[10px] font-bold ${isSun ? "text-slate-400" : "text-white/40"}`}>day streak</span>
          </div>
          <p className={`text-[9px] ${isSun ? "text-slate-400" : "text-white/30"}`}>
            Keep the flame alive
          </p>
        </div>
      </motion.div>
    </div>
  );
}
