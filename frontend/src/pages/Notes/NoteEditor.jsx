/**
 * TipTap-based Note Editor (Enhanced)
 *
 * Rich text editor with:
 * - Headings, lists, checklists
 * - Bold, italic, underline, code
 * - Slash commands (/heading, /bullet, etc.)
 * - [[Wiki-style]] note linking
 * - Block-level drag handles (future)
 */
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
  Box,
  IconButton,
  Paper,
  Divider,
  useTheme,
  alpha,
  Portal,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  Code,
} from '@mui/icons-material';

// Import custom extensions
import SlashCommands, { DEFAULT_SLASH_COMMANDS } from '../../components/editor/SlashCommands';
import SlashCommandMenu from '../../components/editor/SlashCommandMenu';
import WikiLink from '../../components/editor/WikiLink';
import WikiLinkSuggestion from '../../components/editor/WikiLinkSuggestion';

const lowlight = createLowlight(common);

export default function NoteEditor({ content, onChange, noteId, onLinkClick }) {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Slash command state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuProps, setSlashMenuProps] = useState(null);
  const slashMenuRef = useRef(null);
  
  // Wiki link state
  const [wikiLinkOpen, setWikiLinkOpen] = useState(false);
  const [wikiLinkQuery, setWikiLinkQuery] = useState('');
  const [wikiLinkPosition, setWikiLinkPosition] = useState(null);
  const [wikiLinkRange, setWikiLinkRange] = useState(null);
  const wikiLinkRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
      }),
      Placeholder.configure({
        placeholder: 'Start typing or press "/" for commands...',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Underline,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      WikiLink.configure({
        onLinkClick: (linkedNoteId, noteTitle) => {
          if (onLinkClick) {
            onLinkClick(linkedNoteId, noteTitle);
          } else if (linkedNoteId) {
            navigate(`/notes/${linkedNoteId}`);
          }
        },
      }),
      SlashCommands.configure({
        commands: DEFAULT_SLASH_COMMANDS,
        onOpen: (props) => {
          setSlashMenuOpen(true);
          setSlashMenuProps(props);
        },
        onUpdate: (props) => {
          setSlashMenuProps(props);
        },
        onClose: () => {
          setSlashMenuOpen(false);
          setSlashMenuProps(null);
        },
        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            setSlashMenuOpen(false);
            return true;
          }
          return slashMenuRef.current?.onKeyDown(props) || false;
        },
      }),
    ],
    content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'note-editor-content',
      },
      handleKeyDown: (view, event) => {
        // Handle wiki link keyboard events
        if (wikiLinkOpen) {
          const handled = wikiLinkRef.current?.onKeyDown({ event });
          if (handled) return true;
        }
        return false;
      },
    },
  });

  // Wiki link detection
  useEffect(() => {
    if (!editor) return;

    const checkForWikiLink = () => {
      const { selection } = editor.state;
      const { $from } = selection;
      
      // Get text before cursor
      const textBefore = $from.parent.textBetween(0, $from.parentOffset, null, '\ufffc');
      
      // Check for [[ pattern
      const match = textBefore.match(/\[\[([^\]]*?)$/);
      
      if (match) {
        const query = match[1];
        const from = $from.pos - query.length - 2;
        const to = $from.pos;
        
        // Get cursor position for menu
        const coords = editor.view.coordsAtPos($from.pos);
        
        setWikiLinkOpen(true);
        setWikiLinkQuery(query);
        setWikiLinkPosition(coords);
        setWikiLinkRange({ from, to });
      } else {
        setWikiLinkOpen(false);
        setWikiLinkQuery('');
        setWikiLinkPosition(null);
        setWikiLinkRange(null);
      }
    };

    editor.on('selectionUpdate', checkForWikiLink);
    editor.on('update', checkForWikiLink);

    return () => {
      editor.off('selectionUpdate', checkForWikiLink);
      editor.off('update', checkForWikiLink);
    };
  }, [editor]);

  // Handle wiki link selection
  const handleWikiLinkSelect = useCallback(({ noteId: linkedNoteId, noteTitle, create }) => {
    if (!editor || !wikiLinkRange) return;

    // Delete the [[ and query text
    editor.chain()
      .focus()
      .deleteRange({ from: wikiLinkRange.from, to: wikiLinkRange.to })
      .insertContent({
        type: 'text',
        marks: [{
          type: 'wikiLink',
          attrs: { noteId: linkedNoteId, noteTitle },
        }],
        text: noteTitle,
      })
      .insertContent(' ')
      .run();

    setWikiLinkOpen(false);
    setWikiLinkQuery('');
    
    // If user wants to create a new note
    if (create) {
      console.log('Create new note:', noteTitle);
    }
  }, [editor, wikiLinkRange]);

  // Update editor content when prop changes (e.g., switching notes)
  useEffect(() => {
    if (editor && content) {
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(content);
      if (currentContent !== newContent) {
        editor.commands.setContent(content, false);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <Box
      sx={{
        maxWidth: 800,
        mx: 'auto',
        position: 'relative',
        '& .note-editor-content': {
          outline: 'none',
          minHeight: '400px',
          '& p': {
            margin: '0.5em 0',
          },
          '& h1': {
            fontSize: '1.75rem',
            fontWeight: 700,
            margin: '1em 0 0.5em',
          },
          '& h2': {
            fontSize: '1.4rem',
            fontWeight: 600,
            margin: '0.8em 0 0.4em',
          },
          '& h3': {
            fontSize: '1.15rem',
            fontWeight: 600,
            margin: '0.6em 0 0.3em',
          },
          '& ul, & ol': {
            paddingLeft: '1.5em',
            margin: '0.5em 0',
          },
          '& li': {
            margin: '0.25em 0',
          },
          '& ul[data-type="taskList"]': {
            listStyle: 'none',
            paddingLeft: 0,
            '& li': {
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5em',
              '& > label': {
                marginTop: '0.2em',
              },
              '& > div': {
                flex: 1,
              },
            },
          },
          '& pre': {
            background: alpha(theme.palette.text.primary, 0.05),
            borderRadius: theme.shape.borderRadius,
            padding: '0.75em 1em',
            fontFamily: 'monospace',
            fontSize: '0.9em',
            overflow: 'auto',
            margin: '0.5em 0',
          },
          '& code': {
            background: alpha(theme.palette.text.primary, 0.08),
            borderRadius: 3,
            padding: '0.1em 0.3em',
            fontFamily: 'monospace',
            fontSize: '0.9em',
          },
          '& pre code': {
            background: 'none',
            padding: 0,
          },
          '& blockquote': {
            borderLeft: `3px solid ${theme.palette.primary.main}`,
            paddingLeft: '1em',
            margin: '0.5em 0',
            color: theme.palette.text.secondary,
            fontStyle: 'italic',
          },
          '& hr': {
            border: 'none',
            borderTop: `1px solid ${theme.palette.divider}`,
            margin: '1em 0',
          },
          '& p.is-editor-empty:first-child::before': {
            content: 'attr(data-placeholder)',
            color: theme.palette.text.disabled,
            pointerEvents: 'none',
            float: 'left',
            height: 0,
          },
          // Wiki link styling
          '& .wiki-link': {
            color: theme.palette.primary.main,
            cursor: 'pointer',
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
            '&:hover': {
              textDecorationStyle: 'solid',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 2,
            },
          },
        },
      }}
    >
      {/* Bubble menu for text formatting */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 100 }}
        shouldShow={({ editor, state }) => {
          const { selection } = state;
          const { empty } = selection;
          return !empty && !editor.isActive('codeBlock');
        }}
      >
        <Paper elevation={4} sx={{ p: 0.5, display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleBold().run()}
            color={editor.isActive('bold') ? 'primary' : 'default'}
          >
            <FormatBold fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            color={editor.isActive('italic') ? 'primary' : 'default'}
          >
            <FormatItalic fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            color={editor.isActive('underline') ? 'primary' : 'default'}
          >
            <FormatUnderlined fontSize="small" />
          </IconButton>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().toggleCode().run()}
            color={editor.isActive('code') ? 'primary' : 'default'}
          >
            <Code fontSize="small" />
          </IconButton>
        </Paper>
      </BubbleMenu>

      {/* Slash command menu */}
      {slashMenuOpen && slashMenuProps && (
        <Portal>
          <SlashCommandMenu
            ref={slashMenuRef}
            items={slashMenuProps.items}
            command={slashMenuProps.command}
            clientRect={slashMenuProps.clientRect}
          />
        </Portal>
      )}

      {/* Wiki link suggestion menu */}
      {wikiLinkOpen && (
        <Portal>
          <WikiLinkSuggestion
            ref={wikiLinkRef}
            query={wikiLinkQuery}
            position={wikiLinkPosition}
            onSelect={handleWikiLinkSelect}
            onClose={() => setWikiLinkOpen(false)}
          />
        </Portal>
      )}

      {/* Editor content */}
      <EditorContent editor={editor} />
    </Box>
  );
}
