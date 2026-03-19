"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, CheckCircle, Plus, ChevronRight, GraduationCap } from "lucide-react";
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
  const { user } = useAuth();
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
      // Get the active semester
      const { data: semData } = await supabase
        .from("semesters")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (semData) {
        setSemester(semData);
        // Get subjects and topics for this semester
        const { data: subData } = await supabase
          .from("subjects")
          .select(`
            id, name,
            topics ( id, is_completed )
          `)
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
      // Mark old semester as inactive
      await supabase
        .from("semesters")
        .update({ is_active: false })
        .eq("id", semester.id);
      
      // Let them do onboarding again
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
      <div className={`p-4 rounded-xl border ${isSun ? "bg-white/60 border-amber-200/50" : "bg-slate-800/50 border-white/5"} animate-pulse h-32`} />
    );
  }

  const defaultClasses = isSun 
    ? "bg-white/80 border-amber-200/50 text-slate-800 shadow-sm" 
    : "bg-[#1E293B]/80 border-white/10 text-white shadow-lg";

  // Calculate overall progress
  let totalTopics = 0;
  let completedTopics = 0;
  subjects.forEach(sub => {
    totalTopics += sub.topics.length;
    completedTopics += sub.topics.filter(t => t.is_completed).length;
  });

  const progressPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-md relative overflow-hidden ${defaultClasses}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${isSun ? "bg-amber-100 text-amber-600" : "bg-indigo-500/20 text-indigo-400"}`}>
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className={`font-bold ${isSun ? "text-slate-800" : "text-white"}`}>{semester ? semester.name : "Active Syllabus"}</h3>
          <p className={`text-xs ${isSun ? "text-slate-500" : "text-slate-300"}`}>
            Your ultimate study plan
          </p>
        </div>
      </div>

      {semester ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={isSun ? "text-slate-600" : "text-slate-200"}>Overall Mastery</span>
              <span className="font-bold">{progressPct}%</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isSun ? "bg-slate-200" : "bg-slate-700"}`}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className={`h-full ${isSun ? "bg-amber-500" : "bg-indigo-500"}`}
              />
            </div>
            <p className={`text-xs text-center mt-1 ${isSun ? "text-slate-500" : "text-slate-300"}`}>
              {subjects.length} Subjects • {totalTopics} Topics
            </p>
          </div>

          <button
            onClick={handleCompleteSemester}
            disabled={isCompleting}
            className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all
              ${isSun ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}
          >
            {isCompleting ? (
              <span className="animate-pulse">Archiving...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Finish Term & Start New
              </>
            )}
          </button>
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
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-all
              ${isSun ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-indigo-500 text-white hover:bg-indigo-600"}`}
          >
            <Plus className="w-4 h-4" />
            Create Syllabus
          </button>
        </div>
      )}
    </motion.div>
  );
}
