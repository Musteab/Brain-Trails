"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, BookOpen, Sparkles } from "lucide-react";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import KnowledgeMap from "@/components/knowledge/KnowledgeMap";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useUIStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import type { SkillNode, SkillPath } from "@/components/knowledge/KnowledgeMap";

/* ── Supabase row types ── */
interface DBSubject {
  id: string;
  name: string;
  code: string;
  emoji: string;
  color: string;
  description: string;
}

interface DBTopic {
  id: string;
  subject_id: string;
  name: string;
  sort_order: number;
  mastery_pct: number;
  is_completed: boolean;
}

interface DBExam {
  id: string;
  subject_id: string;
  name: string;
  exam_type: string;
  exam_date: string;
  is_completed: boolean;
}

/* ── Helpers to transform syllabus data → SkillNode format ── */
function topicsToNodes(topics: DBTopic[], exams: DBExam[]): SkillNode[] {
  const nodes: SkillNode[] = [];
  const sorted = [...topics].sort((a, b) => a.sort_order - b.sort_order);

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    nodes.push({
      id: t.id,
      name: t.name,
      description: "",
      node_type: "topic",
      sort_order: t.sort_order,
      mastery_pct: t.mastery_pct,
      is_unlocked: i === 0 || sorted[i - 1].is_completed,
      is_completed: t.is_completed,
      xp_reward: 10,
    });
  }

  // Add exams as boss nodes at the end
  const allTopicsComplete = sorted.every((t) => t.is_completed);
  for (let i = 0; i < exams.length; i++) {
    const ex = exams[i];
    nodes.push({
      id: ex.id,
      name: `⚔️ ${ex.name}`,
      description: new Date(ex.exam_date).toLocaleDateString(),
      node_type: "boss",
      sort_order: sorted.length + i,
      mastery_pct: ex.is_completed ? 100 : 0,
      is_unlocked: allTopicsComplete,
      is_completed: ex.is_completed,
      xp_reward: 50,
    });
  }

  return nodes;
}

function subjectToPath(sub: DBSubject): SkillPath {
  return {
    id: sub.id,
    name: sub.name,
    description: sub.code || sub.description || "",
    emoji: sub.emoji || "📚",
    color: sub.color || "from-purple-500 to-indigo-600",
  };
}

/* ── Composed path type ── */
interface SubjectPath {
  path: SkillPath;
  nodes: SkillNode[];
  topicCount: number;
  completedCount: number;
}

export default function KnowledgePage() {
  const { user } = useAuth();
  const { card, isSun, title, muted } = useCardStyles();
  const { addToast } = useUIStore();

  const [subjectPaths, setSubjectPaths] = useState<SubjectPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<SubjectPath | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    // 1. Get the active semester
    const { data: semData } = await supabase
      .from("semesters")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!semData) {
      setIsLoading(false);
      return;
    }

    // 2. Get subjects for this semester
    const { data: subjects, error: subErr } = await supabase
      .from("subjects")
      .select("id, name, code, emoji, color, description")
      .eq("semester_id", semData.id)
      .order("name");

    if (subErr || !subjects || subjects.length === 0) {
      setIsLoading(false);
      return;
    }

    const subjectIds = subjects.map((s: DBSubject) => s.id);

    // 3. Fetch all topics and exams for these subjects in parallel
    const [topicsRes, examsRes] = await Promise.all([
      supabase
        .from("topics")
        .select("id, subject_id, name, sort_order, mastery_pct, is_completed")
        .in("subject_id", subjectIds)
        .order("sort_order"),
      supabase
        .from("exams")
        .select("id, subject_id, name, exam_type, exam_date, is_completed")
        .in("subject_id", subjectIds)
        .order("exam_date"),
    ]);

    const allTopics = (topicsRes.data ?? []) as DBTopic[];
    const allExams = (examsRes.data ?? []) as DBExam[];

    // 4. Build SubjectPath objects
    const paths: SubjectPath[] = (subjects as DBSubject[]).map((sub) => {
      const subTopics = allTopics.filter((t) => t.subject_id === sub.id);
      const subExams = allExams.filter((e) => e.subject_id === sub.id);
      const nodes = topicsToNodes(subTopics, subExams);

      return {
        path: subjectToPath(sub),
        nodes,
        topicCount: subTopics.length,
        completedCount: subTopics.filter((t) => t.is_completed).length,
      };
    });

    setSubjectPaths(paths);
    setIsLoading(false);

    // Update the currently selected path to instantly show newly mastered topics
    setSelectedPath((currentSelected) => {
      if (!currentSelected) return null;
      return paths.find((p) => p.path.id === currentSelected.path.id) || null;
    });
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCompletionPct = (sp: SubjectPath) => {
    if (sp.topicCount === 0) return 0;
    return Math.round((sp.completedCount / sp.topicCount) * 100);
  };

  // ===== Visual Node Map View =====
  if (selectedPath) {
    return (
      <main className="relative min-h-screen">
        <div
          className={`fixed inset-0 ${
            isSun
              ? "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
              : "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
          }`}
        />

        <div className="relative z-10 flex flex-col h-screen pb-24">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 px-6 py-4"
          >
            <motion.button
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedPath(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                isSun ? "hover:bg-slate-100 text-slate-600" : "hover:bg-white/10 text-slate-300"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium font-[family-name:var(--font-quicksand)]">Subjects</span>
            </motion.button>

            <div className="flex items-center gap-3 flex-1">
              <span className="text-2xl">{selectedPath.path.emoji}</span>
              <h2 className={`text-xl font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
                {selectedPath.path.name}
              </h2>
              <span className={`text-sm px-3 py-1 rounded-full font-[family-name:var(--font-quicksand)] ${
                isSun ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-300"
              }`}>
                {getCompletionPct(selectedPath)}% mastered
              </span>
            </div>
          </motion.div>

          {/* Map */}
          <div className="flex-1 overflow-hidden">
            <KnowledgeMap
              path={selectedPath.path}
              nodes={selectedPath.nodes}
              onNodesChanged={fetchData}
            />
          </div>
        </div>

        <TravelerHotbar />
      </main>
    );
  }

  // ===== Subject List View =====
  return (
    <main className="relative min-h-screen">
      <div
        className={`fixed inset-0 ${
          isSun
            ? "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
            : "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
        }`}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 pb-32">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className={`text-4xl font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white drop-shadow-lg"}`}>
            Arcane Archive <span className="ml-2 align-middle text-sm bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-amber-500/30">Skill Tree</span>
          </h1>
          <p className={`mt-2 font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-500" : "text-slate-300"}`}>
            Your subjects from onboarding, visualized as a skill tree. Master topics to unlock exams.
          </p>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : subjectPaths.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${card} p-12 text-center`}
          >
            <BookOpen className={`w-20 h-20 mx-auto mb-6 ${isSun ? "text-purple-300" : "text-purple-500/50"}`} />
            <h3 className={`text-2xl font-bold font-[family-name:var(--font-nunito)] mb-3 ${title}`}>
              No Subjects Found
            </h3>
            <p className={`max-w-md mx-auto mb-8 font-[family-name:var(--font-quicksand)] ${muted}`}>
              Complete the onboarding by uploading your syllabus. Your subjects and topics will appear here as an interactive skill tree!
            </p>
          </motion.div>
        ) : (
          /* Path Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectPaths.map((sp, i) => {
              const pct = getCompletionPct(sp);
              return (
                <motion.div
                  key={sp.path.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative group"
                >
                  <button
                    onClick={() => setSelectedPath(sp)}
                    className={`w-full h-full p-6 rounded-2xl text-left transition-all ${
                      isSun
                        ? "bg-white/80 backdrop-blur-sm border-2 border-slate-200 hover:shadow-xl hover:border-purple-300 hover:-translate-y-1"
                        : "bg-slate-800/90 backdrop-blur-sm border-2 border-purple-400/20 hover:shadow-xl hover:border-purple-400/50 hover:-translate-y-1"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-4xl">{sp.path.emoji}</span>
                      <Sparkles className={`w-5 h-5 ${pct === 100 ? "text-amber-400" : isSun ? "text-slate-300" : "text-purple-400/50"}`} />
                    </div>

                    <h3 className={`text-lg font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white drop-shadow-sm"}`}>
                      {sp.path.name}
                    </h3>
                    {sp.path.description && (
                      <p className={`text-sm mt-1 line-clamp-1 font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-500" : "text-slate-300"}`}>
                        {sp.path.description}
                      </p>
                    )}

                    <div className={`flex items-center gap-3 mt-4 text-xs font-[family-name:var(--font-quicksand)] ${isSun ? "text-slate-500" : "text-slate-300"}`}>
                      <span>{sp.topicCount} topics</span>
                      <span>{pct}% mastered</span>
                    </div>

                    {/* Progress bar */}
                    <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${isSun ? "bg-slate-100" : "bg-white/10"}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
                      />
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <TravelerHotbar />
    </main>
  );
}
