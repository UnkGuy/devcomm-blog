import Link from 'next/link';
import { MessageSquare, Calendar, Film, ExternalLink } from 'lucide-react';
import type { PostWithDetails } from '@/types/database.types';
import {
  formatRelativeDate,
  getParchmentClass,
  parseMediaUrl,
  DND_AVATAR_PRESETS,
} from '@/lib/utils';
import { Badge, WaxSeal } from '@/components/ui/Badge';
import { LikeButton } from './LikeButton';

interface PostCardProps {
  post: PostWithDetails;
  currentUserId?: string;
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const likesCount = post.post_likes?.length || 0;
  const isLiked = Boolean(
    currentUserId && post.post_likes?.some((l) => l.user_id === currentUserId)
  );
  const commentsCount = post.comments?.[0]?.count ?? 0;
  const tags =
    post.post_tags
      ?.map((pt) => pt.tags)
      .filter((t): t is NonNullable<typeof t> => Boolean(t)) || [];

  const parchmentClass = getParchmentClass(post.id);

  const cleanText = post.description.replace(/[#*`_~>-]/g, '').trim();
  const dynamicPreviewLimit =
    cleanText.length < 180
      ? cleanText.length
      : cleanText.length < 500
      ? 240
      : 440;
  const excerpt = cleanText.slice(0, dynamicPreviewLimit);

  const media = parseMediaUrl(post.cover_image_url);
  const authorAvatar = post.profiles?.avatar_url || DND_AVATAR_PRESETS[0].url;

  return (
    <article
      className={`${parchmentClass} p-6 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1 break-inside-avoid mb-6`}
    >
      <div>
        {/* Top Row: Tags + Random Wax Seal */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-1.5">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <Badge key={tag.id} variant="tag">
                  {tag.name}
                </Badge>
              ))
            ) : (
              <Badge variant="tag">General Lore</Badge>
            )}
            {(media.type === 'youtube' || media.type === 'video') && (
              <Badge variant="author">
                <Film className="w-3 h-3"/>
                <span>Scrying Vision</span>
              </Badge>
            )}
          </div>
          <WaxSeal seed={post.id} size={34} />
        </div>

        {/* Framed Image Preview (Only for Images on Noticeboard) */}
        {media.type === 'image' && media.embedUrl && (
          <Link className="block mb-4" href={`/post/${post.slug}`}>
            <div className="fantasy-media-frame overflow-hidden">
              <img
                src={media.embedUrl}
                alt={post.title}
                className="w-full max-h-64 object-cover fantasy-media-img"
                loading="lazy"
              />
            </div>
          </Link>
        )}

        {/* Styled External Link Badge if cover_image_url is a regular webpage URL */}
        {media.type === 'link' && media.embedUrl && (
          <a
            href={media.embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 px-3 py-2 bg-[#23170b]/10 border border-[#8c6a3d] hover:bg-[#23170b]/20 flex items-center justify-between gap-2 text-xs text-[#7c2d12] transition-colors"
          >
            <span className="font-display uppercase tracking-wider font-bold inline-flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 shrink-0"/>
              <span>{media.hostname}</span>
            </span>
            <span className="truncate max-w-[180px] underline opacity-85">
              {media.embedUrl}
            </span>
          </a>
        )}

        {/* Post Title */}
        <Link className="block group" href={`/post/${post.slug}`}>
          <h2 className="font-display text-xl font-bold text-[#1a0f05] group-hover:text-[#7c2d12] transition-colors [overflow-wrap:anywhere]">
            {post.title}
          </h2>
        </Link>

        {/* Asymmetrical Excerpt */}
        <p className="mt-2.5 text-base text-[#2f2010] leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">
          {excerpt}
          {cleanText.length > dynamicPreviewLimit ? '...' : ''}
        </p>
      </div>

      {/* Card Footer */}
      <div className="mt-6 pt-3 border-t border-[#8c6a3d]/50 flex items-center justify-between gap-2 text-xs text-[#4a3319] flex-wrap">
        <div className="flex items-center gap-2.5">
          <img
            src={authorAvatar}
            alt={post.profiles?.username || 'Scribe'}
            className="w-6 h-6 rounded-full object-cover border border-[#6e552f]"
          />
          <span className="font-semibold">
            {post.profiles?.username || 'Unknown Scribe'}
          </span>
          <span className="inline-flex items-center gap-1 opacity-80">
            <Calendar className="w-3.5 h-3.5"/>
            {formatRelativeDate(post.created_at)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <LikeButton currentPath="/" initialIsLiked={isLiked} initialLikesCount={likesCount} postId={post.id} />
          <Link className="font-display inline-flex items-center gap-1 px-2.5 py-1 border border-[#8c6a3d] bg-[#23170b]/10 text-[#3d2712] hover:bg-[#23170b]/20" href={`/post/${post.slug}#comments`}>
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{commentsCount}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}