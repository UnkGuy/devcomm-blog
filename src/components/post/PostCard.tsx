import Link from 'next/link';
import { MessageSquare, Calendar, User } from 'lucide-react';
import type { PostWithDetails } from '@/types/database.types';
import { formatRelativeDate } from '@/lib/utils';
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

  // Strip raw markdown symbols for the card preview
  const cleanExcerpt = post.description
    .replace(/[#*`_~>-]/g, '')
    .slice(0, 160);

  return (
    <article className="parchment-scroll p-6 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1">
      <div>
        {/* Top Row: Tags + Wax Seal */}
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
          </div>
          <WaxSeal size={32} />
        </div>

        {/* Post Title */}
        <Link href={`/post/${post.slug}`} className="block group">
          <h2 className="font-display text-xl font-bold text-[#1a0f05] group-hover:text-[#7c2d12] transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>

        {/* 3-Line Excerpt */}
        <p className="mt-2.5 text-base text-[#2f2010] line-clamp-3 leading-relaxed">
          {cleanExcerpt}
          {post.description.length > 160 ? '...' : ''}
        </p>
      </div>

      {/* Card Footer: Author, Date, Likes, Comments */}
      <div className="mt-6 pt-3 border-t border-[#8c6a3d]/50 flex items-center justify-between gap-2 text-xs text-[#4a3319]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 font-semibold">
            <User className="w-3.5 h-3.5" />
            {post.profiles?.username || 'Unknown Scribe'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatRelativeDate(post.created_at)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <LikeButton
            postId={post.id}
            initialLikesCount={likesCount}
            initialIsLiked={isLiked}
            currentPath="/"
          />
          <Link
            href={`/post/${post.slug}#comments`}
            className="font-display inline-flex items-center gap-1 px-2.5 py-1 border border-[#8c6a3d] bg-[#23170b]/10 text-[#3d2712] hover:bg-[#23170b]/20"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{commentsCount}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}