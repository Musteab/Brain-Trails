"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { 
  FolderOpen, Folder, FileText, ChevronRight, Plus, Trash2, 
  Search, Star, Hash, StarOff, BookOpen, ChevronLeft
} from "lucide-react";
import { useCardStyles } from "@/hooks/useCardStyles";
import { useUIStore } from "@/stores";

export interface NoteItem {
  id: string;
  title: string;
  type: "note";
  folder: string;
  is_pinned?: boolean;
  tags?: string[];
  parent_folder_id?: string | null;
}

export interface FolderItem {
  id: string;
  title: string;
  type: "folder";
  children: NoteItem[];
  isExpanded?: boolean;
}

interface NotesSidebarProps {
  onSelectNote: (noteId: string) => void;
  selectedNoteId?: string;
  onCloseMobile?: () => void;
}

export default function NotesSidebar({ onSelectNote, selectedNoteId, onCloseMobile }: NotesSidebarProps) {
  const { user } = useAuth();
  const { isSun, muted } = useCardStyles();
  const { addToast } = useUIStore();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [notesList, setNotesList] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"folders" | "favorites" | "tags">("folders");

  useEffect(() => {
    if (!user) return;
    
    const fetchNotes = async () => {
      const { data, error } = await (supabase.from('notes') as any)
        .select('id, title, folder, is_pinned, tags, parent_folder_id, updated_at')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Error fetching notes:", error);
      } else if (data) {
        setNotesList(data as unknown as NoteItem[]);
        const grouped = data.reduce((acc, note) => {
          const folderName = note.folder || 'root';
          if (!acc[folderName]) acc[folderName] = [];
          acc[folderName].push(note as unknown as NoteItem);
          return acc;
        }, {} as Record<string, NoteItem[]>);

        const newFolders: FolderItem[] = Object.keys(grouped).map(name => ({
          id: name,
          title: name,
          type: "folder",
          children: grouped[name],
          isExpanded: name === 'root',
        }));
        
        newFolders.sort((a, b) => a.id === 'root' ? -1 : b.id === 'root' ? 1 : a.title.localeCompare(b.title));
        
        setFolders(newFolders);
      }
      setIsLoading(false);
    };

    fetchNotes();

    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id}` },
        () => {
          fetchNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const toggleFolder = (folderId: string) => {
    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === folderId
          ? { ...folder, isExpanded: !folder.isExpanded }
          : folder
      )
    );
  };

  const handleAddFolder = () => {
    const newFolderName = `Folder ${folders.length}`;
    if (folders.find(f => f.id === newFolderName)) return;

    setFolders((prev) => [
      ...prev,
      {
        id: newFolderName,
        title: newFolderName,
        type: "folder",
        children: [],
        isExpanded: true,
      },
    ]);
  };

  const handleCreateNote = async () => {
    if (!user) return;

    const { data, error } = await (supabase.from('notes') as any)
      .insert({
        user_id: user.id,
        title: 'Untitled Note',
        folder: 'root',
        content_html: JSON.stringify({ left: '', right: '' }),
      })
      .select('id')
      .single();

    if (error) {
      addToast('Failed to create note', 'error');
      console.error(error);
      return;
    }

    if (data) {
      onSelectNote(data.id);
      addToast('New note created!', 'success');
    }
  };

  const togglePinNote = async (e: React.MouseEvent, noteId: string, currentPinStatus: boolean) => {
    e.stopPropagation();
    const newStatus = !currentPinStatus;
    
    setNotesList(prev => prev.map(n => n.id === noteId ? { ...n, is_pinned: newStatus } : n));
    setFolders(prev => prev.map(f => ({
      ...f,
      children: f.children.map(n => n.id === noteId ? { ...n, is_pinned: newStatus } : n).sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return 0;
      })
    })));

    const { error } = await (supabase.from("notes") as any).update({ is_pinned: newStatus }).eq("id", noteId);
    if (error) {
       addToast("Failed to pin note", "error");
    }
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this note?")) return;

    const { error } = await (supabase.from('notes') as any).delete().eq('id', noteId);
    if (error) {
      addToast("Failed to delete note", "error");
      console.error(error);
    } else {
      setFolders((prev) =>
        prev.map((folder) => ({
          ...folder,
          children: folder.children.filter((child) => child.id !== noteId),
        }))
      );
      setNotesList(prev => prev.filter(n => n.id !== noteId));
      if (selectedNoteId === noteId) {
        onSelectNote(""); // Unselect if deleted
      }
      addToast("Note deleted", "success");
    }
  };

  const renderNoteItem = (note: NoteItem, depth = 0) => {
    const isSelected = note.id === selectedNoteId;
    return (
      <div
        key={note.id}
        className={`relative group w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
          isSelected
            ? isSun ? "bg-emerald-100 text-emerald-800" : "bg-emerald-500/20 text-emerald-300"
            : isSun ? "hover:bg-slate-100 text-slate-600 cursor-pointer" : "hover:bg-white/5 text-slate-300 cursor-pointer"
        }`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => {
          onSelectNote(note.id);
          if (onCloseMobile) onCloseMobile();
        }}
      >
        <FileText className={`w-4 h-4 flex-shrink-0 ${isSelected ? (isSun ? "text-emerald-600" : "text-emerald-400") : "text-slate-400"}`} />
        <span className="text-sm truncate flex-1 font-[family-name:var(--font-quicksand)]">{note.title || "Untitled"}</span>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => togglePinNote(e, note.id, !!note.is_pinned)}
            className={`p-1 transition-colors ${note.is_pinned ? "text-amber-400 hover:text-amber-500" : "text-slate-400 hover:text-amber-400"}`}
          >
            {note.is_pinned ? <Star className="w-3.5 h-3.5 fill-current" /> : <StarOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => handleDeleteNote(e, note.id)}
            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {note.is_pinned && (
          <div className="group-hover:hidden text-amber-400">
            <Star className="w-3 h-3 fill-current" />
          </div>
        )}
      </div>
    );
  };

  const renderFolderItem = (folder: FolderItem, depth = 0) => {
    const isExpanded = !!folder.isExpanded;
    return (
      <div key={folder.id}>
        <div
          className="flex items-center group"
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          <button
            onClick={() => toggleFolder(folder.id)}
            className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isSun ? "hover:bg-slate-100 text-slate-700" : "hover:bg-white/5 text-slate-300"}`}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </motion.div>
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-emerald-500" />
            ) : (
              <Folder className="w-4 h-4 text-emerald-500" />
            )}
            <span className="text-sm font-semibold truncate font-[family-name:var(--font-nunito)]">{folder.title === 'root' ? 'My Notes' : folder.title}</span>
          </button>
        </div>
        
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {folder.children.length === 0 ? (
                <div 
                  className={`text-xs italic py-2 px-3 ml-8 ${isSun ? "text-slate-400" : "text-slate-500"}`}
                >
                  Empty folder
                </div>
              ) : (
                folder.children.map((child) => renderNoteItem(child, depth + 1))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const displayedNotes = notesList.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const allTags = Array.from(new Set(notesList.flatMap(n => n.tags || []))).sort();

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`w-64 h-full border-r flex flex-col ${isSun ? "bg-[#FAFDF9] border-slate-200" : "bg-slate-900 border-slate-800"}`}
    >
      <div className={`p-4 border-b ${isSun ? "border-slate-200" : "border-slate-800"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-emerald-500" />
            </div>
            <h2 className={`font-bold font-[family-name:var(--font-nunito)] ${isSun ? "text-slate-800" : "text-slate-100"}`}>My Spellbooks</h2>
          </div>
          {onCloseMobile && (
             <button onClick={onCloseMobile} className="md:hidden p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
               <ChevronLeft className="w-4 h-4" />
             </button>
          )}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 text-sm rounded-lg outline-none transition-all font-[family-name:var(--font-quicksand)] ${
              isSun ? "bg-white border-2 border-slate-200 focus:border-emerald-400 text-slate-700" : "bg-slate-800 border-2 border-slate-700 focus:border-emerald-500 text-slate-200"
            }`}
          />
        </div>

        {/* New Note Button */}
        <button
          onClick={handleCreateNote}
          className={`w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold font-[family-name:var(--font-nunito)] transition-all ${
            isSun
              ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
              : "bg-emerald-500/80 text-white hover:bg-emerald-500 shadow-md shadow-emerald-500/20"
          }`}
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      <div className={`flex border-b ${isSun ? "border-slate-200 bg-slate-50/50" : "border-slate-800 bg-slate-900/50"}`}>
        {(["folders", "favorites", "tags"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${
              activeTab === tab 
                ? (isSun ? "border-emerald-500 text-emerald-600" : "border-emerald-400 text-emerald-400") 
                : (isSun ? "border-transparent text-slate-400 hover:text-slate-600" : "border-transparent text-slate-500 hover:text-slate-300")
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {isLoading ? (
          <div className="p-4 flex justify-center">
            <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : searchQuery ? (
          displayedNotes.length > 0 ? (
             <div className="space-y-1">
               <div className={`px-3 py-1 text-xs font-semibold ${muted}`}>Search Results</div>
               {displayedNotes.map(note => renderNoteItem(note, 0))}
             </div>
          ) : (
             <div className={`p-4 text-center text-sm ${muted}`}>No notes found</div>
          )
        ) : activeTab === "folders" ? (
          folders.map((folder) => renderFolderItem(folder))
        ) : activeTab === "favorites" ? (
          <div className="space-y-1">
            {notesList.filter(n => n.is_pinned).length > 0 ? (
              notesList.filter(n => n.is_pinned).map(note => renderNoteItem(note, 0))
            ) : (
              <div className={`p-4 text-center text-sm ${muted}`}>No pinned notes</div>
            )}
          </div>
        ) : (
          <div className="space-y-4 px-2 py-2">
            {allTags.length > 0 ? allTags.map(tag => (
              <div key={tag} className="space-y-1">
                <div className="flex items-center gap-2 px-2 py-1">
                  <Hash className="w-3.5 h-3.5 text-emerald-500" />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isSun ? "text-slate-500" : "text-slate-400"}`}>{tag}</span>
                </div>
                {notesList.filter(n => n.tags?.includes(tag)).map(note => renderNoteItem(note, 1))}
              </div>
            )) : (
              <div className={`p-4 text-center text-sm ${muted}`}>No tags used yet</div>
            )}
          </div>
        )}
      </div>

      <div className={`p-3 border-t ${isSun ? "border-slate-200" : "border-slate-800"}`}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            handleAddFolder();
          }}
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-bold font-[family-name:var(--font-nunito)] transition-colors ${
            isSun ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
          }`}
        >
          <Plus className="w-4 h-4" />
          New Folder
        </motion.button>
      </div>
    </motion.div>
  );
}