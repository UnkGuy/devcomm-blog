import { notFound } from 'next/navigation';
import { UserPopover } from '@/components/user/UserPopover';
import Link from 'next/link';
import { marked } from 'marked';
import { ArrowLeft, Calendar, Trash2, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { deletePostAction } from '@/lib/actions/post.actions';
import type { PostWithDetails, CommentWithAuthor } from '@/types/database.types';
import {
  formatRelativeDate,
  getParchmentClass,
  parseMediaUrl,
  formatMarkdownWithAutoLinks,
  getDiceBearAvatar,
} from '@/lib/utils';
import { Badge, GoldDivider, WaxSeal } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LikeButton } from '@/components/post/LikeButton';
import { CommentSection } from '@/components/comment/CommentSection';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

export const dynamic = 'force-dynamic';

interface SinglePostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SinglePostPage({ params }: SinglePostPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUserRole: 'user' | 'admin' = 'user';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role) currentUserRole = profile.role;
  }

  const { data: rawPost } = await supabase
    .from('posts')
    .select(
      `
      *,
      profiles:author_id (
        id,
        username,
        avatar_url,
        role
      ),
      post_tags (
        tags (
          id,
          name,
          slug
        )
      ),
      post_likes (
        user_id
      )
    `
    )
    .eq('slug', slug)
    .maybeSingle();

  if (!rawPost) {
    notFound();
  }

  const post = rawPost as unknown as PostWithDetails;

  const { data: rawComments } = await supabase
    .from('comments')
    .select(
      `
      *,
      profiles:author_id (
        id,
        username,
        avatar_url,
        role
      )
    `
    )
    .eq('post_id', post.id)
    .order('created_at', { ascending: true });

  const comments = (rawComments as unknown as CommentWithAuthor[]) || [];

  const tags =
    post.post_tags
      ?.map((pt) => pt.tags)
      .filter((t): t is NonNullable<typeof t> => Boolean(t)) || [];

  const likesCount = post.post_likes?.length || 0;
  const isLiked = Boolean(
    user && post.post_likes?.some((l) => l.user_id === user.id)
  );
  const canDeletePost = Boolean(
    user && (user.id === post.author_id || currentUserRole === 'admin')
  );

  const parchmentClass = getParchmentClass(post.id);
  const media = parseMediaUrl(post.cover_image_url);

  // TipTap outputs HTML directly, so we just strip scripts for safety
  const htmlContent = post.description.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );

  async function handleDeletePost() {
    'use server';
    await deletePostAction(post.id);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link className="font-display text-xs uppercase tracking-wider text-[#c8aa6e] hover:text-[#f3e5c8] inline-flex items-center gap-1.5" href="/">
          <ArrowLeft className="w-4 h-4"/>
          <span>Return to Noticeboard</span>
        </Link>

        {canDeletePost && (
          <form action={handleDeletePost}>
            <Button size="sm" type="submit" variant="crimson">
              <Trash2 className="w-3.5 h-3.5"/>
              <span>Burn Scroll (Delete Post)</span>
            </Button>
          </form>
        )}
      </div>

      <article className={`${parchmentClass} p-6 sm:p-12 overflow-hidden relative`}>
        <div className="flex justify-center flex-wrap gap-1.5 mb-4">
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

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1a0f05] text-center leading-tight [overflow-wrap:anywhere]">
          {post.title}
        </h1>

        <div className="mt-3 flex items-center justify-center gap-3 text-xs sm:text-sm text-[#4a3319] flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <span>Inscribed by</span>
            <UserPopover
              userId={post.author_id}
              username={post.profiles?.username || 'Unknown Scribe'}
              avatarUrl={post.profiles?.avatar_url}
              role={post.profiles?.role}
              variant="parchment"
            />
          </span>
          <span>&bull;</span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4"/>
            <span>{formatRelativeDate(post.created_at)}</span>
          </span>
        </div>

        <GoldDivider variant="parchment"/>

        {media.type !== 'none' && media.embedUrl && (
          <div className="my-6">
            {media.type === 'image' && (
              <div className="fantasy-media-frame cursor-zoom-in">
                <img
                  src={media.embedUrl}
                  alt={post.title}
                  className="w-full max-h-[460px] object-cover fantasy-media-img"
                />
              </div>
            )}
            {media.type === 'youtube' && (
              <div className="fantasy-media-frame">
                <div className="aspect-video w-full">
                  <iframe src={media.embedUrl} className="w-full h-full" allowFullScreen title={post.title} />
                </div>
              </div>
            )}
            {media.type === 'video' && (
              <div className="fantasy-media-frame">
                <video src={media.embedUrl} controls className="w-full max-h-[460px] bg-black" />
              </div>
            )}
            {media.type === 'link' && (
              <a href={media.embedUrl} target="_blank" rel="noopener noreferrer" className="block p-4 bg-[#23170b]/10 border border-[#8c6a3d] hover:bg-[#23170b]/20 transition-colors">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="font-display text-xs uppercase tracking-wider text-[#7c2d12] font-bold inline-flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 shrink-0"/>
                    <span>Referenced Chronicle ({media.hostname})</span>
                  </span>
                  <span className="text-xs text-[#4a3319] underline break-all">
                    {media.embedUrl}
                  </span>
                </div>
              </a>
            )}
          </div>
        )}

        <div
          className="lore-content mt-6 text-[#23170b] [overflow-wrap:anywhere] first-letter:font-display first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-[#7c2d12]"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        <div className="mt-10 pt-5 border-t border-[#8c6a3d]/50 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <LikeButton currentPath={`/post/${post.slug}`} initialIsLiked={isLiked} initialLikesCount={likesCount} postId={post.id} />
            <span className="text-xs text-[#4a3319] italic">
              Grant Inspiration to commend this scribe
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-[11px] uppercase tracking-widest text-[#4a3319] hidden sm:inline">Official Guild Seal</span>
            <WaxSeal seed={post.id} size={44} />
          </div>
        </div>
      </article>

      <ImageLightbox />

      <CommentSection
        currentUserId={user?.id}
        currentUserRole={currentUserRole}
        initialComments={comments}
        postAuthorId={post.author_id}
        postId={post.id}
        postSlug={post.slug}
      />
    </div>
  );
}