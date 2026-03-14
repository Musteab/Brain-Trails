"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  CheckSquare,
  Type,
  FileCode,
} from "lucide-react";
import { Editor } from "@tiptap/core";

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: (editor: Editor) => void;
  keywords: string[];
}

const slashCommands: SlashCommand[] = [
  {
    id: "paragraph",
    label: "Text",
    description: "Plain text paragraph",
    icon: <Type className="w-4 h-4" />,
    keywords: ["text", "paragraph", "p"],
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: "heading1",
    label: "Heading 1",
    description: "Large section heading",
    icon: <Heading1 className="w-4 h-4" />,
    keywords: ["h1", "heading", "title", "large"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "heading2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: <Heading2 className="w-4 h-4" />,
    keywords: ["h2", "heading", "subtitle", "medium"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "heading3",
    label: "Heading 3",
    description: "Small section heading",
    icon: <Heading3 className="w-4 h-4" />,
    keywords: ["h3", "heading", "small"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "bullet",
    label: "Bullet List",
    description: "Create a bullet point list",
    icon: <List className="w-4 h-4" />,
    keywords: ["bullet", "list", "ul", "unordered"],
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "numbered",
    label: "Numbered List",
    description: "Create a numbered list",
    icon: <ListOrdered className="w-4 h-4" />,
    keywords: ["numbered", "list", "ol", "ordered", "number"],
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "todo",
    label: "To-do List",
    description: "Track tasks with checkboxes",
    icon: <CheckSquare className="w-4 h-4" />,
    keywords: ["todo", "task", "checkbox", "check"],
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "quote",
    label: "Quote",
    description: "Capture a quote or callout",
    icon: <Quote className="w-4 h-4" />,
    keywords: ["quote", "blockquote", "callout"],
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "code",
    label: "Code",
    description: "Inline code snippet",
    icon: <Code className="w-4 h-4" />,
    keywords: ["code", "inline", "snippet"],
    action: (editor) => editor.chain().focus().toggleCode().run(),
  },
  {
    id: "codeblock",
    label: "Code Block",
    description: "Multi-line code block",
    icon: <FileCode className="w-4 h-4" />,
    keywords: ["codeblock", "code", "pre", "block"],
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "divider",
    label: "Divider",
    description: "Horizontal line separator",
    icon: <Minus className="w-4 h-4" />,
    keywords: ["divider", "hr", "line", "separator", "horizontal"],
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
];

interface SlashCommandMenuProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  filterText: string;
  onExecuteSelected?: () => void;
}

export default function SlashCommandMenu({
  editor,
  isOpen,
  onClose,
  position,
  filterText,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filteredCommands = slashCommands.filter((cmd) => {
    const search = filterText.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(search) ||
      cmd.description.toLowerCase().includes(search) ||
      cmd.keywords.some((k) => k.includes(search))
    );
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset selection when filter changes
    setSelectedIndex(0);
  }, [filterText]);

  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  const executeCommand = useCallback(
    (command: SlashCommand) => {
      if (!editor) return;
      
      // Delete the slash and filter text
      const { from } = editor.state.selection;
      const slashStart = from - filterText.length - 1;
      editor.chain().focus().deleteRange({ from: slashStart, to: from }).run();
      
      // Execute the command
      command.action(editor);
      onClose();
    },
    [editor, filterText, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    // Use capture phase to intercept before the editor
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, selectedIndex, filteredCommands, executeCommand, onClose]);

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute z-50 w-72 max-h-80 overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200"
        style={{ top: position.top, left: position.left }}
      >
        <div className="p-2">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Blocks
          </div>
          <div className="space-y-0.5">
            {filteredCommands.map((command, index) => (
              <motion.button
                key={command.id}
                ref={(el) => { itemRefs.current[index] = el; }}
                onClick={() => executeCommand(command)}
                onMouseEnter={() => setSelectedIndex(index)}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-violet-50 text-violet-700"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    index === selectedIndex
                      ? "bg-violet-100 text-violet-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {command.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{command.label}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {command.description}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px]">Up</kbd>
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px]">Down</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px]">Enter</kbd>
              <span>select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px]">Esc</kbd>
              <span>close</span>
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
