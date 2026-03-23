"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, FileText, Trash2, Loader2, Sparkles, BookOpen, Link2 } from "lucide-react";
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
  subject_id?: string | null;
}

/**
 * Subject-Specific Spellbook (Notes)
 * Shows only notes belonging to this subject
 * Also allows linking existing ungrouped notes to this subject
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
  const [ungroupedNotes, setUngroupedNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("Untitled Note");
  const [leftContent, setLeftContent] = useState({ html: "", text: "" });
  const [rightContent, setRightContent] = useState({ html: "", text: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [dbHasSubjectId, setDbHasSubjectId] = useState(true);

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

      // Try to get notes for this subject (with subject_id filter)
      // If the column doesn't exist, this will fail with 400 - we handle gracefully
      let notesData: Note[] | null = null;
      let ungrouped: Note[] = [];
      
      try {
        const { data, error } = await (supabase.from("notes") as any)
          .select("id, title, updated_at, subject_id")
          .eq("user_id", user.id)
          .eq("subject_id", subjectId)
          .order("updated_at", { ascending: false });
        
        if (error?.code === "42703" || error?.message?.includes("subject_id")) {
          // Column doesn't exist - migration not run
          setDbHasSubjectId(false);
          // Fetch all notes instead
          const { data: allNotes } = await (supabase.from("notes") as any)
            .select("id, title, updated_at")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false });
          notesData = allNotes || [];
        } else {
          notesData = data || [];
          
          // Also fetch ungrouped notes (no subject_id)
          const { data: ungrpData } = await (supabase.from("notes") as any)
            .select("id, title, updated_at, subject_id")
            .eq("user_id", user.id)
            .is("subject_id", null)
            .order("updated_at", { ascending: false });
          ungrouped = ungrpData || [];
        }
      } catch {
        // Fallback: fetch all notes
        setDbHasSubjectId(false);
        const { data: allNotes } = await (supabase.from("notes") as any)
          .select("id, title, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });
        notesData = allNotes || [];
      }

      setNotes(notesData || []);
      setUngroupedNotes(ungrouped);
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

    // Build insert payload - only include subject_id if column exists
    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      title: "Untitled Note",
      folder: "root",
      content_html: JSON.stringify({ left: "", right: "" }),
    };
    
    if (dbHasSubjectId) {
      insertPayload.subject_id = subjectId;
    }

    const { data, error } = await (supabase.from("notes") as any)
      .insert(insertPayload)
      .select("id, title, updated_at")
      .single();

    if (error) {
      addToast("Failed to create note. Run the database migration first.", "error");
      console.error("Create note error:", error);
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

  // Link an existing ungrouped note to this subject
  const handleLinkNote = async (noteId: string) => {
    if (!dbHasSubjectId) {
      addToast("Run the database migration to enable note linking", "error");
      return;
    }

    const { error } = await (supabase.from("notes") as any)
      .update({ subject_id: subjectId })
      .eq("id", noteId);

    if (error) {
      addToast("Failed to link note", "error");
      return;
    }

    // Move from ungrouped to grouped
    const linkedNote = ungroupedNotes.find(n => n.id === noteId);
    if (linkedNote) {
      setNotes([linkedNote, ...notes]);
      setUngroupedNotes(ungroupedNotes.filter(n => n.id !== noteId));
    }
    setShowLinkModal(false);
    addToast("Note linked to subject!", "success");
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
      {/* Header with Wizard Theme */}
      <header className={`px-6 py-4 flex items-center justify-between border-b-2 ${
        isSun 
          ? "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-200" 
          : "bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 border-amber-900/30"
      }`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/arcane-archive/${subjectId}`)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-medium ${
              isSun 
                ? "hover:bg-amber-100 text-amber-800" 
                : "hover:bg-stone-800 text-amber-300"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Archive</span>
          </button>
          <div className={`h-6 w-px ${isSun ? "bg-amber-200" : "bg-stone-700"}`} />
          <div>
            <h1 className={`text-lg font-bold font-[family-name:var(--font-cinzel)] ${
              isSun ? "text-amber-900" : "text-amber-200"
            }`}>
              {subjectName} - Grimoire Collection
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSaving && (
            <div className={`flex items-center gap-2 text-sm ${isSun ? "text-amber-600" : "text-amber-400"}`}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-medium">Inscribing...</span>
            </div>
          )}
          {!dbHasSubjectId && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              isSun ? "bg-amber-200 text-amber-800" : "bg-amber-500/20 text-amber-300"
            }`}>
              ⚠️ Run migration
            </div>
          )}
          {ungroupedNotes.length > 0 && (
            <button
              onClick={() => setShowLinkModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                isSun 
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
                  : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
              }`}
            >
              <Link2 className="w-4 h-4" />
              Link Tome ({ungroupedNotes.length})
            </button>
          )}
          <button
            onClick={handleCreateNote}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg ${
              isSun 
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600" 
                : "bg-gradient-to-r from-amber-600 to-orange-700 text-white hover:from-amber-700 hover:to-orange-800"
            }`}
          >
            <Plus className="w-5 h-5" />
            New Tome
          </button>
        </div>
      </header>

      {/* Link Existing Note Modal */}
      <AnimatePresence>
        {showLinkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
            onClick={() => setShowLinkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md mx-4 rounded-2xl overflow-hidden border-2 ${
                isSun 
                  ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300" 
                  : "bg-gradient-to-br from-stone-800 to-stone-900 border-amber-900/40"
              }`}
              style={{
                boxShadow: isSun 
                  ? "0 20px 60px rgba(139, 92, 46, 0.3)" 
                  : "0 20px 60px rgba(0, 0, 0, 0.6)"
              }}
            >
              <div className={`p-6 border-b-2 ${
                isSun ? "bg-amber-100/50 border-amber-200" : "bg-stone-900 border-amber-900/40"
              }`}>
                <h3 className={`text-lg font-bold font-[family-name:var(--font-cinzel)] ${
                  isSun ? "text-amber-900" : "text-amber-200"
                }`}>
                  🔗 Link Tome to {subjectName}
                </h3>
                <p className={`text-sm mt-1 ${isSun ? "text-amber-700/80" : "text-amber-300/70"}`}>
                  Choose an ungrouped tome to add to this collection
                </p>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  {ungroupedNotes.map(note => (
                    <button
                      key={note.id}
                      onClick={() => handleLinkNote(note.id)}
                      className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 border-2 ${
                        isSun 
                          ? "hover:bg-amber-100 hover:border-amber-300 text-amber-900 border-transparent" 
                          : "hover:bg-stone-700 hover:border-amber-800/50 text-white border-transparent"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        isSun ? "bg-amber-200" : "bg-amber-900/40"
                      }`}>
                        <BookOpen className={`w-5 h-5 ${isSun ? "text-amber-700" : "text-amber-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{note.title}</p>
                        <p className={`text-xs ${isSun ? "text-amber-600/70" : "text-amber-400/60"}`}>
                          Updated {new Date(note.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Link2 className={`w-4 h-4 ${isSun ? "text-amber-500" : "text-amber-500/70"}`} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className={`p-4 border-t-2 ${
                isSun ? "bg-amber-50 border-amber-200" : "bg-stone-900/50 border-amber-900/40"
              }`}>
                <button
                  onClick={() => setShowLinkModal(false)}
                  className={`w-full py-2.5 rounded-xl font-bold transition-all ${
                    isSun 
                      ? "bg-amber-200 text-amber-800 hover:bg-amber-300" 
                      : "bg-stone-700 text-amber-200 hover:bg-stone-600"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Grimoire Shelf Sidebar */}
        <aside 
          className={`w-72 overflow-y-auto relative ${
            isSun 
              ? "bg-gradient-to-b from-amber-900/90 via-amber-800/85 to-amber-900/90" 
              : "bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900"
          }`}
          style={{
            boxShadow: isSun 
              ? "inset -4px 0 20px rgba(0,0,0,0.3), inset 0 4px 10px rgba(0,0,0,0.2)" 
              : "inset -4px 0 20px rgba(0,0,0,0.5), inset 0 4px 10px rgba(0,0,0,0.3)"
          }}
        >
          {/* Wood grain texture overlay */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(0,0,0,0.1) 2px,
                rgba(0,0,0,0.1) 4px
              ), repeating-linear-gradient(
                0deg,
                transparent,
                transparent 20px,
                rgba(139,90,43,0.15) 20px,
                rgba(139,90,43,0.15) 22px
              )`
            }}
          />
          
          {/* Shelf Header */}
          <div className={`sticky top-0 z-10 p-4 ${
            isSun ? "bg-amber-900/95" : "bg-stone-900/95"
          } backdrop-blur-sm border-b ${isSun ? "border-amber-700/50" : "border-stone-700/50"}`}>
            <h2 className={`text-sm font-bold uppercase tracking-wider font-[family-name:var(--font-cinzel)] ${
              isSun ? "text-amber-200" : "text-amber-100/80"
            }`}>
              📚 Grimoires ({notes.length})
            </h2>
          </div>

          {/* Book Shelf with Grimoire Spines */}
          <div className="p-3 relative">
            {notes.length === 0 ? (
              <div className={`text-center py-8 px-4 ${isSun ? "text-amber-300/70" : "text-stone-400"}`}>
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-[family-name:var(--font-cinzel)]">
                  The shelf awaits your first tome...
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((note, index) => {
                  const isSelected = selectedNoteId === note.id;
                  // Generate book colors based on index for variety
                  const bookColors = [
                    { spine: "from-red-900 to-red-950", accent: "bg-amber-400", text: "text-amber-100" },
                    { spine: "from-emerald-900 to-emerald-950", accent: "bg-emerald-300", text: "text-emerald-100" },
                    { spine: "from-blue-900 to-blue-950", accent: "bg-blue-300", text: "text-blue-100" },
                    { spine: "from-purple-900 to-purple-950", accent: "bg-purple-300", text: "text-purple-100" },
                    { spine: "from-amber-800 to-amber-950", accent: "bg-amber-300", text: "text-amber-100" },
                    { spine: "from-slate-800 to-slate-950", accent: "bg-slate-300", text: "text-slate-100" },
                  ];
                  const color = bookColors[index % bookColors.length];
                  
                  return (
                    <motion.div
                      key={note.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative"
                    >
                      <div
                        onClick={() => setSelectedNoteId(note.id)}
                        className={`relative cursor-pointer transition-all duration-200 ${
                          isSelected ? "translate-x-3 scale-[1.02]" : "hover:translate-x-2"
                        }`}
                      >
                        {/* Book Spine */}
                        <div 
                          className={`relative rounded-r-sm bg-gradient-to-r ${color.spine} p-3 pl-4 min-h-[70px] flex flex-col justify-center ${
                            isSelected ? "shadow-xl ring-2 ring-amber-400/50" : "shadow-md"
                          }`}
                          style={{
                            boxShadow: isSelected 
                              ? "4px 4px 15px rgba(0,0,0,0.4), inset -2px 0 4px rgba(255,255,255,0.1)"
                              : "2px 2px 8px rgba(0,0,0,0.3), inset -1px 0 2px rgba(255,255,255,0.05)"
                          }}
                        >
                          {/* Spine decoration lines */}
                          <div className={`absolute left-1 top-2 bottom-2 w-0.5 ${color.accent} opacity-60 rounded-full`} />
                          <div className={`absolute left-2.5 top-3 bottom-3 w-px ${color.accent} opacity-40`} />
                          
                          {/* Book title on spine */}
                          <div className="flex-1 flex flex-col justify-center pl-2">
                            <p className={`text-sm font-bold font-[family-name:var(--font-cinzel)] ${color.text} leading-tight line-clamp-2`}>
                              {note.title || "Untitled Tome"}
                            </p>
                            <p className={`text-[10px] mt-1 opacity-60 ${color.text}`}>
                              {new Date(note.updated_at).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Page edge effect on right side */}
                          <div className="absolute right-0 top-1 bottom-1 w-1.5 bg-gradient-to-r from-amber-100/80 to-amber-50/90 rounded-r-sm" 
                            style={{ 
                              boxShadow: "inset 1px 0 2px rgba(0,0,0,0.1)",
                              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)"
                            }} 
                          />

                          {/* Glow effect when selected */}
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute -inset-1 rounded-lg bg-amber-400/20 blur-md -z-10"
                            />
                          )}
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                          className={`absolute top-1/2 -translate-y-1/2 -right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all ${
                            isSun ? "bg-red-500 hover:bg-red-600" : "bg-red-600 hover:bg-red-700"
                          } text-white shadow-lg`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            
            {/* Shelf bottom decoration */}
            <div className={`mt-4 h-3 rounded-b-lg ${
              isSun ? "bg-amber-950/50" : "bg-stone-950/50"
            }`} style={{
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)"
            }} />
          </div>
        </aside>

        {/* Editor Area - Open Book View */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
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
                  className={`w-full text-2xl font-bold bg-transparent outline-none font-[family-name:var(--font-cinzel)] ${
                    isSun ? "text-slate-800 placeholder:text-slate-300" : "text-white placeholder:text-slate-600"
                  }`}
                  placeholder="Tome title..."
                />
              </div>

              {/* Open Book with Two Pages */}
              <div className="flex-1 flex items-center justify-center overflow-hidden p-6">
                <div 
                  className="relative flex gap-1 max-w-7xl w-full h-full"
                  style={{
                    perspective: "2000px",
                  }}
                >
                  {/* Left Page */}
                  <motion.div
                    initial={{ rotateY: -5 }}
                    animate={{ rotateY: 0 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    className="flex-1 relative"
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "right center",
                    }}
                  >
                    <div 
                      className={`h-full rounded-l-2xl overflow-hidden relative ${
                        isSun 
                          ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/80" 
                          : "bg-gradient-to-br from-stone-800 via-stone-700 to-stone-800"
                      }`}
                      style={{
                        boxShadow: isSun 
                          ? "inset -8px 0 20px rgba(139, 92, 46, 0.15), 0 2px 10px rgba(0,0,0,0.1)" 
                          : "inset -8px 0 20px rgba(0, 0, 0, 0.4), 0 2px 10px rgba(0,0,0,0.3)",
                        backgroundImage: `repeating-linear-gradient(
                          0deg,
                          transparent,
                          transparent 28px,
                          ${isSun ? 'rgba(209, 169, 130, 0.15)' : 'rgba(100, 100, 100, 0.08)'} 28px,
                          ${isSun ? 'rgba(209, 169, 130, 0.15)' : 'rgba(100, 100, 100, 0.08)'} 29px
                        )`
                      }}
                    >
                      {/* Left page number */}
                      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-[family-name:var(--font-cinzel)] ${
                        isSun ? "text-amber-600/60" : "text-stone-400/40"
                      }`}>
                        •
                      </div>
                      
                      {/* Left margin line */}
                      <div className={`absolute left-12 top-0 bottom-0 w-px ${
                        isSun ? "bg-red-300/40" : "bg-red-700/20"
                      }`} />
                      
                      <div className="h-full overflow-y-auto p-8 pl-14 pr-6 custom-scrollbar">
                        <SpellbookEditor
                          ref={leftEditorRef}
                          initialContent=""
                          onContentChange={(html, text) => {
                            setLeftContent({ html, text });
                            triggerAutoSave();
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Book Spine/Center Crease */}
                  <div className="relative w-8 flex-shrink-0" style={{ zIndex: 10 }}>
                    <div 
                      className={`absolute inset-0 ${
                        isSun 
                          ? "bg-gradient-to-r from-amber-300/40 via-amber-400/60 to-amber-300/40" 
                          : "bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900"
                      }`}
                      style={{
                        boxShadow: isSun 
                          ? "0 0 20px rgba(139, 92, 46, 0.3), inset 0 0 10px rgba(139, 92, 46, 0.2)" 
                          : "0 0 20px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(0, 0, 0, 0.4)"
                      }}
                    />
                  </div>

                  {/* Right Page */}
                  <motion.div
                    initial={{ rotateY: 5 }}
                    animate={{ rotateY: 0 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    className="flex-1 relative"
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "left center",
                    }}
                  >
                    <div 
                      className={`h-full rounded-r-2xl overflow-hidden relative ${
                        isSun 
                          ? "bg-gradient-to-bl from-amber-50 via-yellow-50 to-amber-100/80" 
                          : "bg-gradient-to-bl from-stone-800 via-stone-700 to-stone-800"
                      }`}
                      style={{
                        boxShadow: isSun 
                          ? "inset 8px 0 20px rgba(139, 92, 46, 0.15), 0 2px 10px rgba(0,0,0,0.1)" 
                          : "inset 8px 0 20px rgba(0, 0, 0, 0.4), 0 2px 10px rgba(0,0,0,0.3)",
                        backgroundImage: `repeating-linear-gradient(
                          0deg,
                          transparent,
                          transparent 28px,
                          ${isSun ? 'rgba(209, 169, 130, 0.15)' : 'rgba(100, 100, 100, 0.08)'} 28px,
                          ${isSun ? 'rgba(209, 169, 130, 0.15)' : 'rgba(100, 100, 100, 0.08)'} 29px
                        )`
                      }}
                    >
                      {/* Right page number */}
                      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-[family-name:var(--font-cinzel)] ${
                        isSun ? "text-amber-600/60" : "text-stone-400/40"
                      }`}>
                        •
                      </div>
                      
                      <div className="h-full overflow-y-auto p-8 pl-6 pr-8 custom-scrollbar">
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
                  </motion.div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring" }}
                >
                  <BookOpen className={`w-24 h-24 mx-auto mb-6 ${isSun ? "text-amber-300" : "text-amber-600/50"}`} />
                  <h2 className={`text-2xl font-bold mb-3 font-[family-name:var(--font-cinzel)] ${
                    isSun ? "text-amber-800" : "text-amber-300"
                  }`}>
                    Select a Grimoire
                  </h2>
                  <p className={`mb-6 ${isSun ? "text-amber-700/70" : "text-amber-400/60"}`}>
                    Choose a tome from the shelf or inscribe a new one
                  </p>
                  <button
                    onClick={handleCreateNote}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all mx-auto shadow-lg ${
                      isSun 
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                        : "bg-gradient-to-r from-amber-600 to-orange-700 text-white hover:from-amber-700 hover:to-orange-800"
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                    Inscribe New Tome
                  </button>
                </motion.div>
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
