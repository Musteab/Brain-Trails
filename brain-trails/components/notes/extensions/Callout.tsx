import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React from 'react';

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      type: {
        default: 'info',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent);
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CalloutComponent = (props: any) => {
  const { node } = props;
  const type = node.attrs.type;

  let bgClass = 'bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700';
  let emoji = '💡';
  let title = 'Ancient Insight';

  if (type === 'warning') {
    bgClass = 'bg-amber-100 border-amber-300 dark:bg-amber-900/40 dark:border-amber-700';
    emoji = '⚠️';
    title = 'Scroll of Warning';
  } else if (type === 'knowledge') {
    bgClass = 'bg-purple-100 border-purple-300 dark:bg-purple-900/40 dark:border-purple-700';
    emoji = '📖';
    title = 'Tome of Knowledge';
  }

  return (
    <NodeViewWrapper className={`my-4 p-4 rounded-xl border-2 flex gap-3 items-start ${bgClass}`}>
      <div className="text-2xl select-none mt-1">{emoji}</div>
      <div className="flex-1">
        <div className="font-bold text-sm mb-1 opacity-80 uppercase tracking-wider font-[family-name:var(--font-nunito)]">{title}</div>
        <NodeViewContent className="m-0 p-0 outline-none font-[family-name:var(--font-quicksand)]" />
      </div>
    </NodeViewWrapper>
  );
};
