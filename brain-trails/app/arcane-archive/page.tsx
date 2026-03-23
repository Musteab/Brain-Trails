"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, Brain, GraduationCap, Plus, Sparkles, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

interface Subject {
  id: string;
  name: string;
  emoji: string;
  topics: { id: string; name: string; is_completed: boolean }[];
  _count?: {
    notes: number;
    decks: number;
  };
}

/**
 * Arcane Archive - Main Hub
 * Lists all subjects from the user's active syllabus
 */
export default function ArcaneArchivePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isSun = theme === "sun";

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [semesterName, setSemesterName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchSubjects = async () => {
      // Get active semester
      const { data: semData } = await (supabase.from("semesters") as any)
        .select("id, name")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!semData) {
        setIsLoading(false);
        return;
      }

      setSemesterName(semData.name);

      // Get subjects with topics
      const { data: subData } = await (supabase.from("subjects") as any)
        .select(`
          id, name, emoji,
          topics ( id, name, is_completed )
        `)
        .eq("semester_id", semData.id)
        .order("name");

      if (subData) {
        // Get counts for notes and decks per subject
        const subjectIds = subData.map((s: Subject) => s.id);
        
        const [{ data: noteCounts }, { data: deckCounts }] = await Promise.all([
          (supabase.from("notes") as any)
            .select("subject_id")
            .eq("user_id", user.id)
            .in("subject_id", subjectIds),
          (supabase.from("decks") as any)
            .select("subject_id")
            .eq("user_id", user.id)
            .in("subject_id", subjectIds),
        ]);

        const enriched = subData.map((s: Subject) => ({
          ...s,
          _count: {
            notes: (noteCounts ?? []).filter((n: { subject_id: string }) => n.subject_id === s.id).length,
            decks: (deckCounts ?? []).filter((d: { subject_id: string }) => d.subject_id === s.id).length,
          },
        }));

        setSubjects(enriched);
      }
      setIsLoading(false);
    };

    fetchSubjects();
  }, [user]);

  const glassCard = isSun
    ? "bg-white/40 border border-white/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
    : "bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2.5 rounded-xl ${isSun ? "bg-violet-100" : "bg-violet-500/20"}`}>
            <BookOpen className={`w-6 h-6 ${isSun ? "text-violet-600" : "text-violet-400"}`} />
          </div>
          <h1 className={`text-3xl font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
            Arcane Archive
          </h1>
        </div>
        {semesterName && (
          <p className={`text-sm ${isSun ? "text-slate-500" : "text-slate-400"} ml-14`}>
            {semesterName} - Choose a subject to study
          </p>
        )}
      </motion.div>

      {/* Subject Grid */}
      {subjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${glassCard} rounded-3xl p-12 text-center`}
        >
          <GraduationCap className={`w-16 h-16 mx-auto mb-4 ${isSun ? "text-slate-300" : "text-slate-600"}`} />
          <h2 className={`text-xl font-bold mb-2 ${isSun ? "text-slate-700" : "text-white"}`}>
            No Active Syllabus
          </h2>
          <p className={`mb-6 ${isSun ? "text-slate-500" : "text-slate-400"}`}>
            Create a syllabus to organize your subjects and start studying!
          </p>
          <Link
            href="/onboarding"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              isSun
                ? "bg-violet-500 text-white hover:bg-violet-600"
                : "bg-violet-500 text-white hover:bg-violet-600"
            }`}
          >
            <Plus className="w-5 h-5" />
            Create Syllabus
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((subject, i) => {
            const completedTopics = subject.topics.filter(t => t.is_completed).length;
            const totalTopics = subject.topics.length;
            const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/arcane-archive/${subject.id}`}>
                  <div
                    className={`${glassCard} rounded-2xl p-6 hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer group`}
                  >
                    {/* Subject Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{subject.emoji || "📚"}</span>
                        <div>
                          <h3 className={`text-lg font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
                            {subject.name}
                          </h3>
                          <p className={`text-xs ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                            {totalTopics} topics
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${isSun ? "text-slate-400" : "text-slate-500"} group-hover:translate-x-1 transition-transform`} />
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs ${isSun ? "text-slate-500" : "text-slate-400"}`}>Progress</span>
                        <span className={`text-xs font-bold ${isSun ? "text-slate-700" : "text-white"}`}>{progress}%</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${isSun ? "bg-slate-200/60" : "bg-white/[0.06]"}`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, delay: i * 0.05 + 0.2 }}
                          className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500"
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4">
                      <div className={`flex items-center gap-1.5 text-xs ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{subject._count?.notes || 0} notes</span>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                        <Brain className="w-3.5 h-3.5" />
                        <span>{subject._count?.decks || 0} decks</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
