'use client';

import React, { useCallback } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Heading2, Quote, List, ListOrdered, Dices
} from 'lucide-react';

// NOTE: no separate '@tiptap/extension-link' import.
// Tiptap v3's StarterKit already bundles Link, so it is configured here.
// autolink turns pasted URLs into links, which the preview/post page
// then morph into embedded images and videos.

const SpacingExtension = Extension.create({
  name: 'spacing',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => element.style.lineHeight || null,
            renderHTML: attributes => {
              if (!attributes.lineHeight) return {};
              return { style: `line-height: ${attributes.lineHeight}` };
            }
          },
          letterSpacing: {
            default: null,
            parseHTML: element => element.style.letterSpacing || null,
            renderHTML: attributes => {
              if (!attributes.letterSpacing) return {};
              return { style: `letter-spacing: ${attributes.letterSpacing}` };
            }
          }
        }
      }
    ];
  }
});

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onError?: (err: string | null) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            class: 'text-[#c8aa6e] underline hover:text-[#f3e5c8] transition-colors cursor-pointer',
          },
        },
      }),
      SpacingExtension,
      Placeholder.configure({
        placeholder: 'Inscribe your tale here... To add images or videos, just paste the URL link on its own line.',
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-[#786852] before:float-left before:pointer-events-none',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose-none min-h-[300px] w-full px-4 py-3 bg-[#0b0908] text-[#f3e5c8] focus:outline-none leading-relaxed lore-content',
      },
    },
  });

  const addDiceRoll = useCallback(() => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const rollType = roll === 20 ? ' <em>(Critical Success!)</em>' : roll === 1 ? ' <em>(Critical Fail!)</em>' : '';
    if (editor) {
      const { to } = editor.state.selection;
      editor.chain().focus().setTextSelection(to).insertContent(`<p>🎲 <strong>Author's Roll (1d20)</strong>: ${roll}${rollType}</p>`).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-[#6e552f] overflow-hidden flex flex-col">
      <div className="flex items-center gap-1 flex-wrap bg-[#14100d] px-2 py-1.5 border-b border-[#6e552f]">
        <ToolbarBtn icon={<Bold className="w-4 h-4"/>} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold" />
        <ToolbarBtn icon={<Italic className="w-4 h-4"/>} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic" />
        <ToolbarBtn icon={<Heading2 className="w-4 h-4"/>} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading" />
        <ToolbarBtn icon={<Quote className="w-4 h-4"/>} onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote" />

        <div className="w-px h-5 bg-[#6e552f]/50 mx-1" />

        <ToolbarBtn icon={<List className="w-4 h-4"/>} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List" />
        <ToolbarBtn icon={<ListOrdered className="w-4 h-4"/>} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List" />

        <div className="w-px h-5 bg-[#6e552f]/50 mx-1" />

        <select
          onChange={(e) => {
            if (!e.target.value) return;
            editor.chain().focus().updateAttributes('paragraph', { lineHeight: e.target.value }).updateAttributes('heading', { lineHeight: e.target.value }).run();
            e.target.value = '';
          }}
          className="bg-[#0b0908] text-[#c8aa6e] border border-[#6e552f] text-[10px] uppercase tracking-widest p-1 focus:outline-none cursor-pointer"
          title="Adjust Line Spacing"
        >
          <option value="">Line Spacing</option>
          <option value="1.25">Tight</option>
          <option value="1.75">Normal</option>
          <option value="2.5">Relaxed</option>
        </select>

        <select
          onChange={(e) => {
            if (!e.target.value) return;
            editor.chain().focus().updateAttributes('paragraph', { letterSpacing: e.target.value }).updateAttributes('heading', { letterSpacing: e.target.value }).run();
            e.target.value = '';
          }}
          className="bg-[#0b0908] text-[#c8aa6e] border border-[#6e552f] text-[10px] uppercase tracking-widest p-1 focus:outline-none cursor-pointer ml-1"
          title="Adjust Character Spacing"
        >
          <option value="">Char Spacing</option>
          <option value="-0.03em">Tight</option>
          <option value="normal">Normal</option>
          <option value="0.08em">Wide</option>
        </select>

        <button
          type="button"
          onClick={addDiceRoll}
          title="Roll 1d20"
          className="p-1.5 text-[#d4c3a3] hover:text-[#e8cf96] hover:bg-[#2c2012] transition-colors flex items-center gap-1.5 cursor-pointer ml-auto border border-transparent hover:border-[#c8aa6e]"
        >
          <Dices className="w-4 h-4" />
          <span className="text-[10px] font-display uppercase tracking-widest font-bold">Roll</span>
        </button>
      </div>

      <EditorContent editor={editor} className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar" />
    </div>
  );
}

function ToolbarBtn({ icon, onClick, active, title }: { icon: React.ReactNode, onClick: () => void, active: boolean, title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-sm transition-colors cursor-pointer ${active ? 'bg-[#c8aa6e] text-[#14100d]' : 'text-[#d4c3a3] hover:bg-[#2c2012] hover:text-[#e8cf96]'}`}
    >
      {icon}
    </button>
  );
}