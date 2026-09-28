'use client';

import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Feather, Eye, Sparkles } from 'lucide-react';
import { createPostAction } from '@/lib/actions/post.actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge, GoldDivider, WaxSeal } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';

export function MarkdownEditor() {
  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedTags = useMemo(() => {
    return tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5);
  }, [tagsInput]);

  const renderedHtml = useMemo(() => {
    if (!description.trim()) return '';
    const rawHtml = marked.parse(description, { async: false }) as string;
    if (typeof window !== 'undefined') {
      return DOMPurify.sanitize(rawHtml);
    }
    return rawHtml;
  }, [description]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createPostAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* LEFT COLUMN: Dark Obsidian Scribe Controls */}
      <form onSubmit={handleSubmit} className="bg3-panel p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between border-b border-[#6e552f]/60 pb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[#e8cf96] flex items-center gap-2">
              <Feather className="w-5 h-5 text-[#c8aa6e]" />
              <span>Scribe&apos;s Inkwell</span>
            </h2>
            <p className="text-xs text-[#9e8f77] mt-0.5">
              Supports Markdown formatting (**bold**, *italics*, ## headings, &gt; quotes)
            </p>
          </div>
          <WaxSeal size={36} />
        </div>

        <Input
          name="title"
          label="Scroll Title *"
          placeholder="e.g. The Shadow-Cursed Lands: A Survival Guide"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Input
          name="tags"
          label="Realm Tags (Comma-Separated, Optional)"
          placeholder="e.g. Arcana, Quest Log, Tavern Tales"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="block font-display text-xs uppercase tracking-widest font-semibold text-[#c8aa6e]">
            Scroll Description / Lore *
          </label>
          <textarea
            name="description"
            rows={12}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Inscribe your tale here... Use ## for section headers or > for lore quotes."
            required
            className="w-full px-3.5 py-3 bg-[#0b0908] border border-[#6e552f] text-[#f3e5c8] placeholder:text-[#786852] focus:outline-none focus:border-[#c8aa6e] leading-relaxed resize-y"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit" variant="gold" size="lg" disabled={loading} className="w-full sm:w-auto">
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Sealing Scroll...' : 'Seal & Publish Scroll'}</span>
          </Button>
        </div>
      </form>

      {/* RIGHT COLUMN: Live Unfurled Parchment Preview */}
      <div className="parchment-scroll p-6 sm:p-8 min-h-[520px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-[#8c6a3d]/50 pb-3 mb-4">
            <span className="font-display text-xs uppercase tracking-widest text-[#5a4228] flex items-center gap-1.5 font-semibold">
              <Eye className="w-4 h-4" />
              <span>Live Parchment Preview</span>
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {parsedTags.length > 0 ? (
                parsedTags.map((tag, i) => (
                  <Badge key={i} variant="tag">
                    {tag}
                  </Badge>
                ))
              ) : (
                <Badge variant="tag">General Lore</Badge>
              )}
            </div>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1a0f05] text-center">
            {title.trim() || 'Untitled Chronicle'}
          </h1>

          <GoldDivider />

          {renderedHtml ? (
            <div
              className="lore-content mt-4 text-[#23170b]"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          ) : (
            <p className="text-center italic text-[#5a4228] my-16">
              As you dip your quill on the left, your inscribed parchment will unfurl here...
            </p>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-[#8c6a3d]/40 flex items-center justify-between text-xs text-[#5a4228]">
          <span className="font-display uppercase tracking-wider">
            Sealed by the Chronicler&apos;s Archive
          </span>
          <WaxSeal size={34} />
        </div>
      </div>

      <Toast message={error} type="error" onClose={() => setError(null)} />
    </div>
  );
}