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
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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

// Detects whether a media URL is an image, a YouTube video, or a direct video URL
export function parseMediaUrl(url?: string | null): {
  type: 'none' | 'image' | 'youtube' | 'video';
  embedUrl: string | null;
} {
  if (!url || !url.trim()) return { type: 'none', embedUrl: null };
  const trimmed = url.trim();

  // Check YouTube URLs
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
    };
  }

  // Check direct video extensions
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(trimmed)) {
    return { type: 'video', embedUrl: trimmed };
  }

  return { type: 'image', embedUrl: trimmed };
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