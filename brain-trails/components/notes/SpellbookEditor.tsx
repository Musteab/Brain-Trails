"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { forwardRef, useImperativeHandle, useCallback, useState, useEffect, useRef } from "react";
import { Editor } from "@tiptap/core";
import SlashCommandMenu from "./SlashCommandMenu";
import "./spellbook-editor.css";

// Welcome content for new notes
const welcomeContent = `
<h1>Welcome to Your Spellbook</h1>
<p>This is your magical grimoire for capturing knowledge.</p>

<h2>Slash Commands</h2>
<p>Type <strong>/</strong> anywhere to summon the command menu:</p>
<ul>
  <li><strong>/heading1</strong> - Large chapter headings</li>
  <li><strong>/heading2</strong> - Section headings</li>
  <li><strong>/bullet</strong> - Bullet lists</li>
  <li><strong>/code</strong> - Code incantations</li>
</ul>

<h2>AI Familiar</h2>
<p>Your AI assistant waits in the sidebar. Ask it to:</p>
<ul>
  <li>Summarize your notes</li>
  <li>Generate quiz questions</li>
  <li>Rewrite for exam preparation</li>
</ul>

<blockquote>
  <p>Knowledge is the beginning of all magic.</p>
</blockquote>

<p>Start writing below and let the magic flow...</p>
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

    const editor = useEditor({
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: "Type / for commands...",
          emptyEditorClass: "is-editor-empty",
        }),
      ],
      content: initialContent || welcomeContent,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "prose prose-slate max-w-none focus:outline-none min-h-[500px] px-2",
        },
        handleKeyDown: (view, event) => {
          // Close menu on escape
          if (event.key === "Escape" && slashMenuOpen) {
            setSlashMenuOpen(false);
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor }) => {
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
