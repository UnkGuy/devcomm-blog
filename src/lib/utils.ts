export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function slugify(text: string): string {
  const baseSlug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
  const shortSuffix = Math.random().toString(36).substring(2, 7);
  return `${baseSlug || 'scroll'}-${shortSuffix}`;
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

// --- OPTIMIZATION 1: Centralized Hashing Helper ---
/** Generates a deterministic integer from any string seed */
function getHashFromSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Deterministically picks between parchment.jpg and parchment2.jpg based on post ID
export function getParchmentClass(seed: string): string {
  return getHashFromSeed(seed) % 2 === 0 ? 'parchment-scroll' : 'parchment-scroll-alt';
}

export const WAX_SEAL_IMAGES = [
  '/assets/images/wax-seal-red.png',
  '/assets/images/wax-seal-blue.png',
  '/assets/images/wax-seal-green.png',
  '/assets/images/wax-seal-yellow.png',
  '/assets/images/wax-seal-brown.png',
] as const;

export function getWaxSealImage(seed?: string): string {
  if (!seed) {
    return WAX_SEAL_IMAGES[Math.floor(Math.random() * WAX_SEAL_IMAGES.length)];
  }
  return WAX_SEAL_IMAGES[getHashFromSeed(seed) % WAX_SEAL_IMAGES.length];
}

// 8 Built-In D&D Class Crest Avatars (SVG Data URIs)
function createClassSvg(label: string, symbol: string, bg: string, border: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="50" fill="${bg}"/>
    <circle cx="50" cy="50" r="45" fill="none" stroke="${border}" stroke-width="3"/>
    <circle cx="50" cy="50" r="39" fill="none" stroke="${border}" stroke-width="1" stroke-dasharray="3,3"/>
    <text x="50" y="58" font-size="36" text-anchor="middle" fill="#f3e5c8" font-family="serif">${symbol}</text>
  </svg>`;
  return {
    id: label.toLowerCase(),
    label,
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
  };
}

export const DND_AVATAR_PRESETS = [
  createClassSvg('Wizard', '✦', '#1e1b4b', '#c8aa6e'),
  createClassSvg('Paladin', '❖', '#3b2a14', '#e2c07d'),
  createClassSvg('Rogue', '🗡', '#18181b', '#a1a1aa'),
  createClassSvg('Bard', '♪', '#3b0764', '#e8cf96'),
  createClassSvg('Warlock', '◈', '#31102f', '#f43f5e'),
  createClassSvg('Ranger', '↟', '#142615', '#86efac'),
  createClassSvg('Cleric', '☀', '#2c2012', '#fde68a'),
  createClassSvg('Fighter', '⚔', '#450a0a', '#fca5a5'),
];

export function getAvatarFallback(seed?: string): string {
  const source = (seed || 'Scribe').trim() || 'Scribe';
  return DND_AVATAR_PRESETS[getHashFromSeed(source) % DND_AVATAR_PRESETS.length].url;
}

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return /^www\./i.test(trimmed) ? `https://${trimmed}` : trimmed;
}

export function getUrlHostname(url: string): string {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
}

// Detects whether a URL is an image, a YouTube video, a direct video, or a general web link
export function parseMediaUrl(url?: string | null): {
  type: 'none' | 'image' | 'youtube' | 'video' | 'link';
  embedUrl: string | null;
  hostname?: string;
} {
  if (!url || !url.trim()) return { type: 'none', embedUrl: null };
  const trimmed = normalizeUrl(url);

  const ytMatch = trimmed.match(YT_REGEX);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      hostname: 'youtube.com',
    };
  }

  if (/\.(mp4|webm|ogg|mov)(\?.*|#.*)?$/i.test(trimmed)) {
    return { type: 'video', embedUrl: trimmed, hostname: getUrlHostname(trimmed) };
  }

  const isImage =
    /^data:image\//i.test(trimmed) ||
    IMAGE_EXT_REGEX.test(trimmed) ||
    trimmed.includes('/storage/v1/object/public/blog-media/') ||
    /(images\.unsplash\.com|i\.imgur\.com|cdn\.discordapp\.com|media\.giphy\.com|pbs\.twimg\.com)/i.test(trimmed);

  if (isImage) {
    return { type: 'image', embedUrl: trimmed, hostname: getUrlHostname(trimmed) };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return { type: 'link', embedUrl: trimmed, hostname: getUrlHostname(trimmed) };
  }

  return { type: 'none', embedUrl: null };
}

// Extracts the first standalone media/link URL from HTML/Markdown
export function extractFirstMediaUrl(content: string): string | null {
  if (!content) return null;
  
  // Try to find a markdown image first (legacy support)
  const mdImageMatch = content.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/i);
  if (mdImageMatch?.[1]) return mdImageMatch[1];

  // Then try to find raw URLs
  const urlRegex = /\b((?:https?:\/\/|www\.)[^\s<>()"']+)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(content)) !== null) {
    const candidate = normalizeUrl(match[1].replace(/[.,!?;:]+$/, ''));
    const parsed = parseMediaUrl(candidate);
    if (parsed.type === 'image' || parsed.type === 'youtube' || parsed.type === 'video') {
      return candidate;
    }
  }
  return null;
}

// --- OPTIMIZATION 2: Pre-compiled Regexes ---
const YT_REGEX = /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
const IMAGE_EXT_REGEX = /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i;
const HTML_ANCHOR_REGEX = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

export function processHtmlAutoLinks(html: string): string {
  if (!html) return '';
  
  return html.replace(HTML_ANCHOR_REGEX, (match, href, innerText) => {
    // Only embed if the link text is the raw URL itself
    if (innerText.trim() !== href.trim()) return match;

    let finalSrc = href;
    const isImageExt = IMAGE_EXT_REGEX.test(href);
    const isImgur = href.includes('imgur.com');

    if (isImageExt || isImgur) {
       // Auto-append .jpg if they pasted a raw imgur link without the extension
       if (isImgur && !isImageExt) {
           finalSrc = href + '.jpg';
       }
       return `<span class="fantasy-media-frame my-4 overflow-hidden cursor-zoom-in block"><img src="${finalSrc}" class="w-full max-h-[460px] object-cover fantasy-media-img block" alt="Embedded Auto Image" /></span>`;
    }

    const ytMatch = href.match(YT_REGEX);
    if (ytMatch && ytMatch[1]) {
       return `<span class="fantasy-media-frame my-4 block"><span class="aspect-video w-full block"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" class="w-full h-full block" allowfullscreen></iframe></span></span>`;
    }

    return match;
  });
}