'use client';

import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Feather, Eye, Sparkles, AlertCircle, X } from 'lucide-react';
import { createPostAction } from '@/lib/actions/post.actions';
import { Button } from '@/components/ui/Button';
import { Badge, GoldDivider, WaxSeal } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';

const MAX_TITLE_LENGTH = 100;
const MAX_DESC_LENGTH = 5000;
const MAX_TAGS = 5;
const MAX_SINGLE_TAG_LENGTH = 24;

export function MarkdownEditor() {
  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [tagWarning, setTagWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSplitTags = useMemo(() => {
    return tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }, [tagsInput]);

  const parsedTags = useMemo(() => {
    return allSplitTags.slice(0, MAX_TAGS);
  }, [allSplitTags]);

  const wordCount = useMemo(() => {
    const trimmed = description.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [description]);

  function handleTagsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = e.target.value;
    const segments = rawValue.split(',');

    // Block typing a 6th tag when 5 non-empty tags already exist
    const nonEmptyCount = segments.map((s) => s.trim()).filter(Boolean).length;
    if (segments.length > MAX_TAGS && nonEmptyCount > MAX_TAGS) {
      setTagWarning(`Maximum of ${MAX_TAGS} tags allowed per scroll.`);
      return;
    }

    // Check if any individual tag exceeds MAX_SINGLE_TAG_LENGTH
    const tooLongTag = segments.find((s) => s.trim().length > MAX_SINGLE_TAG_LENGTH);
    if (tooLongTag) {
      setTagWarning(`Each tag cannot exceed ${MAX_SINGLE_TAG_LENGTH} characters.`);
      return;
    }

    if (nonEmptyCount === MAX_TAGS && rawValue.endsWith(',')) {
      setTagWarning(`You have reached the maximum of ${MAX_TAGS} tags.`);
      return;
    }

    setTagWarning(null);
    setTagsInput(rawValue);
  }

  function removeTagAtIndex(indexToRemove: number) {
    const remaining = parsedTags.filter((_, idx) => idx !== indexToRemove);
    setTagsInput(remaining.join(', '));
    setTagWarning(null);
  }

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
    // Ensure clean validated tags are submitted
    formData.set('tags', parsedTags.join(', '));

    const result = await createPostAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* LEFT COLUMN: Dark Obsidian Scribe Controls (No Wax Seal Here) */}
      <form onSubmit={handleSubmit} className="bg3-panel p-6 sm:p-8 space-y-5">
        <div className="border-b border-[#6e552f]/60 pb-4">
          <h2 className="font-display text-xl font-bold text-[#e8cf96] flex items-center gap-2">
            <Feather className="w-5 h-5 text-[#c8aa6e]" />
            <span>Scribe&apos;s Inkwell</span>
          </h2>
          <p className="text-xs text-[#9e8f77] mt-0.5">
            Supports Markdown formatting (**bold**, *italics*, ## headings, &gt; quotes)
          </p>
        </div>

        {/* 1. Scroll Title with Live Character Limit */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block font-display text-xs uppercase tracking-widest font-semibold text-[#c8aa6e]">
              Scroll Title *
            </label>
            <span
              className={`font-mono text-xs ${
                title.length >= MAX_TITLE_LENGTH
                  ? 'text-[#f87171] font-bold'
                  : title.length >= MAX_TITLE_LENGTH * 0.85
                  ? 'text-[#e8cf96]'
                  : 'text-[#8c7b65]'
              }`}
            >
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
          {title.length >= MAX_TITLE_LENGTH && (
            <p className="text-xs text-[#f87171] flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Maximum title length of {MAX_TITLE_LENGTH} characters reached.</span>
            </p>
          )}
        </div>

        {/* 2. Realm Tags with 5-Tag Limit Counter & Feedback */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block font-display text-xs uppercase tracking-widest font-semibold text-[#c8aa6e]">
              Realm Tags (Comma-Separated)
            </label>
            <span
              className={`font-mono text-xs ${
                parsedTags.length >= MAX_TAGS
                  ? 'text-[#e8cf96] font-bold'
                  : 'text-[#8c7b65]'
              }`}
            >
              {parsedTags.length} / {MAX_TAGS} tags
            </span>
          </div>
          <input
            name="tags"
            type="text"
            placeholder={
              parsedTags.length >= MAX_TAGS
                ? 'Maximum of 5 tags reached'
                : 'e.g. Arcana, Quest Log, Tavern Tales (separate with commas)'
            }
            value={tagsInput}
            onChange={handleTagsChange}
            className="w-full px-3.5 py-2 bg-[#0b0908] border border-[#6e552f] text-base text-[#f3e5c8] placeholder:text-[#786852] focus:outline-none focus:border-[#c8aa6e]"
          />

          {/* Interactive Tag Chips Preview & Feedback */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {parsedTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="font-display inline-flex items-center gap-1 px-2 py-0.5 text-[11px] uppercase tracking-wider bg-[#2c2012] text-[#e8cf96] border border-[#c8aa6e]"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTagAtIndex(idx)}
                    className="hover:text-white cursor-pointer"
                    title="Remove tag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <span className="text-[11px] text-[#8c7b65]">
              Up to {MAX_TAGS} tags &bull; Max {MAX_SINGLE_TAG_LENGTH} chars each
            </span>
          </div>

          {tagWarning && (
            <p className="text-xs text-[#f59e0b] flex items-center gap-1 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{tagWarning}</span>
            </p>
          )}
        </div>

        {/* 3. Scroll Description with Live Character & Word Counter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block font-display text-xs uppercase tracking-widest font-semibold text-[#c8aa6e]">
              Scroll Description / Lore *
            </label>
            <span
              className={`font-mono text-xs ${
                description.length >= MAX_DESC_LENGTH
                  ? 'text-[#f87171] font-bold'
                  : description.length >= MAX_DESC_LENGTH * 0.9
                  ? 'text-[#e8cf96]'
                  : 'text-[#8c7b65]'
              }`}
            >
              {description.length.toLocaleString()} / {MAX_DESC_LENGTH.toLocaleString()} chars
            </span>
          </div>
          <textarea
            name="description"
            rows={12}
            maxLength={MAX_DESC_LENGTH}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Inscribe your tale here... Use ## for section headers or > for lore quotes."
            required
            className="w-full px-3.5 py-3 bg-[#0b0908] border border-[#6e552f] text-[#f3e5c8] placeholder:text-[#786852] focus:outline-none focus:border-[#c8aa6e] leading-relaxed resize-y"
          />
          <div className="flex items-center justify-between text-xs text-[#8c7b65]">
            <span>{wordCount} words inscribed</span>
            {description.length >= MAX_DESC_LENGTH && (
              <span className="text-[#f87171] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Maximum character limit reached
              </span>
            )}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit" variant="gold" size="lg" disabled={loading} className="w-full sm:w-auto">
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Sealing Scroll...' : 'Seal & Publish Scroll'}</span>
          </Button>
        </div>
      </form>

      {/* RIGHT COLUMN: Live Unfurled Parchment Preview (Keeps Wax Seal) */}
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

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1a0f05] text-center break-words">
            {title.trim() || 'Untitled Chronicle'}
          </h1>

          <GoldDivider />

          {renderedHtml ? (
            <div
              className="lore-content mt-4 text-[#23170b] break-words"
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