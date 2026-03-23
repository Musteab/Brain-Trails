"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, FileText, Trash2, Loader2, Sparkles } from "lucide-react";
import SpellbookEditor, { type SpellbookEditorRef } from "@/components/notes/SpellbookEditor";
import AIFamiliar from "@/components/notes/AIFamiliar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useUIStore } from "@/stores";

interface Note {
  id: string;
  title: string;
  updated_at: string;
}

/**
 * Subject-Specific Spellbook (Notes)
 * Shows only notes belonging to this subject
 */
export default function SubjectSpellbookPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;

  const { user } = useAuth();
  const { theme } = useTheme();
  const { addToast } = useUIStore();
  const isSun = theme === "sun";

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("Untitled Note");
  const [leftContent, setLeftContent] = useState({ html: "", text: "" });
  const [rightContent, setRightContent] = useState({ html: "", text: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [isAIOpen, setIsAIOpen] = useState(false);

  const leftEditorRef = useRef<SpellbookEditorRef>(null);
  const rightEditorRef = useRef<SpellbookEditorRef>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for debounced save
  const leftContentRef = useRef(leftContent);
  const rightContentRef = useRef(rightContent);
  const noteTitleRef = useRef(noteTitle);
  const selectedNoteIdRef = useRef(selectedNoteId);

  useEffect(() => { leftContentRef.current = leftContent; }, [leftContent]);
  useEffect(() => { rightContentRef.current = rightContent; }, [rightContent]);
  useEffect(() => { noteTitleRef.current = noteTitle; }, [noteTitle]);
  useEffect(() => { selectedNoteIdRef.current = selectedNoteId; }, [selectedNoteId]);

  // Fetch subject info and notes
  useEffect(() => {
    if (!user || !subjectId) return;

    const fetchData = async () => {
      // Get subject name
      const { data: subData } = await (supabase.from("subjects") as any)
        .select("name, emoji")
        .eq("id", subjectId)
        .single();

      if (subData) {
        setSubjectName(`${subData.emoji || "📚"} ${subData.name}`);
      }

      // Get notes for this subject
      const { data: notesData } = await (supabase.from("notes") as any)
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .eq("subject_id", subjectId)
        .order("updated_at", { ascending: false });

      setNotes(notesData || []);
      setIsLoading(false);
    };

    fetchData();
  }, [user, subjectId]);

  // Load note content
  useEffect(() => {
    if (!selectedNoteId) return;

    const fetchNote = async () => {
      const { data, error } = await (supabase.from("notes") as any)
        .select("content_html, title")
        .eq("id", selectedNoteId)
        .single();

      if (error) return;

      setNoteTitle(data.title || "Untitled Note");

      try {
        const content = data.content_html ? JSON.parse(data.content_html) : { left: "", right: "" };
        if (content.left && leftEditorRef.current) {
          leftEditorRef.current.insertContent(content.left);
          setLeftContent({ html: content.left, text: "" });
        }
        if (content.right && rightEditorRef.current) {
          rightEditorRef.current.insertContent(content.right);
          setRightContent({ html: content.right, text: "" });
        }
      } catch {
        // Legacy format
        if (data.content_html && leftEditorRef.current) {
          leftEditorRef.current.insertContent(data.content_html);
          setLeftContent({ html: data.content_html, text: "" });
        }
      }
    };

    fetchNote();
  }, [selectedNoteId]);

  // Auto-save
  const triggerAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      const noteId = selectedNoteIdRef.current;
      if (!noteId) return;

      setIsSaving(true);
      const contentJson = JSON.stringify({
        left: leftContentRef.current.html,
        right: rightContentRef.current.html,
      });

      await (supabase.from("notes") as any)
        .update({
          title: noteTitleRef.current,
          content_html: contentJson,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteId);

      setIsSaving(false);
    }, 1500);
  }, []);

  // Create new note
  const handleCreateNote = async () => {
    if (!user) return;

    const { data, error } = await (supabase.from("notes") as any)
      .insert({
        user_id: user.id,
        subject_id: subjectId,
        title: "Untitled Note",
        folder: "root",
        content_html: JSON.stringify({ left: "", right: "" }),
      })
      .select("id, title, updated_at")
      .single();

    if (error) {
      addToast("Failed to create note", "error");
      return;
    }

    setNotes([data, ...notes]);
    setSelectedNoteId(data.id);
    setNoteTitle("Untitled Note");
    leftEditorRef.current?.editor?.commands.clearContent();
    rightEditorRef.current?.editor?.commands.clearContent();
    setLeftContent({ html: "", text: "" });
    setRightContent({ html: "", text: "" });
    addToast("New note created!", "success");
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Delete this note? This cannot be undone.")) return;

    await (supabase.from("notes") as any).delete().eq("id", noteId);
    setNotes(notes.filter(n => n.id !== noteId));

    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
      leftEditorRef.current?.editor?.commands.clearContent();
      rightEditorRef.current?.editor?.commands.clearContent();
    }

    addToast("Note deleted", "success");
  };

  const glassCard = isSun
    ? "bg-white/40 border border-white/60 backdrop-blur-xl"
    : "bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className={`${glassCard} px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/arcane-archive/${subjectId}`)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
              isSun ? "hover:bg-white/50 text-slate-600" : "hover:bg-white/10 text-slate-400"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div>
            <h1 className={`text-lg font-bold ${isSun ? "text-slate-800" : "text-white"}`}>
              {subjectName} - Spellbook
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </div>
          )}
          <button
            onClick={handleCreateNote}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Notes Sidebar */}
        <aside className={`w-64 ${glassCard} border-r overflow-y-auto`}>
          <div className="p-4">
            <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isSun ? "text-slate-500" : "text-slate-400"}`}>
              Notes ({notes.length})
            </h2>
            {notes.length === 0 ? (
              <p className={`text-sm ${isSun ? "text-slate-400" : "text-slate-500"}`}>
                No notes yet. Create your first note!
              </p>
            ) : (
              <div className="space-y-2">
                {notes.map(note => (
                  <div
                    key={note.id}
                    className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                      selectedNoteId === note.id
                        ? (isSun ? "bg-violet-100 border-violet-300" : "bg-violet-500/20 border-violet-500/30")
                        : (isSun ? "hover:bg-white/60" : "hover:bg-white/10")
                    } border ${selectedNoteId === note.id ? "" : "border-transparent"}`}
                    onClick={() => setSelectedNoteId(note.id)}
                  >
                    <div className="flex items-start gap-2">
                      <FileText className={`w-4 h-4 mt-0.5 ${isSun ? "text-violet-500" : "text-violet-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSun ? "text-slate-700" : "text-white"}`}>
                          {note.title}
                        </p>
                        <p className={`text-xs ${isSun ? "text-slate-400" : "text-slate-500"}`}>
                          {new Date(note.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Editor Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedNoteId ? (
            <>
              {/* Title Input */}
              <div className={`px-6 py-3 border-b ${isSun ? "border-slate-200/50" : "border-white/[0.06]"}`}>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => {
                    setNoteTitle(e.target.value);
                    triggerAutoSave();
                  }}
                  className={`w-full text-2xl font-bold bg-transparent outline-none ${
                    isSun ? "text-slate-800 placeholder:text-slate-300" : "text-white placeholder:text-slate-600"
                  }`}
                  placeholder="Note title..."
                />
              </div>

              {/* Dual Pane Editor */}
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6">
                  <SpellbookEditor
                    ref={leftEditorRef}
                    initialContent=""
                    onContentChange={(html, text) => {
                      setLeftContent({ html, text });
                      triggerAutoSave();
                    }}
                  />
                </div>
                <div className={`w-px ${isSun ? "bg-slate-200/50" : "bg-white/[0.06]"}`} />
                <div className="flex-1 overflow-y-auto p-6">
                  <SpellbookEditor
                    ref={rightEditorRef}
                    initialContent=""
                    onContentChange={(html, text) => {
                      setRightContent({ html, text });
                      triggerAutoSave();
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className={`w-16 h-16 mx-auto mb-4 ${isSun ? "text-slate-300" : "text-slate-600"}`} />
                <h2 className={`text-xl font-bold mb-2 ${isSun ? "text-slate-600" : "text-slate-400"}`}>
                  Select a note or create a new one
                </h2>
                <button
                  onClick={handleCreateNote}
                  className="mt-4 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Create Note
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* AI Familiar */}
      <AIFamiliar
        isOpen={isAIOpen}
        onToggle={() => setIsAIOpen(!isAIOpen)}
        noteContent={`${leftContent.text}\n\n${rightContent.text}`}
      />
    </div>
  );
}
