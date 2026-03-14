"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  FolderOpen,
  Folder,
  FileText,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";

export interface NoteItem {
  id: string;
  title: string;
  type: "note";
  folder: string;
}

export interface FolderItem {
  id: string; // The physical folder name
  title: string;
  type: "folder";
  children: NoteItem[];
  isExpanded?: boolean;
}

interface NotesSidebarProps {
  onSelectNote: (noteId: string) => void;
  selectedNoteId?: string;
}

export default function NotesSidebar({ onSelectNote, selectedNoteId }: NotesSidebarProps) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load notes from Supabase
  useEffect(() => {
    if (!user) return;
    
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, folder')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Error loading notes:", error);
        setIsLoading(false);
        return;
      }

      // Group by folder
      const folderMap = new Map<string, FolderItem>();
      
      // Initialize a Root folder if it doesn't exist
      folderMap.set("root", {
        id: "root",
        title: "My Spellbooks",
        type: "folder",
        children: [],
        isExpanded: true,
      });

      (data || []).forEach((note) => {
        const folderName = note.folder || "root";
        if (!folderMap.has(folderName)) {
          folderMap.set(folderName, {
            id: folderName,
            title: folderName.charAt(0).toUpperCase() + folderName.slice(1),
            type: "folder",
            children: [],
            isExpanded: true,
          });
        }
        folderMap.get(folderName)!.children.push({
          id: note.id,
          title: note.title,
          type: "note",
          folder: folderName,
        });
      });

      setFolders(Array.from(folderMap.values()));
      setIsLoading(false);
    };

    fetchNotes();

    // Subscribe to changes
    const channel = supabase
      .channel('notes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id}` }, () => {
        fetchNotes();
      })
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
      }
    ]);
  };

  const handleAddNote = async (folderId: string) => {
    if (!user) return;

    // Create directly in Supabase. Realtime listener will update the UI automatically
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: "Untitled Note",
        folder: folderId,
        content_html: JSON.stringify({ left: "", right: "" })
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error creating note:", error);
      alert("Failed to create note");
      return;
    }

    if (data) {
      onSelectNote(data.id);
    }
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!user || !confirm("Are you sure you want to delete this note?")) return;

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id);

    if (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note");
    } else if (selectedNoteId === noteId) {
      // If deleted note was selected, clear selection
      onSelectNote(""); 
    }
  };

  const renderNote = (note: NoteItem, depth: number = 1) => {
    const isSelected = selectedNoteId === note.id;
    return (
      <div
        key={note.id}
        className={`relative group w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
          isSelected
            ? "bg-emerald-100 text-emerald-700"
            : "hover:bg-slate-100 text-slate-600 cursor-pointer"
        }`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => onSelectNote(note.id)}
      >
        <FileText className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
        <span className="text-sm truncate flex-1">{note.title}</span>
        
        {/* Delete button (shows on hover) */}
        <button
          onClick={(e) => handleDeleteNote(e, note.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  const renderFolder = (folder: FolderItem, depth: number = 0) => {
    const isExpanded = folder.isExpanded;
    return (
      <div key={folder.id}>
        <div
          className="flex items-center group"
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          <motion.button
            onClick={() => toggleFolder(folder.id)}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
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
            <span className="text-sm font-medium">{folder.title}</span>
          </motion.button>
          
          <motion.button
            initial={{ opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => handleAddNote(folder.id)}
            className="p-1.5 rounded-md hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity mr-2"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
          </motion.button>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {folder.children.length > 0 ? (
                folder.children.map((child) => renderNote(child, depth + 1))
              ) : (
                <div style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }} className="text-xs text-slate-400 py-1 font-italic">
                  Empty folder (add a note)
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 h-full bg-[#FAFDF9] border-r border-slate-200 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <FolderOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <h2 className="font-bold text-slate-800">My Spellbooks</h2>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {isLoading ? (
          <div className="p-4 flex justify-center">
            <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          folders.map((folder) => renderFolder(folder))
        )}
      </div>

      {/* Add Folder Button */}
      <div className="p-3 border-t border-slate-100">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleAddFolder}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>New Spellbook</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
