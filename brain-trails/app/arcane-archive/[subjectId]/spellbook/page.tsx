"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Download, Upload, Loader2, Check, Sparkles, PanelLeftClose, PanelLeft, FileText, FileCode, BookOpen, CloudOff, Cloud } from "lucide-react";
import { useParams } from "next/navigation";
import SpellbookEditor, { type SpellbookEditorRef } from "@/components/notes/SpellbookEditor";
import AIFamiliar from "@/components/notes/AIFamiliar";
import GrimoireSidebar from "@/components/notes/GrimoireSidebar";
import StuckOwl from "@/components/notes/StuckOwl";
import { supabase } from "@/lib/supabase";
import { htmlToMarkdown } from "@/lib/htmlToMarkdown";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useUIStore } from "@/stores";

export default function SpellbookPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  
  const [leftContent, setLeftContent] = useState({ html: "", text: "" });
  const [rightContent, setRightContent] = useState({ html: "", text: "" });
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>();
  const [noteTitle, setNoteTitle] = useState("Untitled Note");
  const [isNoteLoading, setIsNoteLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const leftEditorRef = useRef<SpellbookEditorRef>(null);
  const rightEditorRef = useRef<SpellbookEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();
  const { addToast } = useUIStore();
  const { theme } = useTheme();
  const isSun = theme === "sun";

  // Create note for this subject
  const handleQuickCreate = async () => {
    if (!user) return;
    const { data, error } = await (supabase.from('notes') as any)
      .insert({
        user_id: user.id,
        title: 'Untitled Note',
        folder: 'root',
        content_html: JSON.stringify({ left: '', right: '' }),
        // subject_id: subjectId, // Will add this after migration
      })
      .select('id')
      .single();

    if (error) {
      addToast('Failed to create note', 'error');
      return;
    }
    if (data) {
      setSelectedNoteId(data.id);
      setNoteTitle('Untitled Note');
      addToast('New note created!', 'success');
    }
  };

  // Load notes for this subject
  useEffect(() => {
    if (!user) return;

    const fetchNotesForSubject = async () => {
      // For now, fetch all user notes (after migration, filter by subject_id)
      const { data } = await (supabase.from('notes') as any)
        .select('id, title')
        .eq('user_id', user.id)
        .limit(1);
      
      if (data && data.length > 0) {
        setSelectedNoteId(data[0].id);
      }
    };

    fetchNotesForSubject();
  }, [user, subjectId]);

  // Load note content when a note is selected
  useEffect(() => {
    if (!selectedNoteId) return;

    const fetchNote = async () => {
      setIsNoteLoading(true);
      const { data, error } = await (supabase.from('notes') as any)
        .select('content_html, title')
        .eq('id', selectedNoteId)
        .single();
      
      if (error) {
        console.error("Error loading note:", error);
        setIsNoteLoading(false);
        return;
      }

      setNoteTitle(data.title || "Untitled Note");

      try {
        const content = data.content_html ? JSON.parse(data.content_html) : { left: "", right: "" };
        if (content.left && leftEditorRef.current) {
          leftEditorRef.current.insertContent(content.left);
          setLeftContent({ html: content.left, text: "" });
        } else if (leftEditorRef.current) {
          leftEditorRef.current.insertContent("");
        }
        
        if (content.right && rightEditorRef.current) {
          rightEditorRef.current.insertContent(content.right);
          setRightContent({ html: content.right, text: "" });
        } else if (rightEditorRef.current) {
          rightEditorRef.current.insertContent("");
        }
      } catch {
        if (leftEditorRef.current) leftEditorRef.current.insertContent(data.content_html || "");
      } finally {
        setIsNoteLoading(false);
      }
    };

    fetchNote();
  }, [selectedNoteId]);

  const saveToSupabase = async (noteId: string, leftHtml: string, rightHtml: string, currentTitle: string) => {
    if (!noteId) return;
    setSaveStatus('saving');
    const payload = JSON.stringify({ left: leftHtml, right: rightHtml });
    const { error } = await (supabase.from('notes') as any)
      .update({ content_html: payload, title: currentTitle, updated_at: new Date().toISOString() })
      .eq('id', noteId);
    if (error) {
      setSaveStatus('error');
      addToast('Failed to save note. Please try again.', 'error');
    } else {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNoteTitle(e.target.value);
    if (selectedNoteId) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveToSupabase(selectedNoteId, leftContent.html, rightContent.html, e.target.value);
      }, 500);
    }
  };

  const handleLeftContentChange = useCallback((html: string, text: string) => {
    setLeftContent({ html, text });
    if (selectedNoteId) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveToSupabase(selectedNoteId, html, rightContent.html, noteTitle);
      }, 500);
    }
  }, [selectedNoteId, rightContent.html, noteTitle]);

  const handleRightContentChange = useCallback((html: string, text: string) => {
    setRightContent({ html, text });
    if (selectedNoteId) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveToSupabase(selectedNoteId, leftContent.html, html, noteTitle);
      }, 500);
    }
  }, [selectedNoteId, leftContent.html, noteTitle]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (selectedNoteId) {
        saveToSupabase(selectedNoteId, leftContent.html, rightContent.html, noteTitle);
      }
    };
  }, [selectedNoteId, leftContent.html, rightContent.html, noteTitle]);

  const handleSelectNote = (noteId: string) => {
    if (selectedNoteId) {
      saveToSupabase(selectedNoteId, leftContent.html, rightContent.html, noteTitle);
    }
    
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
    <div className="relative w-full flex flex-col">
      <input ref={fileInputRef} type="file" accept=".docx" onChange={handleFileUpload} className="hidden" />

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -264, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -264, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-20 h-[calc(100%-80px)] z-40"
          >
            <GrimoireSidebar onSelectNote={handleSelectNote} selectedNoteId={selectedNoteId} onCloseMobile={() => setIsSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Toolbar */}
        <div className={`sticky top-20 z-30 backdrop-blur-xl border-b px-6 py-3 flex items-center justify-between gap-4 ${
          isSun
            ? "bg-white/70 border-slate-200/50"
            : "bg-slate-900/70 border-slate-700/50"
        }`}>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                isSun
                  ? "hover:bg-slate-100 text-slate-600"
                  : "hover:bg-white/10 text-slate-300"
              }`}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </motion.button>
          </div>

          <div className="flex-1 flex items-center gap-2 max-w-sm">
            <input 
              disabled={!selectedNoteId}
              type="text" 
              value={noteTitle} 
              onChange={handleTitleChange}
              placeholder="Select or create a note..."
              className={`font-bold text-lg bg-transparent border-none outline-none w-full focus:ring-2 focus:ring-emerald-500/20 rounded-md px-2 py-1 transition-all ${
                isSun
                  ? "text-slate-800 placeholder:text-slate-400"
                  : "text-white placeholder:text-slate-500"
              }`}
            />
          </div>

          {/* Save status */}
          {selectedNoteId && (
            <div className="flex items-center gap-1.5 mr-2">
              {saveStatus === 'saving' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-amber-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs font-medium">Saving...</span>
                </motion.div>
              )}
              {saveStatus === 'saved' && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1 text-emerald-500">
                  <Cloud className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Saved ✓</span>
                </motion.div>
              )}
              {saveStatus === 'error' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-red-500">
                  <CloudOff className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Save failed</span>
                </motion.div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleImportClick} disabled={isImporting} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-sm font-medium disabled:opacity-50 ${
              isSun
                ? "bg-amber-100 hover:bg-amber-200 text-amber-700"
                : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300"
            }`}>
              <AnimatePresence mode="wait">
                {isImporting ? <Loader2 key="loading" className="w-4 h-4 animate-spin" /> : importSuccess ? <Check key="success" className="w-4 h-4" /> : <Upload key="upload" className="w-4 h-4" />}
              </AnimatePresence>
              <span>{isImporting ? "Importing..." : importSuccess ? "Done!" : "Import"}</span>
            </motion.button>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleShare} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-sm font-medium ${
              isSun
                ? "hover:bg-slate-100 text-slate-600"
                : "hover:bg-white/10 text-slate-300"
            }`}>
              <Share2 className="w-4 h-4" />
            </motion.button>

            {/* Export dropdown */}
            <div className="relative">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowExportMenu(!showExportMenu)} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-sm font-medium ${
                isSun
                  ? "hover:bg-slate-100 text-slate-600"
                  : "hover:bg-white/10 text-slate-300"
              }`}>
                <Download className="w-4 h-4" />
              </motion.button>
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl border overflow-hidden z-50 ${
                      isSun
                        ? "bg-white border-slate-200"
                        : "bg-slate-800 border-slate-700"
                    }`}
                  >
                    <button onClick={handleExportHtml} className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                      isSun
                        ? "hover:bg-slate-50 text-slate-700"
                        : "hover:bg-slate-700 text-slate-200"
                    }`}>
                      <FileCode className="w-4 h-4 text-orange-500" /> Export as HTML
                    </button>
                    <button onClick={handleExportMarkdown} className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                      isSun
                        ? "hover:bg-slate-50 text-slate-700"
                        : "hover:bg-slate-700 text-slate-200"
                    }`}>
                      <FileText className="w-4 h-4 text-blue-500" /> Export as Markdown
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsAIOpen(!isAIOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              isAIOpen
                ? "bg-violet-500 text-white"
                : isSun
                ? "bg-violet-100 hover:bg-violet-200 text-violet-700"
                : "bg-violet-500/20 hover:bg-violet-500/30 text-violet-300"
            }`}>
              <Sparkles className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Editor area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative flex-1 flex items-start justify-center px-4 py-8 pb-32 overflow-x-auto">
          {!selectedNoteId && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <BookOpen className={`w-16 h-16 mb-4 ${isSun ? "text-slate-300" : "text-slate-600"}`} />
              <h2 className={`text-xl font-bold font-[family-name:var(--font-nunito)] mb-2 ${
                isSun ? "text-slate-500" : "text-slate-300"
              }`}>
                No scrolls written yet!
              </h2>
              <p className={`text-sm max-w-sm mb-6 ${
                isSun ? "text-slate-400" : "text-slate-500"
              }`}>
                Create your first note ✍️ to begin recording your knowledge.
              </p>
              <button
                onClick={handleQuickCreate}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold font-[family-name:var(--font-nunito)] shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Create New Note
              </button>
            </div>
          )}

          {selectedNoteId && isNoteLoading && (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
              <p className={`text-sm ${isSun ? "text-slate-400" : "text-slate-500"}`}>
                Loading note...
              </p>
            </div>
          )}

          {selectedNoteId && !isNoteLoading && (
            <div className="flex gap-1 perspective-1000">
              {/* Left Page */}
              <motion.div
                initial={{ rotateY: -5 }}
                animate={{ rotateY: 0 }}
                className={`w-[600px] min-h-[700px] rounded-l-md rounded-r-3xl shadow-xl overflow-hidden relative flex-shrink-0 ${
                  isSun
                    ? "bg-[#FDFBF7] shadow-slate-300/50 border border-slate-200/50"
                    : "bg-[#1e1b2e] shadow-black/50 border border-slate-700/50"
                }`}
                style={{
                  background: isSun
                    ? "linear-gradient(to right, #F5F3EE 0%, #FDFBF7 5%, #FDFBF7 100%)"
                    : "linear-gradient(to right, #171425 0%, #1e1b2e 5%, #1e1b2e 100%)",
                  boxShadow: isSun
                    ? "inset -2px 0 8px rgba(0,0,0,0.03), -4px 0 20px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.1)"
                    : "inset -2px 0 8px rgba(0,0,0,0.2), -4px 0 20px rgba(0,0,0,0.3), 0 10px 40px rgba(0,0,0,0.4)",
                }}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r ${
                  isSun ? "from-slate-200/50" : "from-slate-700/30"
                } to-transparent`} />
                <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l ${
                  isSun ? "from-slate-100/80" : "from-slate-800/40"
                } to-transparent`} />
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                  backgroundImage: `repeating-linear-gradient(transparent, transparent 31px, ${
                    isSun ? "#94a3b8" : "#475569"
                  } 31px, ${isSun ? "#94a3b8" : "#475569"} 32px)`,
                  backgroundPosition: "0 60px"
                }} />
                <div className={`p-8 pr-10 h-full flex flex-col ${isSun ? "text-slate-800" : "text-slate-200"}`}>
                  <SpellbookEditor ref={leftEditorRef} onContentChange={handleLeftContentChange} />
                  <div className={`text-center text-sm font-serif mt-auto pt-4 ${
                    isSun ? "text-slate-300" : "text-slate-600"
                  }`}>
                    1
                  </div>
                </div>
              </motion.div>

              {/* Book spine */}
              <div className={`w-4 rounded-sm shadow-inner relative z-10 flex-shrink-0 ${
                isSun
                  ? "bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100"
                  : "bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700"
              }`} style={{
                boxShadow: isSun
                  ? "inset 0 0 10px rgba(0,0,0,0.1)"
                  : "inset 0 0 10px rgba(0,0,0,0.4)"
              }}>
                <div className={`absolute inset-0 bg-gradient-to-b from-transparent ${
                  isSun ? "via-amber-200/30" : "via-indigo-500/10"
                } to-transparent`} />
              </div>

              {/* Right Page */}
              <motion.div
                initial={{ rotateY: 5 }}
                animate={{ rotateY: 0 }}
                className={`w-[600px] min-h-[700px] rounded-r-md rounded-l-3xl shadow-xl overflow-hidden relative flex-shrink-0 ${
                  isSun
                    ? "bg-[#FDFBF7] shadow-slate-300/50 border border-slate-200/50"
                    : "bg-[#1e1b2e] shadow-black/50 border border-slate-700/50"
                }`}
                style={{
                  background: isSun
                    ? "linear-gradient(to left, #F5F3EE 0%, #FDFBF7 5%, #FDFBF7 100%)"
                    : "linear-gradient(to left, #171425 0%, #1e1b2e 5%, #1e1b2e 100%)",
                  boxShadow: isSun
                    ? "inset 2px 0 8px rgba(0,0,0,0.03), 4px 0 20px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.1)"
                    : "inset 2px 0 8px rgba(0,0,0,0.2), 4px 0 20px rgba(0,0,0,0.3), 0 10px 40px rgba(0,0,0,0.4)",
                }}
              >
                <div className={`absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l ${
                  isSun ? "from-slate-200/50" : "from-slate-700/30"
                } to-transparent`} />
                <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r ${
                  isSun ? "from-slate-100/80" : "from-slate-800/40"
                } to-transparent`} />
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                  backgroundImage: `repeating-linear-gradient(transparent, transparent 31px, ${
                    isSun ? "#94a3b8" : "#475569"
                  } 31px, ${isSun ? "#94a3b8" : "#475569"} 32px)`,
                  backgroundPosition: "0 60px"
                }} />
                <div className={`p-8 pl-10 h-full flex flex-col ${isSun ? "text-slate-800" : "text-slate-200"}`}>
                  <SpellbookEditor ref={rightEditorRef} onContentChange={handleRightContentChange} initialContent="<p>Continue your notes here...</p>" />
                  <div className={`text-center text-sm font-serif mt-auto pt-4 ${
                    isSun ? "text-slate-300" : "text-slate-600"
                  }`}>
                    2
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>

      <AIFamiliar noteContent={leftContent.text + "\n" + rightContent.text} isOpen={isAIOpen} onToggle={() => setIsAIOpen(!isAIOpen)} />
      <StuckOwl onOpenAI={() => setIsAIOpen(true)} idleTimeoutMs={45000} />
    </div>
  );
}
