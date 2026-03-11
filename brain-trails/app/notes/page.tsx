"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2, Download, Upload, Loader2, Check, Sparkles, PanelLeftClose, PanelLeft, FileText, FileCode } from "lucide-react";
import { useRouter } from "next/navigation";
import SpellbookEditor, { type SpellbookEditorRef } from "@/components/notes/SpellbookEditor";
import AIFamiliar from "@/components/notes/AIFamiliar";
import NotesSidebar from "@/components/notes/NotesSidebar";
import TravelerHotbar from "@/components/layout/TravelerHotbar";
import { supabase } from "@/lib/supabase";
import { htmlToMarkdown } from "@/lib/htmlToMarkdown";

export default function NotesPage() {
  const router = useRouter();
  const [leftContent, setLeftContent] = useState({ html: "", text: "" });
  const [rightContent, setRightContent] = useState({ html: "", text: "" });
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>();
  const [noteTitle, setNoteTitle] = useState("Untitled Note");
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const leftEditorRef = useRef<SpellbookEditorRef>(null);
  const rightEditorRef = useRef<SpellbookEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load note content when a note is selected
  useEffect(() => {
    if (!selectedNoteId) return;

    const fetchNote = async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('content_html, title')
        .eq('id', selectedNoteId)
        .single();
      
      if (error) {
        console.error("Error loading note:", error);
        return;
      }

      setNoteTitle(data.title || "Untitled Note");

      try {
        const content = data.content_html ? JSON.parse(data.content_html) : { left: "", right: "" };
        if (content.left && leftEditorRef.current) {
          leftEditorRef.current.insertContent(content.left);
          setLeftContent({ html: content.left, text: "" }); // Will be synced on next edit
        } else if (leftEditorRef.current) {
          leftEditorRef.current.insertContent(""); // clear
        }
        
        if (content.right && rightEditorRef.current) {
          rightEditorRef.current.insertContent(content.right);
          setRightContent({ html: content.right, text: "" });
        } else if (rightEditorRef.current) {
          rightEditorRef.current.insertContent(""); // clear
        }
      } catch (e) {
        // Fallback if parsing fails (e.g. legacy plain html)
        if (leftEditorRef.current) leftEditorRef.current.insertContent(data.content_html || "");
      }
    };

    fetchNote();
  }, [selectedNoteId]);

  const saveToSupabase = async (noteId: string, leftHtml: string, rightHtml: string, currentTitle: string) => {
    if (!noteId) return;
    const payload = JSON.stringify({ left: leftHtml, right: rightHtml });
    await supabase
      .from('notes')
      .update({ content_html: payload, title: currentTitle, updated_at: new Date().toISOString() })
      .eq('id', noteId);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNoteTitle(e.target.value);
    if (selectedNoteId) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveToSupabase(selectedNoteId, leftContent.html, rightContent.html, e.target.value);
      }, 1000);
    }
  };

  // Debounced auto-save for left page
  const handleLeftContentChange = useCallback((html: string, text: string) => {
    setLeftContent({ html, text });
    if (selectedNoteId) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveToSupabase(selectedNoteId, html, rightContent.html, noteTitle);
      }, 1000);
    }
  }, [selectedNoteId, rightContent.html, noteTitle]);

  // Debounced auto-save for right page
  const handleRightContentChange = useCallback((html: string, text: string) => {
    setRightContent({ html, text });
    if (selectedNoteId) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveToSupabase(selectedNoteId, leftContent.html, html, noteTitle);
      }, 1000);
    }
  }, [selectedNoteId, leftContent.html, noteTitle]);

  const handleSelectNote = (noteId: string) => {
    // Save current note before switching
    if (selectedNoteId) {
      saveToSupabase(selectedNoteId, leftContent.html, rightContent.html, noteTitle);
    }
    
    // Clear editors immediately for snappier UI transitions
    if (leftEditorRef.current) leftEditorRef.current.insertContent("");
    if (rightEditorRef.current) rightEditorRef.current.insertContent("");
    setLeftContent({ html: "", text: "" });
    setRightContent({ html: "", text: "" });
    
    setSelectedNoteId(noteId);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".docx")) {
      alert("Please upload a .docx file");
      return;
    }
    setIsImporting(true);
    setImportSuccess(false);
    try {
      const { importDocx, cleanImportedHtml } = await import("@/lib/docxImport");
      const result = await importDocx(file);
      const cleanedHtml = cleanImportedHtml(result.html);
      leftEditorRef.current?.insertContent(cleanedHtml);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 2000);
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to import document.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportHtml = () => {
    const combinedHtml = `<div class="left-page">${leftContent.html}</div><div class="right-page">${rightContent.html}</div>`;
    const blob = new Blob([combinedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spell-notes.html";
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportMarkdown = () => {
    const combinedHtml = leftContent.html + "\n\n---\n\n" + rightContent.html;
    const markdown = htmlToMarkdown(combinedHtml);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spell-notes.md";
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleShare = async () => {
    try {
      const combinedText = leftContent.text + "\n\n---\n\n" + rightContent.text;
      await navigator.clipboard.writeText(combinedText);
      alert("Note content copied to clipboard!");
    } catch {
      alert("Failed to copy.");
    }
  };

  return (
    <main className="relative min-h-screen flex">
      <div className="fixed inset-0 bg-gradient-to-br from-teal-50 via-emerald-50 to-amber-50" />
      <div className="fixed inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, rgba(0,0,0,0.03) 1px, transparent 0)", backgroundSize: "32px 32px" }} />

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
            <NotesSidebar onSelectNote={handleSelectNote} selectedNoteId={selectedNoteId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
        <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-slate-200/50">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
              >
                {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
              </motion.button>
              <motion.button whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }} onClick={() => router.push("/")} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back</span>
              </motion.button>
            </div>

          <div className="flex-1 flex items-center gap-2 max-w-sm ml-4">
            <input 
              disabled={!selectedNoteId}
              type="text" 
              value={noteTitle} 
              onChange={handleTitleChange}
              placeholder="Select or create a note..."
              className="font-bold text-lg text-slate-800 bg-transparent border-none outline-none w-full placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 rounded-md px-2 py-1 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleImportClick} disabled={isImporting} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors text-sm font-medium disabled:opacity-50">
              <AnimatePresence mode="wait">
                {isImporting ? <Loader2 key="loading" className="w-4 h-4 animate-spin" /> : importSuccess ? <Check key="success" className="w-4 h-4" /> : <Upload key="upload" className="w-4 h-4" />}
              </AnimatePresence>
              <span>{isImporting ? "Importing..." : importSuccess ? "Done!" : "Import"}</span>
            </motion.button>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleShare} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 text-sm font-medium">
              <Share2 className="w-4 h-4" />
            </motion.button>

            {/* Export dropdown */}
            <div className="relative">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 text-sm font-medium">
                <Download className="w-4 h-4" />
              </motion.button>
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
                  >
                    <button onClick={handleExportHtml} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 transition-colors">
                      <FileCode className="w-4 h-4 text-orange-500" /> Export as HTML
                    </button>
                    <button onClick={handleExportMarkdown} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 transition-colors">
                      <FileText className="w-4 h-4 text-blue-500" /> Export as Markdown
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsAIOpen(!isAIOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isAIOpen ? "bg-violet-500 text-white" : "bg-violet-100 hover:bg-violet-200 text-violet-700"}`}>
              <Sparkles className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative z-10 flex-1 flex items-start justify-center px-4 py-8 pb-32 overflow-x-auto">
        {/* Two-page book layout */}
        <div className="flex gap-1 perspective-1000">
          {/* Left Page */}
          <motion.div
            initial={{ rotateY: -5 }}
            animate={{ rotateY: 0 }}
            className="w-[600px] min-h-[700px] bg-[#FDFBF7] rounded-l-md rounded-r-3xl shadow-xl shadow-slate-300/50 border border-slate-200/50 overflow-hidden relative flex-shrink-0"
            style={{
              background: "linear-gradient(to right, #F5F3EE 0%, #FDFBF7 5%, #FDFBF7 100%)",
              boxShadow: "inset -2px 0 8px rgba(0,0,0,0.03), -4px 0 20px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.1)",
            }}
          >
            {/* Page edge effect */}
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-slate-200/50 to-transparent" />
            {/* Binding shadow */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-100/80 to-transparent" />
            {/* Page lines texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #94a3b8 31px, #94a3b8 32px)", backgroundPosition: "0 60px" }} />
            <div className="p-8 pr-10 h-full flex flex-col">
              <SpellbookEditor ref={leftEditorRef} onContentChange={handleLeftContentChange} />
              {/* Page number */}
              <div className="text-center text-slate-300 text-sm font-serif mt-auto pt-4">
                1
              </div>
            </div>
          </motion.div>

          {/* Book spine */}
          <div className="w-4 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 rounded-sm shadow-inner relative z-10 flex-shrink-0" style={{ boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)" }}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-200/30 to-transparent" />
          </div>

          {/* Right Page */}
          <motion.div
            initial={{ rotateY: 5 }}
            animate={{ rotateY: 0 }}
            className="w-[600px] min-h-[700px] bg-[#FDFBF7] rounded-r-md rounded-l-3xl shadow-xl shadow-slate-300/50 border border-slate-200/50 overflow-hidden relative flex-shrink-0"
            style={{
              background: "linear-gradient(to left, #F5F3EE 0%, #FDFBF7 5%, #FDFBF7 100%)",
              boxShadow: "inset 2px 0 8px rgba(0,0,0,0.03), 4px 0 20px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.1)",
            }}
          >
            {/* Page edge effect */}
            <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-slate-200/50 to-transparent" />
            {/* Binding shadow */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-100/80 to-transparent" />
            {/* Page lines texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #94a3b8 31px, #94a3b8 32px)", backgroundPosition: "0 60px" }} />
            <div className="p-8 pl-10 h-full flex flex-col">
              <SpellbookEditor ref={rightEditorRef} onContentChange={handleRightContentChange} initialContent="<p>Continue your notes here...</p>" />
              {/* Page number */}
              <div className="text-center text-slate-300 text-sm font-serif mt-auto pt-4">
                2
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      </div>

      <AIFamiliar noteContent={leftContent.text + "\n" + rightContent.text} isOpen={isAIOpen} onToggle={() => setIsAIOpen(!isAIOpen)} />
      <TravelerHotbar />
    </main>
  );
}
