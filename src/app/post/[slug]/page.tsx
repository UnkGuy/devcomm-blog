import { notFound } from 'next/navigation';
import Link from 'next/link';
import { marked } from 'marked';
import { ArrowLeft, Calendar, User, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { deletePostAction } from '@/lib/actions/post.actions';
import type { PostWithDetails, CommentWithAuthor } from '@/types/database.types';
import { formatRelativeDate } from '@/lib/utils';
import { Badge, GoldDivider, WaxSeal } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LikeButton } from '@/components/post/LikeButton';
import { CommentSection } from '@/components/comment/CommentSection';

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

  // 1. Fetch the Single Post
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

  // 2. Fetch Comments for this Post
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

  // Strip any raw script tags before parsing Markdown on the server
  const safeMarkdown = post.description.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  const htmlContent = marked.parse(safeMarkdown, { async: false }) as string;

  async function handleDeletePost() {
    'use server';
    await deletePostAction(post.id);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-xs uppercase tracking-wider text-[#c8aa6e] hover:text-[#f3e5c8] inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Noticeboard</span>
        </Link>

        {canDeletePost && (
          <form action={handleDeletePost}>
            <Button type="submit" variant="crimson" size="sm">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Burn Scroll (Delete Post)</span>
            </Button>
          </form>
        )}
      </div>

      {/* Main Unfurled Parchment Scroll (Requirement #3: View Single Post) */}
      <article className="parchment-scroll p-6 sm:p-12">
        {/* Tags */}
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

        {/* Title */}
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1a0f05] text-center leading-tight">
          {post.title}
        </h1>

        {/* Metadata */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs sm:text-sm text-[#4a3319]">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <User className="w-4 h-4" />
            <span>Inscribed by {post.profiles?.username || 'Unknown Scribe'}</span>
          </span>
          <span>&bull;</span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formatRelativeDate(post.created_at)}</span>
          </span>
        </div>

        <GoldDivider />

        {/* Markdown Body with D&D Drop Cap */}
        <div
          className="lore-content mt-6 text-[#23170b] first-letter:font-display first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-[#7c2d12]"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Scroll Footer: Like Button & Wax Seal */}
        <div className="mt-10 pt-5 border-t border-[#8c6a3d]/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LikeButton
              postId={post.id}
              initialLikesCount={likesCount}
              initialIsLiked={isLiked}
              currentPath={`/post/${post.slug}`}
            />
            <span className="text-xs text-[#4a3319] italic">
              Grant Inspiration to commend this scribe
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-display text-[11px] uppercase tracking-widest text-[#4a3319] hidden sm:inline">
              Official Guild Seal
            </span>
            <WaxSeal size={44} />
          </div>
        </div>
      </article>

      {/* Separate Comment Cards Section (Requirements #4 & #5) */}
      <CommentSection
        postId={post.id}
        postSlug={post.slug}
        postAuthorId={post.author_id}
        initialComments={comments}
        currentUserId={user?.id}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}