"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { forwardRef, useImperativeHandle, useCallback, useState, useEffect, useRef } from "react";
import { Editor } from "@tiptap/core";

import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import { ToggleList, Callout } from './extensions';
import { useGameStore } from '@/stores';
import { useAuth } from "@/context/AuthContext";
import { useUIStore } from "@/stores";

import SlashCommandMenu from "./SlashCommandMenu";
import "./spellbook-editor.css";

// Welcome content for new notes
const welcomeContent = `
<h1>Welcome to Your Spellbook 📖</h1>
<p>This is your magical grimoire for capturing knowledge with enhanced Notion-style editing.</p>

<h2>✨ Slash Commands</h2>
<p>Type <strong>/</strong> anywhere to summon the command menu:</p>
<ul>
  <li><strong>/heading1</strong> - Large chapter headings</li>
  <li><strong>/heading2</strong> - Section headings</li>
  <li><strong>/bullet</strong> - Bullet lists</li>
  <li><strong>/todo</strong> - Task lists with checkboxes</li>
  <li><strong>/table</strong> - Insert tables</li>
  <li><strong>/code</strong> - Code blocks with syntax highlighting</li>
  <li><strong>/callout</strong> - Ancient Insights, Scrolls of Warning, Tomes of Knowledge</li>
</ul>

<h2>⌨️ Keyboard Shortcuts</h2>
<p>Master these shortcuts for faster writing:</p>
<ul>
  <li><strong>Ctrl/Cmd + B</strong> - Bold text</li>
  <li><strong>Ctrl/Cmd + I</strong> - Italic text</li>
  <li><strong>Ctrl/Cmd + U</strong> - Underline text</li>
  <li><strong>Ctrl/Cmd + E</strong> - Inline code</li>
  <li><strong>Ctrl/Cmd + K</strong> - Add link</li>
  <li><strong>Ctrl/Cmd + Shift + H</strong> - Highlight text</li>
  <li><strong>Ctrl/Cmd + Z</strong> - Undo</li>
  <li><strong>Ctrl/Cmd + Shift + Z</strong> - Redo</li>
</ul>

<h2>🤖 AI Familiar</h2>
<p>Your AI assistant waits in the sidebar. Ask it to:</p>
<ul>
  <li>Summarize your notes</li>
  <li>Generate quiz questions</li>
  <li>Rewrite for exam preparation</li>
  <li>Explain complex concepts</li>
</ul>

<blockquote>
  <p><em>"Knowledge is the beginning of all magic."</em></p>
</blockquote>

<p>Start writing below and let the magic flow... ✍️</p>
`;

interface SpellbookEditorProps {
  onContentChange?: (html: string, text: string) => void;
  initialContent?: string;
}

export interface SpellbookEditorRef {
  editor: Editor | null;
  insertContent: (html: string) => void;
}

const SpellbookEditor = forwardRef<SpellbookEditorRef, SpellbookEditorProps>(
  function SpellbookEditor({ onContentChange, initialContent }, ref) {
    const [slashMenuOpen, setSlashMenuOpen] = useState(false);
    const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
    const [slashFilterText, setSlashFilterText] = useState("");
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const { awardXp } = useGameStore();
    const { user } = useAuth();
    const { addToast } = useUIStore();
    const prevCheckedCount = useRef(0);

    const editor = useEditor({
      extensions: [
        
        StarterKit.configure({
          history: {
            depth: 100,
          },
        }),
        Placeholder.configure({
          placeholder: "Type / for commands or start writing...",
          emptyEditorClass: "is-editor-empty",
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-violet-600 dark:text-violet-400 underline hover:text-violet-700 dark:hover:text-violet-300 cursor-pointer',
          },
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Underline,
        Subscript,
        Superscript,
        TaskList,
        TaskItem.configure({
          nested: true,
          onReadOnlyChecked: () => {
            return false;
          },
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        Highlight.configure({
          multicolor: true,
        }),
        Typography,
        CharacterCount,
        ToggleList,
        Callout,

      ],
      content: initialContent || welcomeContent,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-2",
        },
        handleKeyDown: (view, event) => {
          // Close menu on escape
          if (event.key === "Escape" && slashMenuOpen) {
            setSlashMenuOpen(false);
            return true;
          }
          
          // Custom keyboard shortcuts
          const isMod = event.ctrlKey || event.metaKey;
          
          // Bold: Ctrl/Cmd + B
          if (isMod && event.key === 'b') {
            event.preventDefault();
            editor?.chain().focus().toggleBold().run();
            return true;
          }
          
          // Italic: Ctrl/Cmd + I
          if (isMod && event.key === 'i') {
            event.preventDefault();
            editor?.chain().focus().toggleItalic().run();
            return true;
          }
          
          // Underline: Ctrl/Cmd + U
          if (isMod && event.key === 'u') {
            event.preventDefault();
            editor?.chain().focus().toggleUnderline().run();
            return true;
          }
          
          // Code: Ctrl/Cmd + E
          if (isMod && event.key === 'e') {
            event.preventDefault();
            editor?.chain().focus().toggleCode().run();
            return true;
          }
          
          // Highlight: Ctrl/Cmd + Shift + H
          if (isMod && event.shiftKey && event.key === 'H') {
            event.preventDefault();
            editor?.chain().focus().toggleHighlight().run();
            return true;
          }
          
          // Link: Ctrl/Cmd + K
          if (isMod && event.key === 'k') {
            event.preventDefault();
            const url = window.prompt('Enter URL:');
            if (url) {
              editor?.chain().focus().setLink({ href: url }).run();
            }
            return true;
          }
          
          return false;
        },
      },
      
      
      onUpdate: ({ editor, transaction }) => {
        if (transaction.docChanged) {
          // Count checked tasks
          let checkedCount = 0;
          editor.state.doc.descendants((node) => {
            if (node.type.name === 'taskItem' && node.attrs.checked) {
              checkedCount++;
            }
          });

          if (checkedCount > prevCheckedCount.current) {
            const diff = checkedCount - prevCheckedCount.current;
            if (user) {
              awardXp(user.id, diff);
              addToast(`Task completed! +${diff} XP`, "success");
            }
          }
          prevCheckedCount.current = checkedCount;
        }

        if (onContentChange) {


          onContentChange(editor.getHTML(), editor.getText());
        }
        
        // Check for slash command trigger
        const { from } = editor.state.selection;
        const textBefore = editor.state.doc.textBetween(
          Math.max(0, from - 20),
          from,
          "\n"
        );
        
        const slashMatch = textBefore.match(/\/(\w*)$/);
        
        if (slashMatch) {
          setSlashFilterText(slashMatch[1] || "");
          
          // Get cursor position for menu placement (relative to editor container)
          const coords = editor.view.coordsAtPos(from);
          const editorRect = editorContainerRef.current?.getBoundingClientRect();
          
          if (editorRect) {
            setSlashMenuPosition({
              top: coords.bottom - editorRect.top + 8,
              left: coords.left - editorRect.left,
            });
          } else {
            setSlashMenuPosition({
              top: coords.bottom + 8,
              left: coords.left,
            });
          }
          setSlashMenuOpen(true);
        } else {
          setSlashMenuOpen(false);
          setSlashFilterText("");
        }
      },
    });

    // Close slash menu when clicking outside
    useEffect(() => {
      const handleClickOutside = () => {
        if (slashMenuOpen) {
          setSlashMenuOpen(false);
        }
      };
      
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, [slashMenuOpen]);

    const insertContent = useCallback(
      (html: string) => {
        if (editor) {
          editor.commands.setContent(html);
        }
      },
      [editor]
    );

    useImperativeHandle(ref, () => ({
      editor,
      insertContent,
    }), [editor, insertContent]);

    return (
      <div className="relative">
        {/* Editor Content */}
        <div ref={editorContainerRef}>
          <EditorContent editor={editor} />
        </div>

        {/* Slash Command Menu */}
        <SlashCommandMenu
          editor={editor}
          isOpen={slashMenuOpen}
          onClose={() => setSlashMenuOpen(false)}
          position={slashMenuPosition}
          filterText={slashFilterText}
        />
      </div>
    );
  }
);

export default SpellbookEditor;
export { welcomeContent };
