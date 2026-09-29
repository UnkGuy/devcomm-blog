'use client';

import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Eye } from 'lucide-react';
import { processHtmlAutoLinks } from '@/lib/utils';
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
  description,
}: ScrollPreviewProps) {

  // Auto-Morph Links into Images/iFrames, then sanitize!
  const renderedHtml = useMemo(() => {
    if (!description.trim()) return '';
    const morphedHtml = processHtmlAutoLinks(description);

    if (typeof window !== 'undefined') {
      return DOMPurify.sanitize(morphedHtml, {
        ADD_TAGS: ['iframe', 'video'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target', 'rel', 'controls', 'style'],
      });
    }
    return morphedHtml;
  }, [description]);

  return (
    <div className="parchment-scroll p-6 sm:p-12 min-h-[520px] flex flex-col justify-between overflow-hidden shadow-2xl">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2 border-b border-[#8c6a3d]/50 pb-3 mb-4 flex-wrap">
          <span className="font-display text-xs uppercase tracking-widest text-[#5a4228] flex items-center gap-1.5 font-semibold shrink-0">
            <Eye className="w-4 h-4" />
            <span>Live Parchment Preview</span>
          </span>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {uniqueTags.length > 0 ? (
              uniqueTags.map((tag, i) => <Badge key={i} variant="tag">{tag}</Badge>)
            ) : (
              <Badge variant="tag">General Lore</Badge>
            )}
          </div>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1a0f05] text-center leading-tight [overflow-wrap:anywhere]">
          {title.trim() || 'Untitled Chronicle'}
        </h1>

        <GoldDivider variant="parchment" />

        {renderedHtml ? (
          <div className="lore-content mt-6 text-[#23170b] [overflow-wrap:anywhere]" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        ) : (
          <p className="text-center italic text-[#5a4228] my-16">
            As you inscribe above, your parchment will unfurl here...
          </p>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-[#8c6a3d]/40 flex items-center justify-between text-xs text-[#5a4228]">
        <span className="font-display uppercase tracking-wider">Sealed by Viggy&apos;s Archive</span>
        <WaxSeal size={34} />
      </div>
    </div>
  );
}