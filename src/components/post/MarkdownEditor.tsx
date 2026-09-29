'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Feather, Sparkles, AlertCircle, X, ArrowDown } from 'lucide-react';
import { createPostAction } from '@/lib/actions/post.actions';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { ScrollPreview } from './ScrollPreview';
import { RichTextEditor } from './RichTextEditor';

const MAX_TITLE_LENGTH = 100;
const MAX_DESC_LENGTH = 10000;
const MAX_TAGS = 5;
const MAX_SINGLE_TAG_LENGTH = 24;

export function MarkdownEditor() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [tagWarning, setTagWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { uniqueTags, hasDuplicates } = useMemo(() => {
    const rawList = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const seen = new Set<string>();
    const deduped: string[] = [];
    let duplicateFound = false;

    for (const tag of rawList) {
      const lower = tag.toLowerCase();
      if (seen.has(lower)) duplicateFound = true;
      else { seen.add(lower); deduped.push(tag); }
    }
    return { uniqueTags: deduped.slice(0, MAX_TAGS), hasDuplicates: duplicateFound };
  }, [tagsInput]);

  function handleTagsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = e.target.value;
    const segments = rawValue.split(',');
    const nonEmptySegments = segments.map((s) => s.trim()).filter(Boolean);

    if (segments.find((s) => s.trim().length > MAX_SINGLE_TAG_LENGTH)) {
      setTagWarning(`Each tag cannot exceed ${MAX_SINGLE_TAG_LENGTH} characters.`);
      return;
    }
    const uniqueSet = new Set(nonEmptySegments.map((s) => s.toLowerCase()));
    if (uniqueSet.size > MAX_TAGS) {
      setTagWarning(`Maximum of ${MAX_TAGS} unique tags allowed.`);
      return;
    }
    setTagWarning(null);
    setTagsInput(rawValue);
  }

  function removeTagAtIndex(indexToRemove: number) {
    const remaining = uniqueTags.filter((_, idx) => idx !== indexToRemove);
    setTagsInput(remaining.join(', '));
    setTagWarning(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const strippedContent = description.replace(/<[^>]*>?/gm, '').trim();
    if (!strippedContent && !description.includes('<img') && !description.includes('<iframe')) {
      setError("Your scroll cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('tags', uniqueTags.join(', '));
    formData.set('cover_image_url', ''); 
    formData.set('description', description);

    const result = await createPostAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result?.slug) {
      router.push(`/post/${result.slug}`);
      router.refresh();
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 flex flex-col">
      <form onSubmit={handleSubmit} className="bg3-panel p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="border-b border-[#6e552f]/60 pb-4">
          <h2 className="font-display text-xl font-bold text-[#e8cf96] flex items-center gap-2">
            <Feather className="w-5 h-5 text-[#c8aa6e]" />
            <span>Scribe&apos;s Inkwell</span>
          </h2>
          <p className="text-xs text-[#9e8f77] mt-0.5">
            Rich text enabled. Upload images, adjust spacing, and paste links to automatically embed scrying visions.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block font-display text-xs uppercase tracking-widest font-semibold text-[#c8aa6e]">
              Scroll Title *
            </label>
            <span className={`font-mono text-xs ${title.length >= MAX_TITLE_LENGTH ? 'text-[#f87171] font-bold' : 'text-[#8c7b65]'}`}>
              {title.length} / {MAX_TITLE_LENGTH}
            </span>
          </div>
          <input
            name="title"
            type="text"
            maxLength={MAX_TITLE_LENGTH}
            placeholder="e.g. The Shadow-Cursed Lands: A Survival Guide"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3.5 py-2 bg-[#0b0908] border border-[#6e552f] text-base text-[#f3e5c8] placeholder:text-[#786852] focus:outline-none focus:border-[#c8aa6e]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-display text-xs uppercase tracking-widest font-semibold text-[#c8aa6e]">
            Realm Tags (Comma-Separated)
          </label>
          <input
            name="tags"
            type="text"
            placeholder="e.g. Arcana, Quest Log, Tavern Tales"
            value={tagsInput}
            onChange={handleTagsChange}
            className="w-full px-3.5 py-2 bg-[#0b0908] border border-[#6e552f] text-base text-[#f3e5c8] placeholder:text-[#786852] focus:outline-none focus:border-[#c8aa6e]"
          />
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {uniqueTags.map((tag, idx) => (
              <span key={idx} className="font-display inline-flex items-center gap-1 px-2 py-0.5 text-[11px] uppercase tracking-wider bg-[#2c2012] text-[#e8cf96] border border-[#c8aa6e] break-all">
                <span>#{tag}</span>
                <button type="button" onClick={() => removeTagAtIndex(idx)} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block font-display text-xs uppercase tracking-widest font-semibold text-[#c8aa6e]">
              Scroll Description / Lore *
            </label>
            <span className={`font-mono text-xs ${description.length >= MAX_DESC_LENGTH ? 'text-[#f87171] font-bold' : 'text-[#8c7b65]'}`}>
              {description.length.toLocaleString()} / {MAX_DESC_LENGTH.toLocaleString()} chars
            </span>
          </div>
          <RichTextEditor content={description} onChange={setDescription} onError={setError} />
        </div>

        <div className="pt-4 flex items-center justify-between">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#8c7b65] uppercase font-display tracking-widest">
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            Live Preview Below
          </div>
          <Button type="submit" variant="gold" size="lg" disabled={loading} className="w-full sm:w-auto">
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Sealing Scroll...' : 'Seal & Publish Scroll'}</span>
          </Button>
        </div>
      </form>

      {/* Stacked Preview Below */}
      <div className="pt-4">
        <ScrollPreview title={title} uniqueTags={uniqueTags} coverMediaUrl="" description={description} />
      </div>
      <Toast message={error} type="error" onClose={() => setError(null)} />
    </div>
  );
}