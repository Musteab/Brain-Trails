import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import React from 'react';

const ToggleList = Node.create({
  name: 'toggleList',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      isOpen: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="toggle-list"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toggle-list' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleListComponent);
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ToggleListComponent = (props: any) => {
  const { node, updateAttributes } = props;
  const isOpen = node.attrs.isOpen;

  const toggleOpen = () => {
    updateAttributes({ isOpen: !isOpen });
  };

  return (
    <NodeViewWrapper className="flex flex-col my-2">
      <div className="flex items-start gap-2">
        <button
          className="mt-1 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
          onClick={toggleOpen}
          type="button"
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <NodeViewContent className={`outline-none min-h-[1.5em] ${isOpen ? 'mb-2' : ''}`} />
          {isOpen && (
             <div className="pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-1 mt-1 empty:hidden">
               {/* Nested content would normally go here if we allowed blocks inside, but we only allow inline for simplicity */}
               {/* A true Notion-like toggle requires a complex structure (a toggle node with a summary and a content body) */}
               {/* Tiptap handles block content carefully. We will use a simpler implementation for this session. */}
             </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default ToggleList;