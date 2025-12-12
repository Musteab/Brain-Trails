/**
 * Slash Commands TipTap Extension
 * 
 * Provides a robust slash command system with:
 * - Type "/" to trigger command menu
 * - Arrow key navigation
 * - Enter to select
 * - Escape to close
 * - Fuzzy search filtering
 */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';

// Default slash commands
export const DEFAULT_SLASH_COMMANDS = [
  {
    id: 'heading1',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: 'H1',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: 'H2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: 'H3',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    id: 'paragraph',
    label: 'Paragraph',
    description: 'Normal text',
    icon: 'P',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('paragraph').run();
    },
  },
  {
    id: 'bulletList',
    label: 'Bullet List',
    description: 'Unordered list',
    icon: '•',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    id: 'orderedList',
    label: 'Numbered List',
    description: 'Ordered list with numbers',
    icon: '1.',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    id: 'taskList',
    label: 'Task List',
    description: 'Checklist with checkboxes',
    icon: '☑',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    id: 'blockquote',
    label: 'Quote',
    description: 'Blockquote for citations',
    icon: '"',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    id: 'codeBlock',
    label: 'Code Block',
    description: 'Syntax highlighted code',
    icon: '</>',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    id: 'horizontalRule',
    label: 'Divider',
    description: 'Horizontal line separator',
    icon: '—',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    id: 'table',
    label: 'Table',
    description: 'Insert a table',
    icon: '▦',
    command: ({ editor, range }) => {
      // Table requires @tiptap/extension-table
      if (editor.commands.insertTable) {
        editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3 }).run();
      } else {
        // Fallback - just delete the slash command
        editor.chain().focus().deleteRange(range).run();
      }
    },
  },
  {
    id: 'callout',
    label: 'Callout',
    description: 'Highlight important info',
    icon: '💡',
    command: ({ editor, range }) => {
      // Custom callout node would need to be implemented
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
];

// Suggestion plugin key
export const SlashCommandsPluginKey = new PluginKey('slashCommands');

// Create the extension
const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
      commands: DEFAULT_SLASH_COMMANDS,
      onOpen: () => {},
      onClose: () => {},
      onUpdate: () => {},
      onKeyDown: () => false,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: this.options.suggestion.char,
        pluginKey: SlashCommandsPluginKey,
        command: this.options.suggestion.command,
        items: ({ query }) => {
          const commands = this.options.commands || DEFAULT_SLASH_COMMANDS;
          
          if (!query) return commands;
          
          const lowerQuery = query.toLowerCase();
          return commands.filter(
            (item) =>
              item.label.toLowerCase().includes(lowerQuery) ||
              item.description?.toLowerCase().includes(lowerQuery)
          );
        },
        render: () => {
          let component = null;
          let popup = null;

          return {
            onStart: (props) => {
              this.options.onOpen?.(props);
            },
            onUpdate: (props) => {
              this.options.onUpdate?.(props);
            },
            onKeyDown: (props) => {
              return this.options.onKeyDown?.(props) || false;
            },
            onExit: () => {
              this.options.onClose?.();
            },
          };
        },
      }),
    ];
  },
});

export default SlashCommands;
