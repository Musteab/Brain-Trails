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
  Search,
  Star,
  StarOff,
  BookOpen,
  ChevronLeft,
  Wand2,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
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
  color?: string;
}

interface GrimoireSidebarProps {
  onSelectNote: (noteId: string) => void;
  selectedNoteId?: string;
  onCloseMobile?: () => void;
}

// Grimoire folder colors and emojis
const GRIMOIRE_EMOJIS = ["📕", "📗", "📘", "📙", "📓", "📔", "📖", "✨"];
const GRIMOIRE_COLORS = [
  "from-red-600 to-red-700",
  "from-green-600 to-green-700",
  "from-blue-600 to-blue-700",
  "from-amber-600 to-amber-700",
  "from-purple-600 to-purple-700",
  "from-pink-600 to-pink-700",
  "from-indigo-600 to-indigo-700",
  "from-violet-600 to-violet-700",
];

export default function GrimoireSidebar({
  onSelectNote,
  selectedNoteId,
  onCloseMobile,
}: GrimoireSidebarProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isSun = theme === "sun";
  const { addToast } = useUIStore();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [notesList, setNotesList] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"folders" | "favorites">("folders");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["root"])
  );

  useEffect(() => {
    if (!user) return;

    const fetchNotes = async () => {
      const { data, error } = await (supabase.from("notes") as any)
        .select("id, title, folder, is_pinned, tags, parent_folder_id, updated_at")
        .eq("user_id", user.id)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching notes:", error);
      } else if (data) {
        setNotesList(data as unknown as NoteItem[]);
        const grouped = data.reduce(
          (acc, note) => {
            const folderName = note.folder || "root";
            if (!acc[folderName]) acc[folderName] = [];
            acc[folderName].push(note as unknown as NoteItem);
            return acc;
          },
          {} as Record<string, NoteItem[]>
        );

        const newFolders: FolderItem[] = Object.keys(grouped).map((name, idx) => ({
          id: name,
          title: name === "root" ? "📚 Spellbook" : name,
          type: "folder",
          children: grouped[name],
          isExpanded: name === "root",
          color: GRIMOIRE_COLORS[idx % GRIMOIRE_COLORS.length],
        }));

        newFolders.sort((a, b) =>
          a.id === "root" ? -1 : b.id === "root" ? 1 : a.title.localeCompare(b.title)
        );

        setFolders(newFolders);
      }
      setIsLoading(false);
    };

    fetchNotes();

    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
          filter: `user_id=eq.${user.id}`,
        },
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
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleCreateNote = async () => {
    if (!user) return;

    const { data, error } = await (supabase.from("notes") as any)
      .insert({
        user_id: user.id,
        title: "Untitled Note",
        folder: "root",
        content_html: JSON.stringify({ left: "", right: "" }),
      })
      .select("id")
      .single();

    if (error) {
      addToast("Failed to create note", "error");
      return;
    }

    if (data) {
      onSelectNote(data.id);
      addToast("New note created!", "success");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;

    const { error } = await (supabase.from("notes") as any)
      .delete()
      .eq("id", noteId);

    if (error) {
      addToast("Failed to delete note", "error");
    } else {
      addToast("Note deleted", "success");
      if (selectedNoteId === noteId) {
        onSelectNote("");
      }
    }
  };

  const handleTogglePinned = async (note: NoteItem) => {
    const { error } = await (supabase.from("notes") as any)
      .update({ is_pinned: !note.is_pinned })
      .eq("id", note.id);

    if (error) {
      addToast("Failed to update note", "error");
    }
  };

  const filteredFolders =
    activeTab === "folders"
      ? folders
      : folders.map((folder) => ({
          ...folder,
          children: folder.children.filter((note) => note.is_pinned),
        }));

  const pinnedNotes = notesList.filter((note) => note.is_pinned);
  const hasFilteredContent =
    activeTab === "favorites" ? pinnedNotes.length > 0 : true;

  return (
    <div
      className={`h-full w-64 flex flex-col border-r ${
        isSun
          ? "bg-gradient-to-b from-amber-50 to-orange-50 border-slate-200"
          : "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-slate-700"
      }`}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 border-b flex items-center justify-between ${
          isSun ? "border-slate-200" : "border-slate-700"
        }`}
      >
        <div className="flex items-center gap-2">
          <BookOpen className={`w-5 h-5 ${isSun ? "text-amber-700" : "text-amber-400"}`} />
          <h2 className={`font-bold text-sm ${isSun ? "text-slate-800" : "text-white"}`}>
            Grimoires
          </h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onCloseMobile}
          className={`md:hidden p-1 rounded transition-colors ${
            isSun
              ? "hover:bg-slate-100 text-slate-600"
              : "hover:bg-slate-700 text-slate-400"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`p-3 border-b ${isSun ? "border-slate-200" : "border-slate-700"}`}
      >
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
            isSun
              ? "bg-white/50 border border-slate-200"
              : "bg-slate-800/50 border border-slate-700"
          }`}
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 bg-transparent outline-none text-xs placeholder:text-slate-400 ${
              isSun ? "text-slate-800" : "text-white"
            }`}
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <div
        className={`flex gap-2 px-3 py-2 border-b ${
          isSun ? "border-slate-200" : "border-slate-700"
        }`}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab("folders")}
          className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-all ${
            activeTab === "folders"
              ? isSun
                ? "bg-amber-200 text-amber-800"
                : "bg-amber-500/30 text-amber-300"
              : isSun
              ? "text-slate-600 hover:bg-slate-100"
              : "text-slate-400 hover:bg-slate-700"
          }`}
        >
          <Folder className="w-3 h-3 inline mr-1" />
          All
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab("favorites")}
          className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-all ${
            activeTab === "favorites"
              ? isSun
                ? "bg-amber-200 text-amber-800"
                : "bg-amber-500/30 text-amber-300"
              : isSun
              ? "text-slate-600 hover:bg-slate-100"
              : "text-slate-400 hover:bg-slate-700"
          }`}
        >
          <Star className="w-3 h-3 inline mr-1" />
          Pinned
        </motion.button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`w-4 h-4 border-2 rounded-full ${
                isSun ? "border-amber-200 border-t-amber-700" : "border-amber-500/20 border-t-amber-400"
              }`}
            />
          </div>
        ) : hasFilteredContent ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 space-y-2"
          >
            {filteredFolders.map((folder) => (
              <motion.div key={folder.id} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                {/* Folder Header */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleFolder(folder.id)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all group ${
                    folder.children.length === 0
                      ? "opacity-50 cursor-default"
                      : isSun
                      ? "hover:bg-slate-100"
                      : "hover:bg-slate-700"
                  }`}
                  disabled={folder.children.length === 0}
                >
                  <motion.div
                    animate={{ rotate: expandedFolders.has(folder.id) ? 90 : 0 }}
                    className={`flex-shrink-0 ${
                      folder.children.length === 0 ? "opacity-0" : ""
                    }`}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </motion.div>

                  {/* Folder Emoji/Icon */}
                  <div className="text-lg flex-shrink-0">
                    {folder.id === "root" ? "📚" : GRIMOIRE_EMOJIS[
                      Object.keys(folders).indexOf(folder.id) %
                        GRIMOIRE_EMOJIS.length
                    ]}
                  </div>

                  {/* Folder Name */}
                  <span
                    className={`text-xs font-semibold flex-1 text-left truncate ${
                      isSun ? "text-slate-800" : "text-white"
                    }`}
                  >
                    {folder.title}
                  </span>

                  {/* Note Count */}
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      isSun
                        ? "bg-slate-200 text-slate-700"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {folder.children.length}
                  </span>
                </motion.button>

                {/* Notes List */}
                <AnimatePresence>
                  {expandedFolders.has(folder.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1 pl-4"
                    >
                      {folder.children
                        .filter(
                          (note) =>
                            !searchQuery ||
                            note.title
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase())
                        )
                        .map((note) => (
                          <motion.button
                            key={note.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              onSelectNote(note.id);
                              onCloseMobile?.();
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all group text-xs ${
                              selectedNoteId === note.id
                                ? isSun
                                  ? "bg-amber-200 text-amber-900"
                                  : "bg-amber-500/40 text-amber-100"
                                : isSun
                                ? "text-slate-700 hover:bg-slate-100"
                                : "text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            <FileText className="w-3 h-3 flex-shrink-0" />
                            <span className="flex-1 truncate text-left">
                              {note.title}
                            </span>

                            {/* Pin Button */}
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePinned(note);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              {note.is_pinned ? (
                                <Star className="w-3 h-3 fill-current" />
                              ) : (
                                <StarOff className="w-3 h-3" />
                              )}
                            </motion.button>

                            {/* Delete Button */}
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNote(note.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </motion.button>
                          </motion.button>
                        ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p
              className={`text-xs ${isSun ? "text-slate-400" : "text-slate-500"}`}
            >
              {activeTab === "favorites" ? "No pinned notes" : "No notes yet"}
            </p>
          </div>
        )}
      </div>

      {/* Footer - Create Note Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCreateNote}
        className={`m-3 px-3 py-2 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-all ${
          isSun
            ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white"
            : "bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white"
        }`}
      >
        <Plus className="w-4 h-4" />
        New Note
      </motion.button>
    </div>
  );
}
