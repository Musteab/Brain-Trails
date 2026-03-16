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
  AlertTriangle,
  BookOpen,
  Info,
  ChevronRight,
  Table
} from "lucide-react";
import { Editor } from "@tiptap/core";

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "Text" | "Lists" | "Media" | "Advanced";
  action: (editor: Editor) => void;
  keywords: string[];
}

const slashCommands: SlashCommand[] = [
  // Text Category
  {
    id: "paragraph",
    label: "Text",
    description: "Plain text paragraph",
    icon: <Type className="w-4 h-4" />,
    category: "Text",
    keywords: ["text", "paragraph", "p"],
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: "heading1",
    label: "Heading 1",
    description: "Large section heading",
    icon: <Heading1 className="w-4 h-4" />,
    category: "Text",
    keywords: ["h1", "heading", "title", "large"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "heading2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: <Heading2 className="w-4 h-4" />,
    category: "Text",
    keywords: ["h2", "heading", "subtitle", "medium"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "heading3",
    label: "Heading 3",
    description: "Small section heading",
    icon: <Heading3 className="w-4 h-4" />,
    category: "Text",
    keywords: ["h3", "heading", "small"],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },

  // Lists Category
  {
    id: "bullet",
    label: "Bullet List",
    description: "Create a bullet point list",
    icon: <List className="w-4 h-4" />,
    category: "Lists",
    keywords: ["bullet", "list", "ul", "unordered"],
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "numbered",
    label: "Numbered List",
    description: "Create a numbered list",
    icon: <ListOrdered className="w-4 h-4" />,
    category: "Lists",
    keywords: ["numbered", "list", "ol", "ordered", "number"],
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "todo",
    label: "To-do List",
    description: "Track tasks with checkboxes",
    icon: <CheckSquare className="w-4 h-4" />,
    category: "Lists",
    keywords: ["todo", "task", "checkbox", "check"],
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    id: "toggle",
    label: "Toggle List",
    description: "Collapsible section",
    icon: <ChevronRight className="w-4 h-4" />,
    category: "Lists",
    keywords: ["toggle", "collapse", "accordion"],
    action: (editor) => editor.chain().focus().insertContent('<div data-type="toggle-list">Toggle Header</div>').run(),
  },

  // Advanced Category
  {
    id: "callout-info",
    label: "Ancient Insight",
    description: "Standard informative callout",
    icon: <Info className="w-4 h-4 text-blue-500" />,
    category: "Advanced",
    keywords: ["callout", "info", "insight"],
    action: (editor) => editor.chain().focus().insertContent('<div data-type="callout" type="info">Info text</div>').run(),
  },
  {
    id: "callout-warning",
    label: "Scroll of Warning",
    description: "Warning or important callout",
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    category: "Advanced",
    keywords: ["callout", "warning", "scroll", "alert"],
    action: (editor) => editor.chain().focus().insertContent('<div data-type="callout" type="warning">Warning text</div>').run(),
  },
  {
    id: "callout-knowledge",
    label: "Tome of Knowledge",
    description: "Deep knowledge callout",
    icon: <BookOpen className="w-4 h-4 text-purple-500" />,
    category: "Advanced",
    keywords: ["callout", "knowledge", "tome", "book"],
    action: (editor) => editor.chain().focus().insertContent('<div data-type="callout" type="knowledge">Knowledge text</div>').run(),
  },
  {
    id: "quote",
    label: "Quote",
    description: "Capture a quote",
    icon: <Quote className="w-4 h-4" />,
    category: "Advanced",
    keywords: ["quote", "blockquote"],
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "table",
    label: "Table",
    description: "Insert a table",
    icon: <Table className="w-4 h-4" />,
    category: "Advanced",
    keywords: ["table", "grid"],
    action: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    id: "code",
    label: "Code",
    description: "Inline code snippet",
    icon: <Code className="w-4 h-4" />,
    category: "Advanced",
    keywords: ["code", "inline", "snippet"],
    action: (editor) => editor.chain().focus().toggleCode().run(),
  },
  {
    id: "codeblock",
    label: "Code Block",
    description: "Multi-line code block",
    icon: <FileCode className="w-4 h-4" />,
    category: "Advanced",
    keywords: ["codeblock", "code", "pre", "block"],
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "divider",
    label: "Divider",
    description: "Horizontal line separator",
    icon: <Minus className="w-4 h-4" />,
    category: "Advanced",
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
      
      const { from } = editor.state.selection;
      const slashStart = from - filterText.length - 1;
      editor.chain().focus().deleteRange({ from: slashStart, to: from }).run();
      
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

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, selectedIndex, filteredCommands, executeCommand, onClose]);

  if (!isOpen || filteredCommands.length === 0) return null;

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, SlashCommand[]>);

  let globalIndex = 0;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute z-50 w-72 max-h-80 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800"
        style={{ top: position.top, left: position.left }}
      >
        <div className="p-2">
          <div className="space-y-4">
            {Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category}>
                <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider font-[family-name:var(--font-nunito)]">
                  {category}
                </div>
                <div className="space-y-0.5 mt-1">
                  {commands.map((command) => {
                    const currentIndex = globalIndex++;
                    return (
                      <motion.button
                        key={command.id}
                        ref={(el) => { itemRefs.current[currentIndex] = el; }}
                        onClick={() => executeCommand(command)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          currentIndex === selectedIndex
                            ? "bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                            : "hover:bg-slate-50 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            currentIndex === selectedIndex
                              ? "bg-violet-100 text-violet-600 dark:bg-violet-500/30 dark:text-violet-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {command.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm font-[family-name:var(--font-quicksand)]">{command.label}</div>
                          <div className="text-xs text-slate-400 truncate font-[family-name:var(--font-quicksand)]">
                            {command.description}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-b-xl sticky bottom-0">
          <div className="flex items-center gap-4 text-xs text-slate-400 font-[family-name:var(--font-quicksand)]">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Up/Down</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Enter</kbd>
              <span>select</span>
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
