"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  Folder,
  FileText,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit2,
} from "lucide-react";

export interface NoteItem {
  id: string;
  title: string;
  type: "note";
}

export interface FolderItem {
  id: string;
  title: string;
  type: "folder";
  children: (NoteItem | FolderItem)[];
  isExpanded?: boolean;
}

export type TreeItem = NoteItem | FolderItem;

interface NotesSidebarProps {
  onSelectNote: (noteId: string) => void;
  selectedNoteId?: string;
}

const initialTree: FolderItem[] = [
  {
    id: "folder-1",
    title: "Mathematics",
    type: "folder",
    isExpanded: true,
    children: [
      { id: "note-1", title: "Chapter 3 Notes", type: "note" },
      { id: "note-2", title: "Formula Sheet", type: "note" },
    ],
  },
  {
    id: "folder-2",
    title: "Physics",
    type: "folder",
    isExpanded: false,
    children: [
      { id: "note-3", title: "Mechanics", type: "note" },
      { id: "note-4", title: "Thermodynamics", type: "note" },
    ],
  },
  {
    id: "folder-3",
    title: "Biology",
    type: "folder",
    isExpanded: false,
    children: [
      { id: "note-5", title: "Cell Structure", type: "note" },
    ],
  },
];

export default function NotesSidebar({ onSelectNote, selectedNoteId }: NotesSidebarProps) {
  const [tree, setTree] = useState<FolderItem[]>(initialTree);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string } | null>(null);

  const toggleFolder = (folderId: string) => {
    setTree((prev) =>
      prev.map((folder) =>
        folder.id === folderId
          ? { ...folder, isExpanded: !folder.isExpanded }
          : folder
      )
    );
  };

  const handleAddFolder = () => {
    const newFolder: FolderItem = {
      id: `folder-${Date.now()}`,
      title: "New Folder",
      type: "folder",
      isExpanded: false,
      children: [],
    };
    setTree((prev) => [...prev, newFolder]);
  };

  const handleAddNote = (folderId: string) => {
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: "Untitled Note",
      type: "note",
    };
    setTree((prev) =>
      prev.map((folder) =>
        folder.id === folderId
          ? { ...folder, children: [...folder.children, newNote], isExpanded: true }
          : folder
      )
    );
    onSelectNote(newNote.id);
  };

  const renderNote = (note: NoteItem, depth: number = 1) => {
    const isSelected = selectedNoteId === note.id;
    return (
      <motion.button
        key={note.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => onSelectNote(note.id)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
          isSelected
            ? "bg-emerald-100 text-emerald-700"
            : "hover:bg-slate-100 text-slate-600"
        }`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <FileText className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
        <span className="text-sm truncate">{note.title}</span>
      </motion.button>
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
              {folder.children.map((child) =>
                child.type === "note"
                  ? renderNote(child as NoteItem, depth + 1)
                  : renderFolder(child as FolderItem, depth + 1)
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
          <h2 className="font-bold text-slate-800">My Notes</h2>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {tree.map((folder) => renderFolder(folder))}
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
          <span>New Folder</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
