"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, BookOpen, Brain, FileText, Swords, Flame, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

interface Topic {
  id: string;
  name: string;
  is_completed: boolean;
}

interface Subject {
  id: string;
  name: string;
  emoji: string;
  topics: Topic[];
}

interface StudyStats {
  notesCount: number;
  decksCount: number;
  cardsCount: number;
  focusMinutes: number;
}

/**
 * Subject Hub - Overview for a single subject
 * Shows study modes (Spellbook, Flashcards, Quiz) and topic progress
 */
export default function SubjectHubPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;
  
  const { user } = useAuth();
  const { theme } = useTheme();
  const isSun = theme === "sun";

  const [subject, setSubject] = useState<Subject | null>(null);
  const [stats, setStats] = useState<StudyStats>({ notesCount: 0, decksCount: 0, cardsCount: 0, focusMinutes: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !subjectId) return;

    const fetchSubject = async () => {
      // Get subject with topics
      const { data: subData, error } = await (supabase.from("subjects") as any)
        .select(`
          id, name, emoji,
          topics ( id, name, is_completed )
        `)
        .eq("id", subjectId)
        .single();

      if (error || !subData) {
        console.error("Subject not found:", error);
        router.push("/arcane-archive");
        return;
      }

      setSubject(subData);

      // Get study stats for this subject
      const [
        { count: notesCount },
        { data: decksData },
        { data: focusData },
      ] = await Promise.all([
        (supabase.from("notes") as any)
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("subject_id", subjectId),
        (supabase.from("decks") as any)
          .select("id, cards(id)")
          .eq("user_id", user.id)
          .eq("subject_id", subjectId),
        (supabase.from("focus_sessions") as any)
          .select("duration_minutes")
          .eq("user_id", user.id)
          .eq("subject_id", subjectId),
      ]);

      const decksCount = decksData?.length || 0;
      const cardsCount = decksData?.reduce((acc: number, d: { cards: unknown[] }) => acc + (d.cards?.length || 0), 0) || 0;
      const focusMinutes = focusData?.reduce((acc: number, f: { duration_minutes: number }) => acc + (f.duration_minutes || 0), 0) || 0;

      setStats({
        notesCount: notesCount || 0,
        decksCount,
        cardsCount,
        focusMinutes,
      });

      setIsLoading(false);
    };

    fetchSubject();
  }, [user, subjectId, router]);

  const glassCard = isSun
    ? "bg-white/40 border border-white/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
    : "bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]";

  const studyModes = [
    {
      id: "spellbook",
      title: "Spellbook",
      subtitle: "Write notes & study materials",
      icon: FileText,
      href: `/arcane-archive/${subjectId}/spellbook`,
      color: isSun ? "from-violet-400 to-purple-500" : "from-violet-500 to-purple-600",
      stat: `${stats.notesCount} notes`,
    },
    {
      id: "flashcards",
      title: "Spell Cards",
      subtitle: "Review with flashcards",
      icon: Brain,
      href: `/arcane-archive/${subjectId}/flashcards`,
      color: isSun ? "from-emerald-400 to-teal-500" : "from-emerald-500 to-teal-600",
      stat: `${stats.decksCount} decks · ${stats.cardsCount} cards`,
    },
    {
      id: "quiz",
      title: "Trial by Fire",
      subtitle: "Test your knowledge",
      icon: Swords,
      href: `/arcane-archive/${subjectId}/quiz`,
      color: isSun ? "from-orange-400 to-red-500" : "from-orange-500 to-red-600",
      stat: "Quiz mode",
    },
    {
      id: "exam-cram",
      title: "Exam Cram",
      subtitle: "Intense distraction-free study",
      icon: Flame,
      href: `/arcane-archive/${subjectId}/exam-cram`,
      color: isSun ? "from-red-400 to-orange-500" : "from-red-500 to-orange-600",
      stat: "Focus mode",
    },
  ];

  if (isLoading || !subject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const completedTopics = subject.topics.filter(t => t.is_completed).length;
  const totalTopics = subject.topics.length;
  const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pb-32">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push("/arcane-archive")}
        className={`flex items-center gap-2 mb-6 px-3 py-2 rounded-xl transition-colors ${
          isSun ? "hover:bg-white/50 text-slate-600" : "hover:bg-white/10 text-slate-400"
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Archive</span>
      </motion.button>

      {/* Subject Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${glassCard} rounded-3xl p-8 mb-8`}
      >
        <div className="flex items-start gap-5 mb-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
            isSun ? "bg-violet-100" : "bg-violet-500/20"
          }`}>
            {subject.emoji || "📚"}
          </div>
          <div className="flex-1">
            <h1 className={`text-2xl font-bold font-[family-name:var(--font-nunito)] mb-1 ${isSun ? "text-slate-800" : "text-white"}`}>
              {subject.name}
            </h1>
            <p className={`text-sm ${isSun ? "text-slate-500" : "text-slate-400"}`}>
              {totalTopics} topics · {stats.focusMinutes} min studied
            </p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isSun ? "text-slate-600" : "text-slate-300"}`}>
              Topic Mastery
            </span>
            <span className={`text-sm font-bold ${isSun ? "text-violet-600" : "text-violet-400"}`}>
              {completedTopics}/{totalTopics} completed
            </span>
          </div>
          <div className={`h-3 rounded-full overflow-hidden ${isSun ? "bg-slate-200/60" : "bg-white/[0.06]"}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Study Modes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h2 className={`text-lg font-bold mb-4 ${isSun ? "text-slate-700" : "text-white"}`}>
          Study Modes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {studyModes.map((mode, i) => (
            <Link key={mode.id} href={mode.href}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={`${glassCard} rounded-2xl p-5 hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer group`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${mode.color}`}>
                  <mode.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-base font-bold mb-1 ${isSun ? "text-slate-800" : "text-white"}`}>
                  {mode.title}
                </h3>
                <p className={`text-xs mb-2 ${isSun ? "text-slate-500" : "text-slate-400"}`}>
                  {mode.subtitle}
                </p>
                <p className={`text-xs font-medium ${isSun ? "text-violet-600" : "text-violet-400"}`}>
                  {mode.stat}
                </p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Topics List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className={`text-lg font-bold mb-4 ${isSun ? "text-slate-700" : "text-white"}`}>
          Topics
        </h2>
        <div className={`${glassCard} rounded-2xl divide-y ${isSun ? "divide-slate-200/50" : "divide-white/[0.06]"}`}>
          {subject.topics.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className={`w-12 h-12 mx-auto mb-3 ${isSun ? "text-slate-300" : "text-slate-600"}`} />
              <p className={isSun ? "text-slate-500" : "text-slate-400"}>
                No topics added yet
              </p>
            </div>
          ) : (
            subject.topics.map((topic) => (
              <div
                key={topic.id}
                className={`flex items-center gap-4 p-4 ${
                  topic.is_completed ? (isSun ? "bg-emerald-50/50" : "bg-emerald-500/5") : ""
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  topic.is_completed
                    ? (isSun ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500/20 text-emerald-400")
                    : (isSun ? "bg-slate-100 text-slate-400" : "bg-white/10 text-slate-500")
                }`}>
                  {topic.is_completed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Flame className="w-4 h-4" />
                  )}
                </div>
                <span className={`flex-1 ${
                  topic.is_completed
                    ? (isSun ? "text-emerald-700" : "text-emerald-400")
                    : (isSun ? "text-slate-700" : "text-white")
                }`}>
                  {topic.name}
                </span>
                {topic.is_completed && (
                  <span className={`text-xs font-medium ${isSun ? "text-emerald-600" : "text-emerald-400"}`}>
                    Mastered
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
