/**
 * WikiLink TipTap Extension
 * 
 * Enables [[wiki-style]] linking between notes.
 * - Renders as clickable links
 * - Shows autocomplete when typing [[
 * - Stores note title and ID as attributes
 */
import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// WikiLink mark extension
const WikiLink = Mark.create({
  name: 'wikiLink',

  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {},
      onLinkClick: () => {},
    };
  },

  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: element => element.getAttribute('data-note-id'),
        renderHTML: attributes => {
          if (!attributes.noteId) return {};
          return { 'data-note-id': attributes.noteId };
        },
      },
      noteTitle: {
        default: null,
        parseHTML: element => element.getAttribute('data-note-title'),
        renderHTML: attributes => {
          if (!attributes.noteTitle) return {};
          return { 'data-note-title': attributes.noteTitle };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-wiki-link]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-wiki-link': '',
        class: 'wiki-link',
        style: 'color: var(--primary-color, #6366f1); cursor: pointer; text-decoration: underline; text-decoration-style: dotted;',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setWikiLink: (attributes) => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      unsetWikiLink: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});

export default WikiLink;

// Plugin key for the wiki link autocomplete
export const WikiLinkPluginKey = new PluginKey('wikiLinkAutocomplete');

/**
 * Creates a ProseMirror plugin that detects [[ patterns and shows autocomplete
 */
export function createWikiLinkPlugin(options = {}) {
  const { onStartSuggestion, onUpdateSuggestion, onEndSuggestion } = options;

  return new Plugin({
    key: WikiLinkPluginKey,

    state: {
      init() {
        return { active: false, query: '', from: 0, to: 0 };
      },
      apply(tr, prev) {
        const { selection } = tr;
        const { $from } = selection;
        
        // Get text before cursor
        const textBefore = $from.parent.textBetween(0, $from.parentOffset, null, '\ufffc');
        
        // Check for [[ pattern
        const match = textBefore.match(/\[\[([^\]]*?)$/);
        
        if (match) {
          const query = match[1];
          const from = $from.pos - query.length - 2; // Position of [[
          const to = $from.pos;
          
          return { active: true, query, from, to };
        }
        
        return { active: false, query: '', from: 0, to: 0 };
      },
    },

    view(view) {
      return {
        update(view, prevState) {
          const prev = WikiLinkPluginKey.getState(prevState);
          const next = WikiLinkPluginKey.getState(view.state);

          // State changed
          if (prev.active !== next.active || prev.query !== next.query) {
            if (next.active && !prev.active) {
              onStartSuggestion?.({ query: next.query, from: next.from, to: next.to });
            } else if (!next.active && prev.active) {
              onEndSuggestion?.();
            } else if (next.active && next.query !== prev.query) {
              onUpdateSuggestion?.({ query: next.query, from: next.from, to: next.to });
            }
          }
        },
      };
    },
  });
}
