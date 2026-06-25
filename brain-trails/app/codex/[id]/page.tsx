"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, NotebookPen, Layers, GraduationCap, CalendarClock,
  Plus, Check, Sparkle, Loader2, ChevronRight, BookOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useUIStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import { friendlyAiError } from "@/lib/aiError";
import BackgroundLayer from "@/components/layout/BackgroundLayer";
import TravelerHotbar from "@/components/layout/TravelerHotbar";

const BACKEND_URL = process.env.NEXT_PUBLIC_AI_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface Subject { id: string; name: string; code: string; emoji: string; color: string; professor: string; target_grade: string; }
interface Topic { id: string; name: string; mastery_pct: number; is_completed: boolean; sort_order: number; }
interface Deck { id: string; name: string; emoji: string; color: string; cardCount: number; }
interface Note { id: string; title: string; updated_at: string; }
interface Exam { id: string; name: string; exam_date: string; }

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export default function SubjectDetail() {
  const router = useRouter();
  const params = useParams();
  const subjectId = String(params.id);
  const { user } = useAuth();
  const { isSun, muted } = useCardStyles();
  const addToast = useUIStore((s) => s.addToast);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;

    const { data: subj } = await supabase
      .from("subjects").select("id, name, code, emoji, color, professor, target_grade")
      .eq("id", subjectId).maybeSingle();
    if (subj) setSubject(subj as Subject);

    const [topicsRes, decksRes, notesRes, examRes] = await Promise.all([
      supabase.from("topics").select("id, name, mastery_pct, is_completed, sort_order").eq("subject_id", subjectId).order("sort_order"),
      supabase.from("decks").select("id, name, emoji, color").eq("subject_id", subjectId).order("created_at"),
      supabase.from("notes").select("id, title, updated_at").eq("subject_id", subjectId).order("updated_at", { ascending: false }),
      supabase.from("exams").select("id, name, exam_date").eq("subject_id", subjectId)
        .gte("exam_date", new Date().toISOString()).order("exam_date").limit(1).maybeSingle(),
    ]);

    setTopics((topicsRes.data ?? []) as Topic[]);
    const deckRows = (decksRes.data ?? []) as { id: string; name: string; emoji: string; color: string }[];
    setNotes((notesRes.data ?? []) as Note[]);
    if (examRes.data) setExam(examRes.data as Exam);

    // Card counts per deck
    if (deckRows.length) {
      const { data: cardRows } = await supabase.from("cards").select("deck_id").in("deck_id", deckRows.map(d => d.id));
      const counts = (cardRows ?? []).reduce((m: Record<string, number>, c: { deck_id: string }) => {
        m[c.deck_id] = (m[c.deck_id] ?? 0) + 1; return m;
      }, {});
      setDecks(deckRows.map(d => ({ ...d, cardCount: counts[d.id] ?? 0 })));
    } else {
      setDecks([]);
    }

    // Trial attempts on this subject's quizzes (loose: count user's recent attempts)
    const { count } = await supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    setAttempts(count ?? 0);

    setIsLoading(false);
  }, [user, subjectId]);

  useEffect(() => { load(); }, [load]);

  const mastery = topics.length
    ? Math.round(topics.reduce((a, t) => a + (t.mastery_pct ?? 0), 0) / topics.length)
    : 0;

  const toggleTopic = async (t: Topic) => {
    const completed = !t.is_completed;
    const mastery_pct = completed ? 100 : t.mastery_pct;
    setTopics(prev => prev.map(x => x.id === t.id ? { ...x, is_completed: completed, mastery_pct } : x));
    await supabase.from("topics").update({ is_completed: completed, mastery_pct }).eq("id", t.id);
  };

  const generateDeck = async (topicName?: string) => {
    if (!user || !subject || generating) return;
    setGenerating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.name, topic: topicName || "General", count: 8, type: "flashcard" }),
      });
      const data = await res.json();
      if (!data.questions || data.questions.length === 0) throw new Error(data.error || "No cards generated");

      const deckName = `${subject.emoji || "📘"} ${topicName || subject.name}`;
      const { data: deckData, error: deckErr } = await supabase
        .from("decks").insert({ user_id: user.id, name: deckName, emoji: subject.emoji || "📘", color: subject.color, subject_id: subject.id })
        .select().single();
      if (deckErr || !deckData) throw new Error("Failed to create deck");

      await supabase.from("cards").insert(
        data.questions.map((q: { question: string; answer: string }) => ({
          deck_id: deckData.id, front: q.question, back: q.answer, mastery: 0, review_count: 0,
        }))
      );
      addToast(`Generated "${deckName}" — ${data.questions.length} cards`, "success");
      await load();
    } catch (err) {
      addToast(friendlyAiError(err), "error");
    } finally {
      setGenerating(false);
    }
  };

  const newNote = async () => {
    if (!user || !subject) return;
    const { data } = await supabase.from("notes")
      .insert({ user_id: user.id, title: `${subject.name} note`, subject_id: subject.id, content_html: "" })
      .select("id").single();
    if (data) router.push(`/notes?note=${data.id}`);
    else router.push("/notes");
  };

  const r = 34, c = 2 * Math.PI * r;
  const card = isSun ? "bg-white border-slate-200" : "bg-slate-900/70 border-white/10";
  const ink = isSun ? "text-slate-800" : "text-white";

  if (isLoading) {
    return (
      <>
        <BackgroundLayer />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
        <TravelerHotbar />
      </>
    );
  }

  if (!subject) {
    return (
      <>
        <BackgroundLayer />
        <div className="min-h-screen flex flex-col items-center justify-center gap-3">
          <p className={muted}>Subject not found.</p>
          <button onClick={() => router.push("/codex")} className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold">Back to Codex</button>
        </div>
        <TravelerHotbar />
      </>
    );
  }

  return (
    <>
      <BackgroundLayer />
      <div className="min-h-screen pb-28 pt-8 px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/codex")}
              className={`p-2 rounded-xl border ${isSun ? "bg-white/70 border-slate-200 text-slate-600" : "bg-white/10 border-white/20 text-white"}`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className={`rounded-3xl border ${card} p-6 flex items-center gap-5`}>
            <div className="relative w-[88px] h-[88px] shrink-0">
              <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
                <circle cx="44" cy="44" r={r} fill="none" strokeWidth="7" className={isSun ? "stroke-slate-100" : "stroke-white/10"} />
                <motion.circle cx="44" cy="44" r={r} fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-violet-500"
                  strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (mastery / 100) * c }} transition={{ duration: 0.8 }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl">{subject.emoji || "📘"}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`text-2xl font-bold font-[family-name:var(--font-nunito)] ${ink}`}>{subject.name}</h1>
              <p className={`text-xs ${muted}`}>
                {[subject.code, subject.professor, subject.target_grade && `Target ${subject.target_grade}`].filter(Boolean).join(" · ") || "Subject"}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs font-bold ${ink}`}>{mastery}% mastery</span>
                {exam && (
                  <span className={`flex items-center gap-1 text-xs font-medium ${daysUntil(exam.exam_date) <= 7 ? "text-orange-500" : muted}`}>
                    <CalendarClock className="w-3.5 h-3.5" /> {exam.name} in {daysUntil(exam.exam_date)}d
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Topics */}
          <Section title="Topics" icon={<GraduationCap className="w-4 h-4" />} card={card} ink={ink} muted={muted}>
            {topics.length === 0 ? (
              <p className={`text-sm ${muted}`}>No topics yet — the AI adds these when it parses your syllabus.</p>
            ) : (
              <div className="space-y-2">
                {topics.map(t => (
                  <div key={t.id} className="flex items-center gap-3">
                    <button onClick={() => toggleTopic(t)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        t.is_completed ? "bg-emerald-500 border-emerald-500 text-white" : isSun ? "border-slate-300" : "border-white/20"
                      }`}>
                      {t.is_completed && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`text-sm flex-1 ${t.is_completed ? "line-through opacity-60" : ""} ${ink}`}>{t.name}</span>
                    <div className={`w-20 h-1.5 rounded-full overflow-hidden ${isSun ? "bg-slate-100" : "bg-white/10"}`}>
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${t.mastery_pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Decks */}
            <Section title="Decks" icon={<Layers className="w-4 h-4" />} card={card} ink={ink} muted={muted}
              action={
                <button onClick={() => generateDeck()} disabled={generating}
                  className="flex items-center gap-1.5 text-xs font-semibold text-violet-500 hover:text-violet-600 disabled:opacity-50">
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkle className="w-3.5 h-3.5" />} AI deck
                </button>
              }>
              {decks.length === 0 ? (
                <p className={`text-sm ${muted}`}>No decks yet. Generate one with AI from your topics.</p>
              ) : (
                <div className="space-y-2">
                  {decks.map(d => (
                    <button key={d.id} onClick={() => router.push("/flashcards")}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl ${isSun ? "bg-slate-50 hover:bg-slate-100" : "bg-white/5 hover:bg-white/10"}`}>
                      <span className={`text-sm font-medium truncate ${ink}`}>{d.name}</span>
                      <span className={`text-[11px] ${muted} shrink-0`}>{d.cardCount} cards</span>
                    </button>
                  ))}
                </div>
              )}
            </Section>

            {/* Notes */}
            <Section title="Notes" icon={<NotebookPen className="w-4 h-4" />} card={card} ink={ink} muted={muted}
              action={
                <button onClick={newNote} className="flex items-center gap-1.5 text-xs font-semibold text-violet-500 hover:text-violet-600">
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              }>
              {notes.length === 0 ? (
                <p className={`text-sm ${muted}`}>No notes for this subject yet.</p>
              ) : (
                <div className="space-y-2">
                  {notes.slice(0, 6).map(n => (
                    <button key={n.id} onClick={() => router.push(`/notes?note=${n.id}`)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl ${isSun ? "bg-slate-50 hover:bg-slate-100" : "bg-white/5 hover:bg-white/10"}`}>
                      <BookOpen className={`w-3.5 h-3.5 shrink-0 ${muted}`} />
                      <span className={`text-sm font-medium truncate ${ink}`}>{n.title || "Untitled"}</span>
                    </button>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* Trials */}
          <div className={`rounded-3xl border ${card} p-5 flex items-center justify-between gap-4`}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isSun ? "bg-violet-100 text-violet-600" : "bg-violet-500/20 text-violet-300"}`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold ${ink}`}>Trial by Fire</h3>
                <p className={`text-xs ${muted}`}>Get tested on {subject.name}{attempts ? ` · ${attempts} attempts` : ""}</p>
              </div>
            </div>
            <button onClick={() => router.push(`/quiz?subject=${subject.id}`)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700">
              Start <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <TravelerHotbar />
    </>
  );
}

function Section({
  title, icon, action, children, card, ink, muted,
}: {
  title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode;
  card: string; ink: string; muted: string;
}) {
  return (
    <div className={`rounded-3xl border ${card} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={`flex items-center gap-2 text-sm font-bold ${ink}`}>
          <span className={muted}>{icon}</span> {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}
