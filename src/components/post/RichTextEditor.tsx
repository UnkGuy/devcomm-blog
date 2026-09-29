'use client';

import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Heading2, Quote, List, ListOrdered, ImageIcon, Film, Link2, Dices
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onError: (msg: string) => void;
}

export function RichTextEditor({ content, onChange, onError }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({
        HTMLAttributes: { class: 'fantasy-media-img max-h-[400px] w-auto mx-auto border border-[#6e552f] my-4' },
      }),
      Youtube.configure({
        HTMLAttributes: { class: 'w-full aspect-video border border-[#6e552f] my-4' },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-[#c8aa6e] underline hover:text-[#f3e5c8] transition-colors' },
      }),
      Placeholder.configure({
        placeholder: 'Inscribe your tale here... Type / to see commands or use the toolbar above.',
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

  const addImage = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/gif';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        onError('Image must be under 5MB.');
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split('.').pop() || 'png';
      const path = `${user.id}/inline-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('blog-media').upload(path, file);
      if (uploadError) {
        onError(uploadError.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('blog-media').getPublicUrl(path);
      editor?.chain().focus().setImage({ src: publicUrl }).run();
    };
    input.click();
  }, [editor, onError]);

  const addYoutube = useCallback(() => {
    const url = prompt('Enter a YouTube URL:');
    if (url && editor) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = prompt('URL:', previousUrl);
    
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addDiceRoll = useCallback(() => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const rollType = roll === 20 ? ' *(Critical Success!)*' : roll === 1 ? ' *(Critical Fail!)*' : '';
    // Inserts a stylized blockquote into the TipTap editor
    editor?.chain().focus().setBlockquote().insertContent(`🎲 <strong>Author's Roll (1d20)</strong>: ${roll}${rollType}`).run();
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
        
        <ToolbarBtn icon={<Link2 className="w-4 h-4"/>} onClick={addLink} active={editor.isActive('link')} title="Add Link" />
        <ToolbarBtn icon={<ImageIcon className="w-4 h-4"/>} onClick={addImage} active={false} title="Upload Image" />
        <ToolbarBtn icon={<Film className="w-4 h-4"/>} onClick={addYoutube} active={false} title="Embed YouTube Video" />

        <div className="w-px h-5 bg-[#6e552f]/50 mx-1" />

        {/* New Dice Roll Button */}
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