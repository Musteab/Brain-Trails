"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  PenTool,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Loader2,
  Sparkles,
  Check,
  BookOpen,
  Calendar,
  GraduationCap,
  SkipForward,
  Trash2,
  Star,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCardStyles } from "@/hooks/useCardStyles";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/stores";
import TravelerHotbar from "@/components/layout/TravelerHotbar";

// ============================================
// Types
// ============================================

interface OnboardingExam {
  name: string;
  date: string;
  type: string;
}

interface OnboardingSubject {
  name: string;
  code: string;
  emoji: string;
  color: string;
  topics: string[];
  exams: OnboardingExam[];
}

interface OnboardingData {
  semesterName: string;
  subjects: OnboardingSubject[];
}

type Step = "welcome" | "syllabus" | "manual" | "review" | "done";

// ============================================
// Constants (outside component — no render-time randomness)
// ============================================

const SUBJECT_EMOJIS = ["📚", "📐", "⚡", "🧬", "🌍", "💻", "🧠", "🔬", "🎨", "🔮", "📊", "🧪", "🏛️", "🔧", "📝"];
const SUBJECT_COLORS = [
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-blue-500 to-cyan-600",
  "from-rose-500 to-pink-600",
  "from-indigo-500 to-blue-600",
  "from-fuchsia-500 to-pink-600",
  "from-cyan-500 to-teal-600",
];

const EXAM_TYPES = ["exam", "quiz", "assignment", "project", "presentation", "other"];

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

// ============================================
// Helpers
// ============================================

/** Pick a deterministic emoji/color by index so we never call Math.random() during render. */
function emojiByIndex(i: number): string {
  return SUBJECT_EMOJIS[i % SUBJECT_EMOJIS.length];
}
function colorByIndex(i: number): string {
  return SUBJECT_COLORS[i % SUBJECT_COLORS.length];
}

function emptySubject(index: number): OnboardingSubject {
  return {
    name: "",
    code: "",
    emoji: emojiByIndex(index),
    color: colorByIndex(index),
    topics: [""],
    exams: [],
  };
}

// ============================================
// Component
// ============================================

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { awardXp, logActivity } = useGameStore();
  const { isSun, card, title, subtitle, muted, accent } = useCardStyles();

  // Step state
  const [step, setStep] = useState<Step>("welcome");

  // Shared onboarding data (used by both syllabus & manual paths)
  const [data, setData] = useState<OnboardingData>({
    semesterName: "",
    subjects: [],
  });

  // Syllabus upload state
  const [syllabusText, setSyllabusText] = useState("");
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ---- Handlers ----

  const handleSkip = async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);
    await refreshProfile();
    router.push("/");
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSyllabusFile(file);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSyllabusFile(file);
  }, []);

  const handleParseSyllabus = async () => {
    setIsParsing(true);
    setParseError("");

    try {
      let body: Record<string, string>;

      if (syllabusFile) {
        // Read file as base64
        const arrayBuf = await syllabusFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        const ext = syllabusFile.name.split(".").pop()?.toLowerCase();
        const fileType = ext === "pdf" ? "pdf" : "image";

        body = { file_type: fileType, file_data: base64 };
      } else if (syllabusText.trim()) {
        body = { file_type: "text", content: syllabusText.trim() };
      } else {
        setParseError("Please upload a file or paste your syllabus text.");
        setIsParsing(false);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/ai/parse-syllabus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Server returned ${res.status}`);
      }

      const result = await res.json();
      const parsed = result.data;

      // Map parsed data into our onboarding format
      const subjects: OnboardingSubject[] = (parsed.subjects || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: any, i: number) => ({
          name: s.name || "",
          code: s.code || "",
          emoji: s.emoji || emojiByIndex(i),
          color: colorByIndex(i),
          topics: (s.topics || []).length > 0
            ? s.topics.map((t: unknown) => (typeof t === "string" ? t : (t as { name?: string }).name || ""))
            : [""],
          exams: (s.exams || []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (ex: any) => ({
              name: ex.name || "",
              date: ex.date || "",
              type: ex.type || "exam",
            })
          ),
        })
      );

      setData({
        semesterName: parsed.semester || "",
        subjects,
      });
      setStep("review");
    } catch (err) {
      console.error("Parse syllabus error:", err);
      setParseError(
        err instanceof Error
          ? err.message
          : "Failed to parse syllabus. Make sure the Flask backend is running."
      );
    } finally {
      setIsParsing(false);
    }
  };

  // Manual entry helpers
  const updateSubject = (index: number, field: keyof OnboardingSubject, value: string) => {
    setData((prev) => {
      const subjects = [...prev.subjects];
      subjects[index] = { ...subjects[index], [field]: value };
      return { ...prev, subjects };
    });
  };

  const updateTopic = (subjectIdx: number, topicIdx: number, value: string) => {
    setData((prev) => {
      const subjects = [...prev.subjects];
      const topics = [...subjects[subjectIdx].topics];
      topics[topicIdx] = value;
      subjects[subjectIdx] = { ...subjects[subjectIdx], topics };
      return { ...prev, subjects };
    });
  };

  const addTopic = (subjectIdx: number) => {
    setData((prev) => {
      const subjects = [...prev.subjects];
      subjects[subjectIdx] = {
        ...subjects[subjectIdx],
        topics: [...subjects[subjectIdx].topics, ""],
      };
      return { ...prev, subjects };
    });
  };

  const removeTopic = (subjectIdx: number, topicIdx: number) => {
    setData((prev) => {
      const subjects = [...prev.subjects];
      const topics = subjects[subjectIdx].topics.filter((_, i) => i !== topicIdx);
      subjects[subjectIdx] = { ...subjects[subjectIdx], topics: topics.length > 0 ? topics : [""] };
      return { ...prev, subjects };
    });
  };

  const addExam = (subjectIdx: number) => {
    setData((prev) => {
      const subjects = [...prev.subjects];
      subjects[subjectIdx] = {
        ...subjects[subjectIdx],
        exams: [...subjects[subjectIdx].exams, { name: "", date: "", type: "exam" }],
      };
      return { ...prev, subjects };
    });
  };

  const updateExam = (subjectIdx: number, examIdx: number, field: keyof OnboardingExam, value: string) => {
    setData((prev) => {
      const subjects = [...prev.subjects];
      const exams = [...subjects[subjectIdx].exams];
      exams[examIdx] = { ...exams[examIdx], [field]: value };
      subjects[subjectIdx] = { ...subjects[subjectIdx], exams };
      return { ...prev, subjects };
    });
  };

  const removeExam = (subjectIdx: number, examIdx: number) => {
    setData((prev) => {
      const subjects = [...prev.subjects];
      subjects[subjectIdx] = {
        ...subjects[subjectIdx],
        exams: subjects[subjectIdx].exams.filter((_, i) => i !== examIdx),
      };
      return { ...prev, subjects };
    });
  };

  const addSubject = () => {
    setData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, emptySubject(prev.subjects.length)],
    }));
  };

  const removeSubject = (index: number) => {
    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  // Helper: wrap a supabase call with a timeout
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withTimeout = <T,>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> =>
    Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
      ),
    ]);

  // Save everything to Supabase
  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveError("");

    try {
      // 1. Create semester (generate ID client-side to avoid .select().single() hanging)
      const semesterId = crypto.randomUUID();
      console.log("[Onboarding] Step 1: Creating semester...");
      const { error: semErr } = await withTimeout(
        supabase
          .from("semesters")
          .insert({ id: semesterId, user_id: user.id, name: data.semesterName || "My Semester", is_active: true }),
        10000,
        "Create semester"
      );

      if (semErr) throw new Error(`Failed to create semester: ${semErr.message}`);
      console.log("[Onboarding] Semester created:", semesterId);

      // 2. Create subjects
      for (let si = 0; si < data.subjects.length; si++) {
        const sub = data.subjects[si];
        if (!sub.name.trim()) continue;

        const subjectId = crypto.randomUUID();
        console.log(`[Onboarding] Step 2.${si}: Creating subject "${sub.name}"...`);
        const { error: subErr } = await withTimeout(
          supabase
            .from("subjects")
            .insert({
              id: subjectId,
              user_id: user.id,
              semester_id: semesterId,
              name: sub.name.trim(),
              code: sub.code.trim(),
              emoji: sub.emoji,
              color: sub.color,
            }),
          10000,
          `Create subject "${sub.name}"`
        );

        if (subErr) {
          console.error(`[Onboarding] Subject "${sub.name}" failed:`, subErr);
          continue;
        }
        console.log(`[Onboarding] Subject created: ${subjectId}`);

        // 3. Create topics
        const validTopics = sub.topics.filter((t) => typeof t === "string" && t.trim());
        if (validTopics.length > 0) {
          console.log(`[Onboarding] Step 3: Creating ${validTopics.length} topics...`);
          const topicInserts = validTopics.map((t, ti) => ({
            subject_id: subjectId,
            name: t.trim(),
            sort_order: ti,
          }));

          const { error: topErr } = await withTimeout(
            supabase.from("topics").insert(topicInserts),
            10000,
            `Create topics for "${sub.name}"`
          );
          if (topErr) console.error(`[Onboarding] Topics failed:`, topErr);
          else console.log(`[Onboarding] Topics created`);
        }

        // 4. Create exams (skip invalid dates)
        for (const exam of sub.exams) {
          if (!exam.name.trim() || !exam.date) continue;
          const parsedDate = new Date(exam.date);
          if (isNaN(parsedDate.getTime())) continue;

          console.log(`[Onboarding] Step 4: Creating exam "${exam.name}"...`);
          const { error: examErr } = await withTimeout(
            supabase.from("exams").insert({
              subject_id: subjectId,
              name: exam.name.trim(),
              exam_type: exam.type as "exam" | "quiz" | "assignment" | "project" | "presentation" | "other",
              exam_date: parsedDate.toISOString(),
            }),
            10000,
            `Create exam "${exam.name}"`
          );
          if (examErr) console.error(`[Onboarding] Exam failed:`, examErr);
          else console.log(`[Onboarding] Exam created`);
        }
      }

      // 5. Mark onboarding as completed
      console.log("[Onboarding] Step 5: Marking onboarding complete...");
      await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);

      // 6. Award XP
      console.log("[Onboarding] Step 6: Awarding XP...");
      await awardXp(user.id, 50);
      await logActivity(user.id, "quest", 50, {
        type: "onboarding_completed",
        subjects_count: data.subjects.length,
      });

      await refreshProfile();
      console.log("[Onboarding] ✅ Done!");
      setStep("done");
    } catch (err) {
      console.error("[Onboarding] Save error:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // Render helpers for each step
  // ============================================

  const renderWelcome = () => (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="flex flex-col items-center text-center max-w-2xl mx-auto"
    >
      {/* Hero */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 12 }}
        className="mb-8"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/30 mx-auto mb-6">
          <GraduationCap className="w-12 h-12 text-white" />
        </div>
        <h1 className={`text-4xl md:text-5xl font-bold font-[family-name:var(--font-nunito)] mb-4 ${title}`}>
          Welcome, Traveler!
        </h1>
        <p className={`text-lg font-[family-name:var(--font-quicksand)] max-w-md mx-auto ${subtitle}`}>
          Let&apos;s set up your study journey. Tell us about your courses so we can
          build your adventure map.
        </p>
      </motion.div>

      {/* Two path cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4">
        {/* Upload Syllabus */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setStep("syllabus")}
          className={`p-8 rounded-[24px] text-left transition-all border-[3px] ${
            isSun
              ? "bg-white/70 backdrop-blur-[12px] border-emerald-600/40 shadow-xl shadow-amber-300/20 hover:border-violet-500/50"
              : "bg-slate-900/50 backdrop-blur-[12px] border-emerald-400/30 shadow-2xl shadow-black/30 hover:border-violet-400/50"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
            <Upload className="w-7 h-7 text-white" />
          </div>
          <h3 className={`text-xl font-bold font-[family-name:var(--font-nunito)] mb-2 ${title}`}>
            Upload Syllabus
          </h3>
          <p className={`text-sm font-[family-name:var(--font-quicksand)] ${muted}`}>
            Upload a PDF, image, or paste text. Our AI will extract your subjects,
            topics, and exam dates automatically.
          </p>
        </motion.button>

        {/* Manual Entry */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setData((prev) => ({
              ...prev,
              subjects: prev.subjects.length > 0 ? prev.subjects : [emptySubject(0)],
            }));
            setStep("manual");
          }}
          className={`p-8 rounded-[24px] text-left transition-all border-[3px] ${
            isSun
              ? "bg-white/70 backdrop-blur-[12px] border-emerald-600/40 shadow-xl shadow-amber-300/20 hover:border-violet-500/50"
              : "bg-slate-900/50 backdrop-blur-[12px] border-emerald-400/30 shadow-2xl shadow-black/30 hover:border-violet-400/50"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
            <PenTool className="w-7 h-7 text-white" />
          </div>
          <h3 className={`text-xl font-bold font-[family-name:var(--font-nunito)] mb-2 ${title}`}>
            Manual Entry
          </h3>
          <p className={`text-sm font-[family-name:var(--font-quicksand)] ${muted}`}>
            Add your subjects, topics, and exams by hand. Great if you already know
            your schedule.
          </p>
        </motion.button>
      </div>

      {/* Skip */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={handleSkip}
        className={`mt-8 flex items-center gap-2 text-sm font-medium transition-colors ${
          isSun ? "text-slate-400 hover:text-slate-600" : "text-slate-500 hover:text-slate-300"
        }`}
      >
        <SkipForward className="w-4 h-4" />
        Skip for now
      </motion.button>
    </motion.div>
  );

  const renderSyllabus = () => (
    <motion.div
      key="syllabus"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-2xl mx-auto w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setStep("welcome")}
          className={`flex items-center gap-2 text-sm font-medium ${muted} hover:${accent}`}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </motion.button>
        <button onClick={handleSkip} className={`text-sm ${muted} hover:underline`}>
          Skip for now
        </button>
      </div>

      <h2 className={`text-3xl font-bold font-[family-name:var(--font-nunito)] mb-2 ${title}`}>
        Upload Your Syllabus
      </h2>
      <p className={`mb-8 font-[family-name:var(--font-quicksand)] ${subtitle}`}>
        Upload a file or paste your syllabus text. Our AI familiar will extract everything for you.
      </p>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative p-12 rounded-[24px] border-[3px] border-dashed cursor-pointer transition-all text-center ${
          isDragging
            ? isSun
              ? "border-violet-500 bg-violet-50/50"
              : "border-violet-400 bg-violet-500/10"
            : syllabusFile
            ? isSun
              ? "border-emerald-500/50 bg-emerald-50/30"
              : "border-emerald-400/30 bg-emerald-500/10"
            : isSun
            ? "border-slate-300/60 bg-white/30 hover:border-violet-400/50 hover:bg-violet-50/20"
            : "border-white/20 bg-white/5 hover:border-violet-400/30 hover:bg-violet-500/5"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {syllabusFile ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <FileText className="w-8 h-8 text-emerald-500" />
            </div>
            <p className={`font-bold font-[family-name:var(--font-nunito)] ${title}`}>
              {syllabusFile.name}
            </p>
            <p className={`text-sm ${muted}`}>
              {(syllabusFile.size / 1024).toFixed(1)} KB
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSyllabusFile(null);
              }}
              className="text-sm text-red-500 hover:text-red-400 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              isSun ? "bg-violet-100" : "bg-violet-500/20"
            }`}>
              <Upload className={`w-8 h-8 ${isSun ? "text-violet-500" : "text-violet-400"}`} />
            </div>
            <p className={`font-bold font-[family-name:var(--font-nunito)] ${title}`}>
              Drop your syllabus here
            </p>
            <p className={`text-sm ${muted}`}>
              PDF, image, or text file — or click to browse
            </p>
          </div>
        )}
      </div>

      {/* OR divider */}
      <div className="flex items-center gap-4 my-6">
        <div className={`flex-1 h-px ${isSun ? "bg-slate-200" : "bg-white/10"}`} />
        <span className={`text-sm font-medium ${muted}`}>or paste text</span>
        <div className={`flex-1 h-px ${isSun ? "bg-slate-200" : "bg-white/10"}`} />
      </div>

      {/* Text paste area */}
      <textarea
        value={syllabusText}
        onChange={(e) => setSyllabusText(e.target.value)}
        placeholder="Paste your syllabus content here..."
        rows={6}
        className={`w-full p-4 rounded-2xl border-2 resize-none outline-none transition-colors font-[family-name:var(--font-quicksand)] text-sm ${
          isSun
            ? "bg-white/60 border-slate-200 focus:border-violet-400 text-slate-800 placeholder:text-slate-400"
            : "bg-white/5 border-white/10 focus:border-violet-500 text-white placeholder:text-slate-500"
        }`}
      />

      {/* Error */}
      {parseError && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-sm text-red-500 font-medium"
        >
          {parseError}
        </motion.p>
      )}

      {/* Parse button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleParseSyllabus}
        disabled={isParsing || (!syllabusFile && !syllabusText.trim())}
        className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold font-[family-name:var(--font-nunito)] text-lg shadow-lg shadow-purple-500/30 disabled:opacity-40 flex items-center justify-center gap-3"
      >
        {isParsing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Parsing with AI...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Parse Syllabus
          </>
        )}
      </motion.button>
    </motion.div>
  );

  const renderManual = () => (
    <motion.div
      key="manual"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-3xl mx-auto w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setStep("welcome")}
          className={`flex items-center gap-2 text-sm font-medium ${muted}`}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </motion.button>
        <button onClick={handleSkip} className={`text-sm ${muted} hover:underline`}>
          Skip for now
        </button>
      </div>

      <h2 className={`text-3xl font-bold font-[family-name:var(--font-nunito)] mb-2 ${title}`}>
        Set Up Your Courses
      </h2>
      <p className={`mb-6 font-[family-name:var(--font-quicksand)] ${subtitle}`}>
        Add your semester name, subjects, topics, and any upcoming exams.
      </p>

      {/* Semester name */}
      <div className="mb-8">
        <label className={`block text-sm font-bold mb-2 ${title}`}>
          Semester Name
        </label>
        <input
          type="text"
          value={data.semesterName}
          onChange={(e) => setData((prev) => ({ ...prev, semesterName: e.target.value }))}
          placeholder='e.g. "Fall 2026", "Year 2 Sem 1"'
          className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-colors font-[family-name:var(--font-quicksand)] ${
            isSun
              ? "bg-white/60 border-slate-200 focus:border-violet-400 text-slate-800 placeholder:text-slate-400"
              : "bg-white/5 border-white/10 focus:border-violet-500 text-white placeholder:text-slate-500"
          }`}
        />
      </div>

      {/* Subjects */}
      <div className="space-y-6">
        {data.subjects.map((subject, si) => (
          <motion.div
            key={si}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-[24px] border-[3px] ${card}`}
          >
            {/* Subject header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{subject.emoji}</span>
                <h3 className={`text-lg font-bold font-[family-name:var(--font-nunito)] ${title}`}>
                  Subject {si + 1}
                </h3>
              </div>
              {data.subjects.length > 1 && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeSubject(si)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
            </div>

            {/* Name & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                value={subject.name}
                onChange={(e) => updateSubject(si, "name", e.target.value)}
                placeholder="Subject name (e.g. Physics 201)"
                className={`px-3 py-2.5 rounded-xl border-2 outline-none text-sm transition-colors ${
                  isSun
                    ? "bg-white/50 border-slate-200 focus:border-violet-400 text-slate-800 placeholder:text-slate-400"
                    : "bg-white/5 border-white/10 focus:border-violet-500 text-white placeholder:text-slate-500"
                }`}
              />
              <input
                type="text"
                value={subject.code}
                onChange={(e) => updateSubject(si, "code", e.target.value)}
                placeholder="Code (e.g. PHYS201)"
                className={`px-3 py-2.5 rounded-xl border-2 outline-none text-sm transition-colors ${
                  isSun
                    ? "bg-white/50 border-slate-200 focus:border-violet-400 text-slate-800 placeholder:text-slate-400"
                    : "bg-white/5 border-white/10 focus:border-violet-500 text-white placeholder:text-slate-500"
                }`}
              />
            </div>

            {/* Emoji & Color pickers */}
            <div className="mb-4">
              <label className={`block text-xs font-bold mb-2 ${muted}`}>
                Emoji & Color
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {SUBJECT_EMOJIS.map((em) => (
                  <button
                    key={em}
                    onClick={() => updateSubject(si, "emoji", em)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                      subject.emoji === em
                        ? "ring-2 ring-violet-500 scale-110"
                        : isSun
                        ? "hover:bg-slate-100"
                        : "hover:bg-white/10"
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECT_COLORS.map((col) => (
                  <button
                    key={col}
                    onClick={() => updateSubject(si, "color", col)}
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${col} transition-all ${
                      subject.color === col ? "ring-2 ring-white scale-110 shadow-lg" : "opacity-70 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Topics */}
            <div className="mb-4">
              <label className={`block text-xs font-bold mb-2 ${muted}`}>
                <BookOpen className="w-3 h-3 inline mr-1" />
                Topics
              </label>
              <div className="space-y-2">
                {subject.topics.map((topic, ti) => (
                  <div key={ti} className="flex gap-2">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => updateTopic(si, ti, e.target.value)}
                      placeholder={`Topic ${ti + 1}`}
                      className={`flex-1 px-3 py-2 rounded-xl border-2 outline-none text-sm transition-colors ${
                        isSun
                          ? "bg-white/50 border-slate-200 focus:border-violet-400 text-slate-800 placeholder:text-slate-400"
                          : "bg-white/5 border-white/10 focus:border-violet-500 text-white placeholder:text-slate-500"
                      }`}
                    />
                    {subject.topics.length > 1 && (
                      <button
                        onClick={() => removeTopic(si, ti)}
                        className={`p-2 rounded-lg transition-colors ${
                          isSun ? "text-slate-400 hover:text-red-500 hover:bg-red-50" : "text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => addTopic(si)}
                className={`mt-2 text-xs flex items-center gap-1 font-medium transition-colors ${accent}`}
              >
                <Plus className="w-3 h-3" /> Add topic
              </button>
            </div>

            {/* Exams */}
            <div>
              <label className={`block text-xs font-bold mb-2 ${muted}`}>
                <Calendar className="w-3 h-3 inline mr-1" />
                Exams & Deadlines
              </label>
              <div className="space-y-2">
                {subject.exams.map((exam, ei) => (
                  <div key={ei} className="flex flex-wrap gap-2 items-center">
                    <input
                      type="text"
                      value={exam.name}
                      onChange={(e) => updateExam(si, ei, "name", e.target.value)}
                      placeholder="Exam name"
                      className={`flex-1 min-w-[120px] px-3 py-2 rounded-xl border-2 outline-none text-sm transition-colors ${
                        isSun
                          ? "bg-white/50 border-slate-200 focus:border-violet-400 text-slate-800 placeholder:text-slate-400"
                          : "bg-white/5 border-white/10 focus:border-violet-500 text-white placeholder:text-slate-500"
                      }`}
                    />
                    <input
                      type="date"
                      value={exam.date}
                      onChange={(e) => updateExam(si, ei, "date", e.target.value)}
                      className={`px-3 py-2 rounded-xl border-2 outline-none text-sm transition-colors ${
                        isSun
                          ? "bg-white/50 border-slate-200 focus:border-violet-400 text-slate-800"
                          : "bg-white/5 border-white/10 focus:border-violet-500 text-white [color-scheme:dark]"
                      }`}
                    />
                    <select
                      value={exam.type}
                      onChange={(e) => updateExam(si, ei, "type", e.target.value)}
                      className={`px-3 py-2 rounded-xl border-2 outline-none text-sm transition-colors ${
                        isSun
                          ? "bg-white/50 border-slate-200 text-slate-800"
                          : "bg-white/5 border-white/10 text-white [color-scheme:dark]"
                      }`}
                    >
                      {EXAM_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeExam(si, ei)}
                      className={`p-2 rounded-lg transition-colors ${
                        isSun ? "text-slate-400 hover:text-red-500 hover:bg-red-50" : "text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addExam(si)}
                className={`mt-2 text-xs flex items-center gap-1 font-medium transition-colors ${accent}`}
              >
                <Plus className="w-3 h-3" /> Add exam
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add subject button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={addSubject}
        className={`w-full mt-4 py-4 rounded-2xl border-[3px] border-dashed flex items-center justify-center gap-2 font-bold font-[family-name:var(--font-nunito)] transition-colors ${
          isSun
            ? "border-emerald-500/30 text-emerald-600 hover:bg-emerald-50/50"
            : "border-emerald-400/20 text-emerald-400 hover:bg-emerald-500/5"
        }`}
      >
        <Plus className="w-5 h-5" />
        Add Another Subject
      </motion.button>

      {/* Continue to review */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setStep("review")}
        disabled={data.subjects.every((s) => !s.name.trim())}
        className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold font-[family-name:var(--font-nunito)] text-lg shadow-lg shadow-purple-500/30 disabled:opacity-40 flex items-center justify-center gap-3"
      >
        Review & Confirm
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );

  const renderReview = () => {
    const validSubjects = data.subjects.filter((s) => s.name.trim());
    const totalTopics = validSubjects.reduce(
      (sum, s) => sum + s.topics.filter((t) => typeof t === "string" && t.trim()).length,
      0
    );
    const totalExams = validSubjects.reduce((sum, s) => sum + s.exams.filter((e) => e.name.trim()).length, 0);

    return (
      <motion.div
        key="review"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="max-w-3xl mx-auto w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep(data.subjects.length > 0 ? "manual" : "welcome")}
            className={`flex items-center gap-2 text-sm font-medium ${muted}`}
          >
            <ChevronLeft className="w-4 h-4" />
            Edit
          </motion.button>
          <button onClick={handleSkip} className={`text-sm ${muted} hover:underline`}>
            Skip for now
          </button>
        </div>

        <h2 className={`text-3xl font-bold font-[family-name:var(--font-nunito)] mb-2 ${title}`}>
          Review & Confirm
        </h2>
        <p className={`mb-6 font-[family-name:var(--font-quicksand)] ${subtitle}`}>
          Here&apos;s your study setup. You can go back to edit, or confirm to begin your adventure.
        </p>

        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Subjects", value: validSubjects.length, icon: <GraduationCap className="w-5 h-5" /> },
            { label: "Topics", value: totalTopics, icon: <BookOpen className="w-5 h-5" /> },
            { label: "Exams", value: totalExams, icon: <Calendar className="w-5 h-5" /> },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`p-4 rounded-2xl text-center border-2 ${
                isSun
                  ? "bg-white/50 border-emerald-500/20"
                  : "bg-white/5 border-emerald-400/20"
              }`}
            >
              <div className={`flex justify-center mb-2 ${accent}`}>{stat.icon}</div>
              <p className={`text-2xl font-bold font-[family-name:var(--font-nunito)] ${title}`}>
                {stat.value}
              </p>
              <p className={`text-xs ${muted}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Semester */}
        <div className="mb-6">
          <label className={`block text-xs font-bold mb-2 ${muted}`}>Semester</label>
          <input
            type="text"
            value={data.semesterName}
            onChange={(e) => setData((prev) => ({ ...prev, semesterName: e.target.value }))}
            placeholder="My Semester"
            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-colors font-[family-name:var(--font-quicksand)] ${
              isSun
                ? "bg-white/60 border-slate-200 focus:border-violet-400 text-slate-800 placeholder:text-slate-400"
                : "bg-white/5 border-white/10 focus:border-violet-500 text-white placeholder:text-slate-500"
            }`}
          />
        </div>

        {/* Subject cards */}
        <div className="space-y-4">
          {validSubjects.map((subject, si) => (
            <motion.div
              key={si}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.05 }}
              className={`p-5 rounded-[20px] border-[3px] ${card}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${subject.color} flex items-center justify-center text-lg`}>
                  {subject.emoji}
                </div>
                <div>
                  <h3 className={`font-bold font-[family-name:var(--font-nunito)] ${title}`}>
                    {subject.name}
                  </h3>
                  {subject.code && (
                    <span className={`text-xs ${muted}`}>{subject.code}</span>
                  )}
                </div>
              </div>

              {/* Topics */}
              {subject.topics.filter((t) => t.trim()).length > 0 && (
                <div className="mb-3">
                  <p className={`text-xs font-bold mb-1.5 ${muted}`}>Topics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {subject.topics
                      .filter((t) => t.trim())
                      .map((topic, ti) => (
                        <span
                          key={ti}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            isSun
                              ? "bg-violet-100 text-violet-700"
                              : "bg-violet-500/20 text-violet-300"
                          }`}
                        >
                          {topic}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Exams */}
              {subject.exams.filter((e) => e.name.trim()).length > 0 && (
                <div>
                  <p className={`text-xs font-bold mb-1.5 ${muted}`}>Exams</p>
                  <div className="space-y-1">
                    {subject.exams
                      .filter((e) => e.name.trim())
                      .map((exam, ei) => (
                        <div
                          key={ei}
                          className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${
                            isSun ? "bg-amber-50 text-amber-700" : "bg-amber-500/10 text-amber-300"
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          <span className="font-medium">{exam.name}</span>
                          {exam.date && (
                            <span className="opacity-70">
                              {new Date(exam.date + "T00:00:00").toLocaleDateString()}
                            </span>
                          )}
                          <span className={`ml-auto capitalize text-[10px] px-1.5 py-0.5 rounded ${
                            isSun ? "bg-slate-100 text-slate-500" : "bg-white/10 text-slate-400"
                          }`}>
                            {exam.type}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Error */}
        {saveError && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-red-500 font-medium"
          >
            {saveError}
          </motion.p>
        )}

        {/* Confirm button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving || validSubjects.length === 0}
          className="w-full mt-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold font-[family-name:var(--font-nunito)] text-lg shadow-lg shadow-emerald-500/30 disabled:opacity-40 flex items-center justify-center gap-3"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving your journey...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Confirm & Begin Adventure
            </>
          )}
        </motion.button>
      </motion.div>
    );
  };

  const renderDone = () => (
    <motion.div
      key="done"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center max-w-lg mx-auto"
    >
      {/* Celebration */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.2 }}
        className="mb-8"
      >
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
            <Star className="w-14 h-14 text-white" fill="white" />
          </div>
          {/* Sparkle particles */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.2, 0],
                x: [0, (i % 2 === 0 ? 1 : -1) * (30 + i * 10)],
                y: [0, -(20 + i * 8)],
              }}
              transition={{
                duration: 1.5,
                delay: 0.5 + i * 0.15,
                ease: "easeOut",
              }}
              className="absolute top-1/2 left-1/2 w-3 h-3"
            >
              <Sparkles className={`w-3 h-3 ${
                i % 3 === 0 ? "text-yellow-400" : i % 3 === 1 ? "text-violet-400" : "text-emerald-400"
              }`} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`text-4xl md:text-5xl font-bold font-[family-name:var(--font-nunito)] mb-4 ${title}`}
      >
        Quest Complete!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={`text-lg font-[family-name:var(--font-quicksand)] mb-2 ${subtitle}`}
      >
        Your study journey has been set up. Time to hit the trails!
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className={`flex items-center gap-2 mb-8 px-4 py-2 rounded-full ${
          isSun ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-300"
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-bold">+50 XP earned!</span>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/")}
        className="px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold font-[family-name:var(--font-nunito)] text-lg shadow-lg shadow-purple-500/30 flex items-center gap-3"
      >
        Enter Base Camp
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );

  // ============================================
  // Main render
  // ============================================

  return (
    <main className="relative min-h-screen">
      {/* Background */}
      <div
        className={`fixed inset-0 ${
          isSun
            ? "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
            : "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"
        }`}
      />

      {/* Step indicator */}
      {step !== "done" && (
        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            {(["welcome", "syllabus|manual", "review"] as const).map((s, i) => {
              const currentIdx =
                step === "welcome" ? 0 : step === "syllabus" || step === "manual" ? 1 : 2;
              const isActive = i <= currentIdx;

              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isActive
                        ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30"
                        : isSun
                        ? "bg-slate-200 text-slate-400"
                        : "bg-white/10 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                  {i < 2 && (
                    <div
                      className={`w-12 h-0.5 rounded-full transition-colors ${
                        i < currentIdx
                          ? "bg-violet-500"
                          : isSun
                          ? "bg-slate-200"
                          : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 px-6 py-8 pb-32">
        <AnimatePresence mode="wait">
          {step === "welcome" && renderWelcome()}
          {step === "syllabus" && renderSyllabus()}
          {step === "manual" && renderManual()}
          {step === "review" && renderReview()}
          {step === "done" && renderDone()}
        </AnimatePresence>
      </div>

      <TravelerHotbar />
    </main>
  );
}
