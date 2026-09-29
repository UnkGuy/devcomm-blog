'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

export function ImageLightbox() {
  const [mounted, setMounted] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setMounted(true);

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Trigger lightbox if they click a post cover image OR a markdown image
      if (
        target.tagName === 'IMG' &&
        (target.classList.contains('fantasy-media-img') ||
          target.closest('.lore-content'))
      ) {
        setSrc((target as HTMLImageElement).src);
        setScale(1);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  if (!mounted || !src) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
      onClick={(e) => {
        // Close if they click the background
        if (e.target === e.currentTarget) setSrc(null);
      }}
    >
      <div className="absolute top-6 right-6 flex gap-3">
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(s + 0.5, 3))}
          className="text-[#9e8f77] hover:text-[#e8cf96] bg-[#14100d] p-2 border border-[#6e552f] rounded-full cursor-pointer transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(s - 0.5, 0.5))}
          className="text-[#9e8f77] hover:text-[#e8cf96] bg-[#14100d] p-2 border border-[#6e552f] rounded-full cursor-pointer transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setSrc(null)}
          className="text-[#fca5a5] hover:text-white bg-[#3b0d0d] p-2 border border-[#991b1b] rounded-full cursor-pointer transition-colors ml-2"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-auto max-w-full max-h-full scrollbar-hide">
        <img
          src={src}
          alt="Expanded view"
          style={{ transform: `scale(${scale})` }}
          className="max-w-full max-h-[90vh] object-contain transition-transform duration-300 origin-center cursor-zoom-in"
          onClick={() => setScale((s) => (s === 1 ? 2 : 1))}
        />
      </div>
    </div>,
    document.body
  );
}