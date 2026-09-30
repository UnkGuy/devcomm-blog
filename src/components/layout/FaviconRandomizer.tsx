'use client';

import { useEffect } from 'react';
import { WAX_SEAL_IMAGES } from '@/lib/utils';

export function FaviconRandomizer() {
  useEffect(() => {
    const randomSeal = WAX_SEAL_IMAGES[Math.floor(Math.random() * WAX_SEAL_IMAGES.length)];
    
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    
    link.href = randomSeal;
  }, []);

  return null; // This component is invisible
}