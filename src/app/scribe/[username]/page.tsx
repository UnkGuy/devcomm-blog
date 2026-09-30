import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  ScrollText,
  MessageSquare,
  Shield,
  Sparkles,
  Flame,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { PostWithDetails } from '@/types/database.types';
import { DND_AVATAR_PRESETS } from '@/lib/utils';
import { Badge, GoldDivider } from '@/components/ui/Badge';
import { PostFeed } from '@/components/post/PostFeed';
import { InlineBioEditor } from './InlineBioEditor';

export const dynamic = 'force-dynamic';

interface ScribeProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ScribeProfilePage({
  params,
}: ScribeProfilePageProps) {
  const { username: rawUsername } = await params;
  const decodedUsername = decodeURIComponent(rawUsername);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', decodedUsername)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  // Fetch published scrolls by this user
  const { data: rawPosts } = await supabase
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
      ),
      comments (
        count
      )
    `
    )
    .eq('author_id', profile.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const posts = (rawPosts as unknown as PostWithDetails[]) || [];

  const scribeTagsMap = new Map<
    string,
    { id: string; name: string; slug: string }
  >();
  posts.forEach((p) => {
    p.post_tags?.forEach((pt) => {
      if (pt.tags) {
        scribeTagsMap.set(pt.tags.id, pt.tags);
      }
    });
  });
  const scribeTags = Array.from(scribeTagsMap.values());

  const totalInspiration = posts.reduce(
    (sum, post) => sum + (post.post_likes?.length || 0),
    0
  );

  const { data: recentComments } = await supabase
    .from('comments')
    .select(
      `
      id,
      content,
      created_at,
      parent_id,
      posts:post_id (
        id,
        title,
        slug
      )
    `
    )
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(12);

  const avatarUrl = profile.avatar_url || DND_AVATAR_PRESETS[0].url;
  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="font-display text-xs uppercase tracking-wider text-[#c8aa6e] hover:text-[#f3e5c8] inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Main Noticeboard</span>
        </Link>
      </div>

      {/* Scribe Dossier Banner */}
      <section className="bg3-panel p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <img
            src={avatarUrl}
            alt={profile.username}
            className="w-24 h-24 rounded-full object-cover border-2 border-[#c8aa6e] shadow-lg shrink-0"
          />

          <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#f3e5c8]">
                {profile.username}&apos;s Chronicle Ledger
              </h1>
              {profile.role === 'admin' ? (
                <Badge variant="admin">
                  <Shield className="w-3 h-3" />
                  <span>Archivist</span>
                </Badge>
              ) : (
                <Badge variant="gold">
                  <Sparkles className="w-3 h-3" />
                  <span>Adventurer</span>
                </Badge>
              )}
              {isOwnProfile && (
                <Badge variant="default">Your Personal Noticeboard</Badge>
              )}
            </div>

            {/* In-Place Bio Editor Component */}
            <InlineBioEditor
              initialBio={profile.bio}
              username={profile.username}
              avatarUrl={profile.avatar_url}
              isOwnProfile={isOwnProfile}
            />

            <div className="pt-2 flex items-center justify-center sm:justify-start gap-4 text-xs text-[#9e8f77] flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#c8aa6e]" />
                <span>
                  Joined{' '}
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1.5 text-[#e8cf96]">
                <ScrollText className="w-3.5 h-3.5 text-[#c8aa6e]" />
                <span>{posts.length} Scrolls Inscribed</span>
              </span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1.5 text-[#e8cf96]">
                <Flame className="w-3.5 h-3.5 text-[#c8aa6e]" />
                <span>{totalInspiration} Inspiration Earned</span>
              </span>
            </div>
          </div>
        </div>

        <GoldDivider className="mt-6 mb-0" />
      </section>

      {/* Scribe's Scrolls Noticeboard */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#6e552f] pb-2.5">
          <h2 className="font-display text-xl font-bold text-[#e8cf96] flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-[#c8aa6e]" />
            <span>Inscribed Scrolls ({posts.length})</span>
          </h2>
        </div>

        <PostFeed
          initialPosts={posts}
          tags={scribeTags}
          currentUserId={user?.id}
        />
      </section>

      {/* Recent Whispers & Replies */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-[#6e552f] pb-2.5">
          <h2 className="font-display text-xl font-bold text-[#e8cf96] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#c8aa6e]" />
            <span>Recent Whispers &amp; Counsel ({recentComments?.length || 0})</span>
          </h2>
        </div>

        {recentComments && recentComments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentComments.map((c) => {
              const rawPost = c.posts as unknown as
                | { id: string; title: string; slug: string }
                | { id: string; title: string; slug: string }[]
                | null;
              const targetPost = Array.isArray(rawPost) ? rawPost[0] : rawPost;

              return (
                <div
                  key={c.id}
                  className="bg3-panel p-4 flex flex-col justify-between gap-2 border border-[#6e552f]/70"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#9e8f77]">
                      <span>
                        {c.parent_id ? 'Replied on' : 'Whispered on'}{' '}
                        {targetPost ? (
                          <Link
                            href={`/post/${targetPost.slug}#comments`}
                            className="font-display text-[#e8cf96] hover:underline font-semibold"
                          >
                            {targetPost.title}
                          </Link>
                        ) : (
                          'a scroll'
                        )}
                      </span>
                      <span className="shrink-0">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#e8dcc4] line-clamp-3 italic">
                      &ldquo;{c.content}&rdquo;
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg3-panel p-8 text-center text-sm text-[#8c7b65]">
            {profile.username} has not left any whispers on the archive yet.
          </div>
        )}
      </section>
    </div>
  );
}