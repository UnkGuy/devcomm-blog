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

// Deterministically picks between parchment.jpg and parchment2.jpg based on post ID
export function getParchmentClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2 === 0 ? 'parchment-scroll' : 'parchment-scroll-alt';
}

// All 5 Wax Seal variants in public/assets/images/
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
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return WAX_SEAL_IMAGES[Math.abs(hash) % WAX_SEAL_IMAGES.length];
}

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function getUrlHostname(url: string): string {
  try {
    const parsed = new URL(normalizeUrl(url));
    return parsed.hostname.replace(/^www\./i, '');
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

  // 1. Check YouTube URLs (watch, embed, shorts, youtu.be)
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      hostname: 'youtube.com',
    };
  }

  // 2. Check direct video extensions
  if (/\.(mp4|webm|ogg|mov)(\?.*|#.*)?$/i.test(trimmed)) {
    return {
      type: 'video',
      embedUrl: trimmed,
      hostname: getUrlHostname(trimmed),
    };
  }

  // 3. Check image extensions, data URIs, Supabase blog-media bucket, or common image CDNs
  const isImage =
    /^data:image\//i.test(trimmed) ||
    /\.(jpe?g|png|gif|webp|svg|avif|bmp)(\?.*|#.*)?$/i.test(trimmed) ||
    trimmed.includes('/storage/v1/object/public/blog-media/') ||
    /(images\.unsplash\.com|i\.imgur\.com|cdn\.discordapp\.com|media\.giphy\.com|pbs\.twimg\.com)/i.test(
      trimmed
    );

  if (isImage) {
    return {
      type: 'image',
      embedUrl: trimmed,
      hostname: getUrlHostname(trimmed),
    };
  }

  // 4. Check general HTTP/HTTPS web link
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      type: 'link',
      embedUrl: trimmed,
      hostname: getUrlHostname(trimmed),
    };
  }

  return { type: 'none', embedUrl: null };
}

// Extracts the first standalone media/link URL from markdown if cover_image_url wasn't manually set
export function extractFirstMediaUrl(markdown: string): string | null {
  if (!markdown) return null;
  const mdImageMatch = markdown.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/i);
  if (mdImageMatch?.[1]) return mdImageMatch[1];

  const urlRegex = /\b((?:https?:\/\/|www\.)[^\s<>()]+)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(markdown)) !== null) {
    const candidate = normalizeUrl(match[1].replace(/[.,!?;:]+$/, ''));
    const parsed = parseMediaUrl(candidate);
    if (parsed.type === 'image' || parsed.type === 'youtube' || parsed.type === 'video') {
      return candidate;
    }
  }
  return null;
}

// Pre-processes Markdown so bare URLs auto-format into links or media embeds
export function formatMarkdownWithAutoLinks(markdown: string): string {
  if (!markdown.trim()) return '';

  const lines = markdown.split('\n');
  let inCodeBlock = false;

  const processedLines = lines.map((line) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return line;
    }
    if (inCodeBlock) return line;

    // If a line is solely a bare URL, auto-format based on its media type
    if (/^(https?:\/\/|www\.)\S+$/i.test(trimmedLine)) {
      const cleanUrl = normalizeUrl(trimmedLine);
      const parsed = parseMediaUrl(cleanUrl);

      if (parsed.type === 'image' && parsed.embedUrl) {
        return `![Scroll Illustration](${parsed.embedUrl})`;
      }
      if (parsed.type === 'youtube' && parsed.embedUrl) {
        return `<div class="my-4 fantasy-media-frame"><div class="aspect-video w-full"><iframe src="${parsed.embedUrl}" class="w-full h-full" allowfullscreen title="Scrying Vision"></iframe></div></div>`;
      }
      if (parsed.type === 'video' && parsed.embedUrl) {
        return `<div class="my-4 fantasy-media-frame"><video src="${parsed.embedUrl}" controls class="w-full max-h-[420px] bg-black"></video></div>`;
      }
      return `[${ cleanUrl }](${cleanUrl})`;
    }

    // Otherwise, convert inline bare URLs (not already inside Markdown [text](url), <...>, or attributes)
    return line.replace(
      /(^|[\s(>])((?:https?:\/\/|www\.)[^\s<)"']+)/gi,
      (fullMatch, prefix: string, rawUrl: string) => {
        const cleanUrl = rawUrl.replace(/[.,!?;:]+$/, '');
        const trailingPunct = rawUrl.slice(cleanUrl.length);
        const href = normalizeUrl(cleanUrl);
        return `${prefix}[${cleanUrl}](${href})${trailingPunct}`;
      }
    );
  });

  return processedLines.join('\n');
}

// 8 Built-In D&D Class Crest Avatars (SVG Data URIs so they never break)
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
  let hash = 0;

  for (let i = 0; i < source.length; i++) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }

  return DND_AVATAR_PRESETS[Math.abs(hash) % DND_AVATAR_PRESETS.length].url;
}