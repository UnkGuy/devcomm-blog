'use client';

import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Eye, ExternalLink } from 'lucide-react';
import {
  parseMediaUrl,
  formatMarkdownWithAutoLinks,
  extractFirstMediaUrl,
  normalizeUrl,
} from '@/lib/utils';
import { Badge, GoldDivider, WaxSeal } from '@/components/ui/Badge';

interface ScrollPreviewProps {
  title: string;
  uniqueTags: string[];
  coverMediaUrl: string;
  description: string;
}

export function ScrollPreview({
  title,
  uniqueTags,
  coverMediaUrl,
  description,
}: ScrollPreviewProps) {
  const effectiveMediaUrl = useMemo(() => {
    if (coverMediaUrl.trim()) return normalizeUrl(coverMediaUrl);
    return extractFirstMediaUrl(description) || '';
  }, [coverMediaUrl, description]);

  const parsedMedia = useMemo(
    () => parseMediaUrl(effectiveMediaUrl),
    [effectiveMediaUrl]
  );

  const renderedHtml = useMemo(() => {
    if (!description.trim()) return '';
    const autoLinked = formatMarkdownWithAutoLinks(description);
    const rawHtml = marked.parse(autoLinked, {
      async: false,
      gfm: true,
      breaks: true,
    }) as string;

    if (typeof window !== 'undefined') {
      return DOMPurify.sanitize(rawHtml, {
        ADD_TAGS: ['iframe', 'video'],
        ADD_ATTR: [
          'allow',
          'allowfullscreen',
          'frameborder',
          'scrolling',
          'target',
          'rel',
          'controls',
        ],
      });
    }
    return rawHtml;
  }, [description]);

  return (
    <div className="parchment-scroll p-6 sm:p-8 min-h-[520px] flex flex-col justify-between overflow-hidden">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2 border-b border-[#8c6a3d]/50 pb-3 mb-4 flex-wrap">
          <span className="font-display text-xs uppercase tracking-widest text-[#5a4228] flex items-center gap-1.5 font-semibold shrink-0">
            <Eye className="w-4 h-4" />
            <span>Live Parchment Preview</span>
          </span>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {uniqueTags.length > 0 ? (
              uniqueTags.map((tag, i) => (
                <Badge key={i} variant="tag">
                  {tag}
                </Badge>
              ))
            ) : (
              <Badge variant="tag">General Lore</Badge>
            )}
          </div>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1a0f05] text-center [overflow-wrap:anywhere]">
          {title.trim() || 'Untitled Chronicle'}
        </h1>

        <GoldDivider variant="parchment" />

        {/* Featured Image, Video, or Link Preview */}
        {parsedMedia.type !== 'none' && parsedMedia.embedUrl && (
          <div className="my-4">
            {parsedMedia.type === 'image' && (
              <div className="fantasy-media-frame overflow-hidden">
                <img
                  src={parsedMedia.embedUrl}
                  alt={title || 'Scroll Illustration'}
                  className="w-full max-h-72 object-cover fantasy-media-img"
                />
              </div>
            )}
            {parsedMedia.type === 'youtube' && (
              <div className="fantasy-media-frame">
                <div className="aspect-video w-full">
                  <iframe
                    src={parsedMedia.embedUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title="Scrying Vision Preview"
                  />
                </div>
              </div>
            )}
            {parsedMedia.type === 'video' && (
              <div className="fantasy-media-frame">
                <video
                  src={parsedMedia.embedUrl}
                  controls
                  className="w-full max-h-72 bg-black"
                />
              </div>
            )}
            {parsedMedia.type === 'link' && (
              <a
                href={parsedMedia.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3.5 bg-[#23170b]/10 border border-[#8c6a3d] hover:bg-[#23170b]/20 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-xs uppercase tracking-wider text-[#7c2d12] font-bold flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>Referenced Chronicle ({parsedMedia.hostname})</span>
                  </span>
                  <span className="text-[11px] text-[#5a4228] underline truncate max-w-[200px]">
                    {parsedMedia.embedUrl}
                  </span>
                </div>
              </a>
            )}
          </div>
        )}

        {renderedHtml ? (
          <div
            className="lore-content mt-4 text-[#23170b] [overflow-wrap:anywhere]"
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
  );
}