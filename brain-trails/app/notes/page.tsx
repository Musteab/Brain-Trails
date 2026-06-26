"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2, Download, Upload, Loader2, Check, Wand2, PanelLeftClose, PanelLeft, FileText, FileCode, BookOpen, CloudOff, Cloud } from "lucide-react";
import { useRouter } from "next/navigation";
import SpellbookEditor, { type SpellbookEditorRef } from "@/components/notes/SpellbookEditor";
import AIFamiliar from "@/components/notes/AIFamiliar";
import NotesSidebar from "@/components/notes/NotesSidebar";
import StuckOwl from "@/components/notes/StuckOwl";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import { supabase } from "@/lib/supabase";
import { htmlToMarkdown } from "@/lib/htmlToMarkdown";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useUIStore } from "@/stores";

/**
 * Migrate any stored note content into a single HTML string. Older notes were
 * saved as JSON {left, right} (the two-page book); join them. Newer notes are
 * already plain HTML.
 */
function toHtml(stored: string | null): string {
  if (!stored) return "";
  const trimmed = stored.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && (typeof parsed.left === "string" || typeof parsed.right === "string")) {
        const left = parsed.left || "";
        const right = parsed.right || "";
        return right ? `${left}${right}` : left;
      }
    } catch {
      /* fall through - treat as plain html */
    }
  }
  return stored;
}

export default function NotesPage() {
  const router = useRouter();
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>();
  const [noteTitle, setNoteTitle] = useState("Untitled");
  const [loadedHtml, setLoadedHtml] = useState<string>("");
  const [noteText, setNoteText] = useState("");
  const [isNoteLoading, setIsNoteLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const editorRef = useRef<SpellbookEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live values for the debounced saver (avoids stale closures).
  const liveHtmlRef = useRef("");
  const liveTextRef = useRef("");
  const noteTitleRef = useRef(noteTitle);
  const selectedNoteIdRef = useRef(selectedNoteId);
  useEffect(() => { noteTitleRef.current = noteTitle; }, [noteTitle]);
  useEffect(() => { selectedNoteIdRef.current = selectedNoteId; }, [selectedNoteId]);

  const { user } = useAuth();
  const { addToast } = useUIStore();
  const { theme } = useTheme();
  const isSun = theme === "sun";

  const saveToSupabase = useCallback(async (noteId: string, html: string, title: string) => {
    if (!noteId) return;
    setSaveStatus("saving");
    const { error } = await (supabase.from("notes") as any)
      .update({ content_html: html, title: title || "Untitled", updated_at: new Date().toISOString() })
      .eq("id", noteId);
    if (error) {
      setSaveStatus("error");
    } else {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 1500);
    }
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const id = selectedNoteIdRef.current;
      if (id) saveToSupabase(id, liveHtmlRef.current, noteTitleRef.current);
    }, 800);
  }, [saveToSupabase]);

  // Load the selected note. Content is fed to the editor via its `key`+initial
  // content (it remounts per note), so it's always in sync - no ref-timing race.
  useEffect(() => {
    if (!selectedNoteId) return;
    let cancelled = false;
    setIsNoteLoading(true);
    (async () => {
      const { data, error } = await (supabase.from("notes") as any)
        .select("content_html, title")
        .eq("id", selectedNoteId)
        .single();
      if (cancelled) return;
      if (error) {
        addToast("Couldn't load that note.", "error");
        setIsNoteLoading(false);
        return;
      }
      const html = toHtml(data.content_html);
      setNoteTitle(data.title || "Untitled");
      setLoadedHtml(html);
      liveHtmlRef.current = html;
      setIsNoteLoading(false);
    })();
    return () => { cancelled = true; };
  }, [selectedNoteId, addToast]);

  const handleContentChange = useCallback((html: string, text: string) => {
    liveHtmlRef.current = html;
    liveTextRef.current = text;
    setNoteText(text);
    scheduleSave();
  }, [scheduleSave]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNoteTitle(e.target.value);
    scheduleSave();
  };

  const handleQuickCreate = async () => {
    if (!user) return;
    const { data, error } = await (supabase.from("notes") as any)
      .insert({ user_id: user.id, title: "Untitled", folder: "root", content_html: "" })
      .select("id")
      .single();
    if (error || !data) { addToast("Failed to create note", "error"); return; }
    setSelectedNoteId(data.id);
  };

  const handleSelectNote = (noteId: string) => {
    // Flush the current note before switching.
    if (selectedNoteIdRef.current && selectedNoteIdRef.current !== noteId) {
      saveToSupabase(selectedNoteIdRef.current, liveHtmlRef.current, noteTitleRef.current);
    }
    setSelectedNoteId(noteId);
  };

  // Save on unmount / tab close.
  useEffect(() => {
    const flush = () => {
      const id = selectedNoteIdRef.current;
      if (id) saveToSupabase(id, liveHtmlRef.current, noteTitleRef.current);
    };
    window.addEventListener("beforeunload", flush);
    return () => { window.removeEventListener("beforeunload", flush); flush(); };
  }, [saveToSupabase]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".docx")) { addToast("Please upload a .docx file", "error"); return; }
    setIsImporting(true);
    setImportSuccess(false);
    try {
      const { importDocx, cleanImportedHtml } = await import("@/lib/docxImport");
      const result = await importDocx(file);
      editorRef.current?.insertContent(cleanImportedHtml(result.html));
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 2000);
    } catch (error) {
      console.error("Import failed:", error);
      addToast("Failed to import document.", "error");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportHtml = () => {
    const blob = new Blob([liveHtmlRef.current], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${noteTitle || "note"}.html`; a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([htmlToMarkdown(liveHtmlRef.current)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${noteTitle || "note"}.md`; a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleShare = async () => {
    try { await navigator.clipboard.writeText(noteText); addToast("Note copied to clipboard", "success"); }
    catch { addToast("Couldn't copy.", "error"); }
  };

  const headerBtn = isSun ? "hover:bg-slate-100 text-slate-600" : "hover:bg-white/10 text-slate-300";

  return (
    <main className="relative min-h-screen flex">
      <div className={`fixed inset-0 ${isSun ? "bg-gradient-to-br from-stone-50 to-slate-100" : "bg-gradient-to-br from-slate-950 to-slate-900"}`} />

      <input ref={fileInputRef} type="file" accept=".docx" onChange={handleFileUpload} className="hidden" />

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -264, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -264, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-full z-40"
          >
            <NotesSidebar onSelectNote={handleSelectNote} selectedNoteId={selectedNoteId} onCloseMobile={() => setIsSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Header */}
        <header className={`sticky top-0 z-30 backdrop-blur-xl border-b ${isSun ? "bg-white/70 border-slate-200/60" : "bg-slate-900/70 border-slate-700/50"}`}>
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-lg transition-colors ${headerBtn}`}>
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
            <button onClick={() => router.push("/")} className={`flex items-center gap-1.5 p-2 rounded-lg transition-colors ${headerBtn}`}>
              <ArrowLeft className="w-4 h-4" /><span className="text-sm font-medium">Back</span>
            </button>

            <div className="flex-1" />

            {selectedNoteId && (
              <div className="flex items-center gap-1.5 mr-1">
                {saveStatus === "saving" && <span className="flex items-center gap-1 text-amber-500 text-xs font-medium"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving</span>}
                {saveStatus === "saved" && <span className="flex items-center gap-1 text-emerald-500 text-xs font-medium"><Cloud className="w-3.5 h-3.5" /> Saved</span>}
                {saveStatus === "error" && <span className="flex items-center gap-1 text-red-500 text-xs font-medium"><CloudOff className="w-3.5 h-3.5" /> Save failed</span>}
              </div>
            )}

            {selectedNoteId && <>
              <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} title="Import .docx" className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${headerBtn}`}>
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : importSuccess ? <Check className="w-4 h-4 text-emerald-500" /> : <Upload className="w-4 h-4" />}
              </button>
              <button onClick={handleShare} title="Copy text" className={`p-2 rounded-lg transition-colors ${headerBtn}`}><Share2 className="w-4 h-4" /></button>
              <div className="relative">
                <button onClick={() => setShowExportMenu(!showExportMenu)} title="Export" className={`p-2 rounded-lg transition-colors ${headerBtn}`}><Download className="w-4 h-4" /></button>
                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                      className={`absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl border overflow-hidden z-50 ${isSun ? "bg-white border-slate-200" : "bg-slate-800 border-slate-700"}`}>
                      <button onClick={handleExportHtml} className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${isSun ? "hover:bg-slate-50 text-slate-700" : "hover:bg-slate-700 text-slate-200"}`}><FileCode className="w-4 h-4 text-orange-500" /> Export HTML</button>
                      <button onClick={handleExportMarkdown} className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${isSun ? "hover:bg-slate-50 text-slate-700" : "hover:bg-slate-700 text-slate-200"}`}><FileText className="w-4 h-4 text-blue-500" /> Export Markdown</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={() => setIsAIOpen(!isAIOpen)} title="AI Familiar" className={`p-2 rounded-lg transition-colors ${isAIOpen ? "bg-violet-500 text-white" : isSun ? "bg-violet-100 hover:bg-violet-200 text-violet-700" : "bg-violet-500/20 hover:bg-violet-500/30 text-violet-300"}`}><Wand2 className="w-4 h-4" /></button>
            </>}
          </div>
        </header>

        {/* Page */}
        <div className="relative z-10 flex-1 px-4 py-10 pb-32">
          {!selectedNoteId ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <BookOpen className={`w-14 h-14 mb-4 ${isSun ? "text-slate-300" : "text-slate-600"}`} />
              <h2 className={`text-xl font-bold mb-1 ${isSun ? "text-slate-600" : "text-slate-300"}`}>No note open</h2>
              <p className={`text-sm max-w-sm mb-6 ${isSun ? "text-slate-400" : "text-slate-500"}`}>Pick a note from the sidebar, or start a fresh one.</p>
              <button onClick={handleQuickCreate} className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors">New note</button>
            </div>
          ) : isNoteLoading ? (
            <div className="flex justify-center py-32"><Loader2 className="w-7 h-7 animate-spin text-violet-500" /></div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedNoteId}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`max-w-3xl mx-auto rounded-2xl border shadow-sm ${isSun ? "bg-white border-slate-200" : "bg-slate-900/60 border-white/10"}`}
              >
                <div className="px-10 sm:px-14 pt-12 pb-20 min-h-[70vh]">
                  {/* Title lives in the page, Notion-style */}
                  <input
                    value={noteTitle}
                    onChange={handleTitleChange}
                    placeholder="Untitled"
                    className={`w-full bg-transparent border-none outline-none text-4xl font-bold mb-4 font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-900 placeholder:text-slate-300" : "text-white placeholder:text-slate-600"}`}
                  />
                  {/* One editor, remounted per note via key - always loads correctly */}
                  <SpellbookEditor key={selectedNoteId} ref={editorRef} initialContent={loadedHtml} onContentChange={handleContentChange} />
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <AIFamiliar noteContent={noteText} isOpen={isAIOpen} onToggle={() => setIsAIOpen(!isAIOpen)} />
      <StuckOwl onOpenAI={() => setIsAIOpen(true)} idleTimeoutMs={45000} />
      <TravelerHotbar />
    </main>
  );
}
