'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Feather, Sparkles, AlertCircle, X } from 'lucide-react';
import { createPostAction } from '@/lib/actions/post.actions';
import { normalizeUrl } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { MediaAttachmentInput } from './MediaAttachmentInput';
import { ScrollPreview } from './ScrollPreview';

const MAX_TITLE_LENGTH = 100;
const MAX_DESC_LENGTH = 10000;
const MAX_TAGS = 5;
const MAX_SINGLE_TAG_LENGTH = 24;

export function MarkdownEditor() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [coverMediaUrl, setCoverMediaUrl] = useState('');
  const [description, setDescription] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [tagWarning, setTagWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deduplicate tags case-insensitively so preview & chips only show unique tags
  const { uniqueTags, hasDuplicates } = useMemo(() => {
    const rawList = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const seen = new Set<string>();
    const deduped: string[] = [];
    let duplicateFound = false;

    for (const tag of rawList) {
      const lower = tag.toLowerCase();
      if (seen.has(lower)) {
        duplicateFound = true;
      } else {
        seen.add(lower);
        deduped.push(tag);
      }
    }

    return {
      uniqueTags: deduped.slice(0, MAX_TAGS),
      hasDuplicates: duplicateFound,
    };
  }, [tagsInput]);

  const wordCount = useMemo(() => {
    const trimmed = description.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [description]);

  function handleTagsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = e.target.value;
    const segments = rawValue.split(',');
    const nonEmptySegments = segments.map((s) => s.trim()).filter(Boolean);

    const tooLongTag = segments.find(
      (s) => s.trim().length > MAX_SINGLE_TAG_LENGTH
    );
    if (tooLongTag) {
      setTagWarning(
        `Each tag cannot exceed ${MAX_SINGLE_TAG_LENGTH} characters.`
      );
      return;
    }

    const uniqueSet = new Set(nonEmptySegments.map((s) => s.toLowerCase()));
    if (uniqueSet.size > MAX_TAGS) {
      setTagWarning(`Maximum of ${MAX_TAGS} unique tags allowed per scroll.`);
      return;
    }

    if (uniqueSet.size === MAX_TAGS && rawValue.endsWith(',')) {
      setTagWarning(`You have reached the maximum of ${MAX_TAGS} unique tags.`);
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

  // If the user highlights text and pastes a URL, wrap it as [Selected Text](url)
  function handleDescriptionPaste(
    e: React.ClipboardEvent<HTMLTextAreaElement>
  ) {
    const pasted = e.clipboardData.getData('text/plain').trim();
    if (!/^(https?:\/\/|www\.)\S+$/i.test(pasted)) return;

    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = description.slice(start, end).trim();

    if (selectedText && !/^(https?:\/\/|www\.)/i.test(selectedText)) {
      e.preventDefault();
      const formattedLink = `[${selectedText}](${normalizeUrl(pasted)})`;
      const updated = (
        description.slice(0, start) +
        formattedLink +
        description.slice(end)
      ).slice(0, MAX_DESC_LENGTH);
      setDescription(updated);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('tags', uniqueTags.join(', '));
    formData.set('cover_image_url', coverMediaUrl.trim());

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* LEFT COLUMN: Dark Obsidian Scribe Controls */}
      <form onSubmit={handleSubmit} className="bg3-panel p-6 sm:p-8 space-y-5">
        <div className="border-b border-[#6e552f]/60 pb-4">
          <h2 className="font-display text-xl font-bold text-[#e8cf96] flex items-center gap-2">
            <Feather className="w-5 h-5 text-[#c8aa6e]" />
            <span>Scribe&apos;s Inkwell</span>
          </h2>
          <p className="text-xs text-[#9e8f77] mt-0.5">
            Supports Markdown (**bold**, *italics*, ## headings), image uploads, and automatic link detection
          </p>
        </div>

        {/* 1. Scroll Title */}
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
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Maximum title length of {MAX_TITLE_LENGTH} characters reached.</span>
            </p>
          )}
        </div>

        {/* 2. Realm Tags */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block font-display text-xs uppercase tracking-widest font-semibold text-[#c8aa6e]">
              Realm Tags (Comma-Separated)
            </label>
            <span
              className={`font-mono text-xs ${
                uniqueTags.length >= MAX_TAGS
                  ? 'text-[#e8cf96] font-bold'
                  : 'text-[#8c7b65]'
              }`}
            >
              {uniqueTags.length} / {MAX_TAGS} unique tags
            </span>
          </div>
          <input
            name="tags"
            type="text"
            placeholder={
              uniqueTags.length >= MAX_TAGS
                ? 'Maximum of 5 unique tags reached'
                : 'e.g. Arcana, Quest Log, Tavern Tales (separate with commas)'
            }
            value={tagsInput}
            onChange={handleTagsChange}
            className="w-full px-3.5 py-2 bg-[#0b0908] border border-[#6e552f] text-base text-[#f3e5c8] placeholder:text-[#786852] focus:outline-none focus:border-[#c8aa6e]"
          />

          <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {uniqueTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="font-display inline-flex items-center gap-1 px-2 py-0.5 text-[11px] uppercase tracking-wider bg-[#2c2012] text-[#e8cf96] border border-[#c8aa6e] break-all"
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
              Up to {MAX_TAGS} unique tags &bull; Max {MAX_SINGLE_TAG_LENGTH} chars each
            </span>
          </div>

          {hasDuplicates && (
            <p className="text-xs text-[#f59e0b] flex items-center gap-1 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Duplicate tag detected — identical tags are merged into one on your scroll.</span>
            </p>
          )}

          {tagWarning && (
            <p className="text-xs text-[#f87171] flex items-center gap-1 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{tagWarning}</span>
            </p>
          )}
        </div>

        {/* 3. Modular Media Uploader & Smart URL Input */}
        <MediaAttachmentInput
          value={coverMediaUrl}
          onChange={setCoverMediaUrl}
          onError={setError}
          onUploadingChange={setUploadingMedia}
        />

        {/* 4. Scroll Description with Auto-Linking & Smart Paste */}
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
            rows={11}
            maxLength={MAX_DESC_LENGTH}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onPaste={handleDescriptionPaste}
            placeholder="Inscribe your tale here... Paste any link (https://... or www....) and it will automatically format itself!"
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
          <Button
            type="submit"
            variant="gold"
            size="lg"
            disabled={loading || uploadingMedia}
            className="w-full sm:w-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Sealing Scroll...' : 'Seal & Publish Scroll'}</span>
          </Button>
        </div>
      </form>

      {/* RIGHT COLUMN: Modular Live Parchment Preview */}
      <ScrollPreview
        title={title}
        uniqueTags={uniqueTags}
        coverMediaUrl={coverMediaUrl}
        description={description}
      />

      <Toast message={error} type="error" onClose={() => setError(null)} />
    </div>
  );
}