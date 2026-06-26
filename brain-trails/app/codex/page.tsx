"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, NotebookPen, Layers, GraduationCap, CalendarClock, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { supabase } from "@/lib/supabase";
import BackgroundLayer from "@/components/layout/BackgroundLayer";
import TravelerHotbar from "@/components/layout/TravelerHotbar";

interface SubjectCard {
  id: string;
  name: string;
  code: string;
  emoji: string;
  color: string;
  mastery: number;        // avg of topic mastery
  topicCount: number;
  deckCount: number;
  noteCount: number;
  nextExam: { name: string; date: string } | null;
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export default function CodexHub() {
  const router = useRouter();
  const { user } = useAuth();
  const { isSun, muted } = useCardStyles();
  const [subjects, setSubjects] = useState<SubjectCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      // Active semester
      const { data: sem } = await supabase
        .from("semesters").select("id").eq("user_id", user.id).eq("is_active", true).limit(1).maybeSingle();

      const { data: subs } = await supabase
        .from("subjects")
        .select("id, name, code, emoji, color")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("name");

      if (cancelled) return;
      const subjectRows = subs ?? [];
      if (subjectRows.length === 0) { setSubjects([]); setIsLoading(false); return; }

      const ids = subjectRows.map((s: { id: string }) => s.id);

      // Bulk-fetch related rows, then group client-side.
      const [topicsRes, decksRes, notesRes, examsRes] = await Promise.all([
        supabase.from("topics").select("subject_id, mastery_pct").in("subject_id", ids),
        supabase.from("decks").select("id, subject_id").in("subject_id", ids),
        supabase.from("notes").select("id, subject_id").in("subject_id", ids),
        supabase.from("exams").select("subject_id, name, exam_date").in("subject_id", ids)
          .gte("exam_date", new Date().toISOString()).order("exam_date"),
      ]);

      const topics = topicsRes.data ?? [];
      const decks = decksRes.data ?? [];
      const notes = notesRes.data ?? [];
      const exams = examsRes.data ?? [];

      const cards: SubjectCard[] = subjectRows.map((s: { id: string; name: string; code: string; emoji: string; color: string }) => {
        const myTopics = topics.filter((t: { subject_id: string }) => t.subject_id === s.id);
        const mastery = myTopics.length
          ? Math.round(myTopics.reduce((a: number, t: { mastery_pct: number }) => a + (t.mastery_pct ?? 0), 0) / myTopics.length)
          : 0;
        const nextExam = exams.find((e: { subject_id: string }) => e.subject_id === s.id) as { name: string; exam_date: string } | undefined;
        return {
          id: s.id, name: s.name, code: s.code, emoji: s.emoji || "📘",
          color: s.color || "from-violet-500 to-purple-600",
          mastery,
          topicCount: myTopics.length,
          deckCount: decks.filter((d: { subject_id: string }) => d.subject_id === s.id).length,
          noteCount: notes.filter((n: { subject_id: string }) => n.subject_id === s.id).length,
          nextExam: nextExam ? { name: nextExam.name, date: nextExam.exam_date } : null,
        };
      });

      if (!cancelled) { setSubjects(cards); setIsLoading(false); }
    })();

    return () => { cancelled = true; };
  }, [user]);

  return (
    <>
      <BackgroundLayer />
      <div className="min-h-screen pb-28 pt-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.push("/")}
              className={`p-2 rounded-xl border ${isSun ? "bg-white/70 border-slate-200 text-slate-600" : "bg-white/10 border-white/20 text-white"}`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-2xl font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-white"}`}>
                Codex
              </h1>
              <p className={`text-xs ${muted}`}>Every subject, its notes, decks & trials in one place</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`h-40 rounded-3xl animate-pulse ${isSun ? "bg-white/50" : "bg-white/5"}`} />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className={`mt-10 rounded-3xl border p-10 text-center ${isSun ? "bg-white/70 border-slate-200" : "bg-white/5 border-white/10"}`}>
              <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isSun ? "bg-violet-100 text-violet-600" : "bg-violet-500/20 text-violet-300"}`}>
                <NotebookPen className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-bold ${isSun ? "text-slate-800" : "text-white"}`}>No subjects yet</h3>
              <p className={`text-sm mt-1 mb-5 ${muted}`}>Let the AI parse your syllabus into a study plan - subjects, topics and exams.</p>
              <button onClick={() => router.push("/onboarding")}
                className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700">
                Build my plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {subjects.map((s, i) => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => router.push(`/codex/${s.id}`)}
                  className={`group text-left rounded-3xl border p-5 transition-colors ${
                    isSun ? "bg-white border-slate-200 hover:border-slate-300" : "bg-slate-900/70 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl shadow-sm`}>
                        {s.emoji}
                      </div>
                      <div>
                        <h3 className={`font-bold leading-tight ${isSun ? "text-slate-800" : "text-white"}`}>{s.name}</h3>
                        {s.code && <p className={`text-xs ${muted}`}>{s.code}</p>}
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${muted} group-hover:translate-x-0.5 transition-transform`} />
                  </div>

                  {/* Mastery */}
                  <div className="mt-4">
                    <div className="flex justify-between mb-1">
                      <span className={`text-[11px] font-medium ${muted}`}>Mastery</span>
                      <span className={`text-[11px] font-bold ${isSun ? "text-slate-600" : "text-slate-300"}`}>{s.mastery}%</span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isSun ? "bg-slate-100" : "bg-white/10"}`}>
                      <div className={`h-full rounded-full bg-gradient-to-r ${s.color}`} style={{ width: `${s.mastery}%` }} />
                    </div>
                  </div>

                  {/* Meta */}
                  <div className={`mt-4 flex items-center gap-4 text-[11px] ${muted}`}>
                    <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {s.topicCount} topics</span>
                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {s.deckCount} decks</span>
                    <span className="flex items-center gap-1"><NotebookPen className="w-3.5 h-3.5" /> {s.noteCount} notes</span>
                  </div>

                  {s.nextExam && (
                    <div className={`mt-3 flex items-center gap-1.5 text-[11px] font-medium ${
                      daysUntil(s.nextExam.date) <= 7 ? "text-orange-500" : muted
                    }`}>
                      <CalendarClock className="w-3.5 h-3.5" />
                      {s.nextExam.name} in {daysUntil(s.nextExam.date)}d
                    </div>
                  )}
                </motion.button>
              ))}

              {/* Add subject */}
              <button onClick={() => router.push("/onboarding")}
                className={`rounded-3xl border border-dashed p-5 flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
                  isSun ? "border-slate-300 text-slate-500 hover:bg-white/50" : "border-white/15 text-slate-400 hover:bg-white/5"
                }`}>
                <Plus className="w-4 h-4" /> Add subjects
              </button>
            </div>
          )}
        </div>
      </div>
      <TravelerHotbar />
    </>
  );
}
