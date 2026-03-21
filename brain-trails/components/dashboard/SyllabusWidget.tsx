"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, Plus, GraduationCap, Flame } from "lucide-react";
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
  }, [user]);

  const handleCompleteSemester = async () => {
    if (!user || !semester) return;
    setIsCompleting(true);
    try {
      await (supabase.from("semesters") as any)
        .update({ is_active: false })
        .eq("id", semester.id);
      
      await supabase
        .from("profiles")
        .update({ onboarding_completed: false })
        .eq("id", user.id);
      
      router.push("/onboarding");
    } catch (error) {
      console.error("Failed to complete semester:", error);
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`p-5 rounded-[24px] border backdrop-blur-md ${isSun ? "bg-white/50 border-white/60" : "bg-black/20 border-white/10"} animate-pulse h-40`} />
    );
  }

  const glassClasses = isSun 
    ? "bg-white/50 border border-white/60 shadow-xl backdrop-blur-md" 
    : "bg-black/20 border border-white/10 shadow-xl backdrop-blur-md";

  let totalTopics = 0;
  let completedTopics = 0;
  subjects.forEach(sub => {
    totalTopics += sub.topics.length;
    completedTopics += sub.topics.filter(t => t.is_completed).length;
  });
  const progressPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const streakDays = profile?.streak_days || 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Main Syllabus Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-5 rounded-[24px] ${glassClasses}`}
      >
        {semester ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isSun ? "bg-amber-100 text-amber-600" : "bg-indigo-500/20 text-indigo-400"}`}>
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className={`font-bold text-sm ${isSun ? "text-slate-800" : "text-white"}`}>{semester.name}</h3>
            </div>

            {/* Overall Mastery Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className={`text-xs ${isSun ? "text-slate-600" : "text-slate-300"}`}>Overall Mastery</span>
                <span className={`text-xs font-bold ${isSun ? "text-slate-800" : "text-white"}`}>{progressPct}%</span>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden ${isSun ? "bg-slate-200/80" : "bg-white/10"}`}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className={`h-full rounded-full ${isSun ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-indigo-400 to-purple-500"}`}
                />
              </div>
              <p className={`text-[10px] ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                {subjects.length} Subjects • {totalTopics} Topics
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCompleteSemester}
                disabled={isCompleting}
                className={`flex-1 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isSun 
                    ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white hover:shadow-lg" 
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                {isCompleting ? "..." : "Start New Plan"}
              </button>
              <button
                onClick={() => router.push("/knowledge")}
                className={`flex-1 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isSun 
                    ? "bg-white/80 text-slate-700 border border-slate-200 hover:bg-white" 
                    : "bg-white/10 text-white/80 border border-white/10 hover:bg-white/20"
                }`}
              >
                View Current Plan
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-3">
            <GraduationCap className={`w-8 h-8 mx-auto ${isSun ? "text-slate-300" : "text-slate-600"}`} />
            <p className={`text-sm ${isSun ? "text-slate-500" : "text-slate-300"}`}>
              No active syllabus found.
            </p>
            <button
              onClick={() => {
                supabase.from("profiles").update({ onboarding_completed: false }).eq("id", user?.id || "").then(() => {
                  router.push("/onboarding");
                });
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-all ${
                isSun ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-indigo-500 text-white hover:bg-indigo-600"
              }`}
            >
              <Plus className="w-4 h-4" />
              Create Syllabus
            </button>
          </div>
        )}
      </motion.div>

      {/* Streak Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`p-4 rounded-[20px] ${glassClasses} flex items-center gap-3`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isSun ? "bg-orange-100" : "bg-orange-500/20"
        }`}>
          <Flame className={`w-5 h-5 ${isSun ? "text-orange-500" : "text-orange-400"}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black ${isSun ? "text-slate-800" : "text-white"}`}>{streakDays}</span>
            <span className={`text-xs font-bold ${isSun ? "text-slate-500" : "text-white/60"}`}>days</span>
          </div>
          <p className={`text-[10px] ${isSun ? "text-slate-500" : "text-white/50"}`}>
            🔥 Keep Trying, Never Be Tired
          </p>
        </div>
      </motion.div>
    </div>
  );
}
