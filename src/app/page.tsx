import Link from 'next/link';
import { Feather } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { PostWithDetails } from '@/types/database.types';
import { PostFeed } from '@/components/post/PostFeed';
import { GoldDivider } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();

  // Execute all independent database queries simultaneously to prevent an SSR Waterfall
  const [
    { data: { user } },
    { data: rawPosts },
    { data: tags }
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('posts')
      .select(`
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
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })
  ]);

  const posts = (rawPosts as unknown as PostWithDetails[]) || [];

  return (
    <div className="space-y-8">
      <section className="bg3-panel p-6 sm:p-8 text-center">
        <p className="font-display text-xs uppercase tracking-[0.25em] text-[#c8aa6e]">
          Tales from the Material Plane &bull; Guild Dispatches
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#f3e5c8] mt-2">
          The Adventurer&apos;s Noticeboard
        </h1>
        <p className="text-base text-[#b8a68e] max-w-2xl mx-auto mt-2">
          Peruse the latest quest reports, arcane research, and tavern chronicles inscribed by fellow travelers across the realm.
        </p>
        <GoldDivider />
        <div className="mt-2">
          <Link href={user ? '/create' : '/login'}>
            <Button variant="gold" size="md">
              <Feather className="w-4 h-4" />
              <span>{user ? 'Scribe a New Scroll' : 'Sign In to Scribe a Scroll'}</span>
            </Button>
          </Link>
        </div>
      </section>

      <PostFeed
        initialPosts={posts}
        tags={tags || []}
        currentUserId={user?.id}
      />
    </div>
  );
}