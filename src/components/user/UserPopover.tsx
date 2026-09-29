'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  X,
  ScrollText,
  MessageSquare,
  Calendar,
  ExternalLink,
  Shield,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeDate, getDiceBearAvatar, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface UserPopoverProps {
  userId?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  role?: 'user' | 'admin' | null;
  variant?: 'dark' | 'parchment';
  showAvatar?: boolean;
  avatarSize?: 'sm' | 'md';
  className?: string;
}

interface UserDossierSummary {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  role: 'user' | 'admin';
  created_at: string;
  scrollCount: number;
  whisperCount: number;
  latestPost: {
    title: string;
    slug: string;
    created_at: string;
  } | null;
  latestComment: {
    content: string;
    created_at: string;
    postTitle: string;
    postSlug: string;
  } | null;
}

const dossierCache = new Map<string, UserDossierSummary>();

export function UserPopover({
  userId,
  username,
  avatarUrl,
  role = 'user',
  variant = 'parchment',
  showAvatar = true,
  avatarSize = 'sm',
  className,
}: UserPopoverProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dossier, setDossier] = useState<UserDossierSummary | null>(null);

  const displayUsername = username || 'Unknown Scribe';
  const displayAvatar = avatarUrl || getDiceBearAvatar(displayUsername);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const cacheKey = userId || displayUsername;
    if (dossierCache.has(cacheKey)) {
      setDossier(dossierCache.get(cacheKey)!);
      return;
    }

    let cancelled = false;
    async function fetchUserDossier() {
      setLoading(true);
      const supabase = createClient();

      let profileQuery = supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, role, created_at');

      if (userId) {
        profileQuery = profileQuery.eq('id', userId);
      } else {
        profileQuery = profileQuery.eq('username', displayUsername);
      }

      const { data: profileData } = await profileQuery.maybeSingle();

      if (!profileData || cancelled) {
        setLoading(false);
        return;
      }

      const targetId = profileData.id;

      const [postsCountRes, commentsCountRes, latestPostRes, latestCommentRes] =
        await Promise.all([
          supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('author_id', targetId)
            .eq('is_published', true),
          supabase
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('author_id', targetId),
          supabase
            .from('posts')
            .select('title, slug, created_at')
            .eq('author_id', targetId)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('comments')
            .select('content, created_at, post_id')
            .eq('author_id', targetId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      if (cancelled) return;

      let latestCommentPost: { title: string; slug: string } | null = null;

      if (latestCommentRes.data?.post_id) {
        const { data: commentPost } = await supabase
          .from('posts')
          .select('title, slug')
          .eq('id', latestCommentRes.data.post_id)
          .maybeSingle();

        latestCommentPost = commentPost ?? null;
      }

      const summary: UserDossierSummary = {
        id: profileData.id,
        username: profileData.username,
        avatar_url: profileData.avatar_url,
        bio: profileData.bio,
        role: profileData.role,
        created_at: profileData.created_at,
        scrollCount: postsCountRes.count ?? 0,
        whisperCount: commentsCountRes.count ?? 0,
        latestPost: latestPostRes.data || null,
        latestComment:
          latestCommentRes.data && latestCommentPost
            ? {
                content: latestCommentRes.data.content,
                created_at: latestCommentRes.data.created_at,
                postTitle: latestCommentPost.title,
                postSlug: latestCommentPost.slug,
              }
            : null,
      };

      dossierCache.set(cacheKey, summary);
      setDossier(summary);
      setLoading(false);
    }

    fetchUserDossier();
    return () => {
      cancelled = true;
    };
  }, [isOpen, userId, displayUsername]);

  // Determine the single latest action (most recent between latestPost and latestComment)
  const latestActivity = React.useMemo(() => {
    if (!dossier) return null;
    const postTime = dossier.latestPost
      ? new Date(dossier.latestPost.created_at).getTime()
      : 0;
    const commentTime = dossier.latestComment
      ? new Date(dossier.latestComment.created_at).getTime()
      : 0;

    if (postTime === 0 && commentTime === 0) return null;
    if (postTime >= commentTime && dossier.latestPost) {
      return {
        type: 'scroll' as const,
        title: dossier.latestPost.title,
        slug: dossier.latestPost.slug,
        created_at: dossier.latestPost.created_at,
      };
    }
    if (dossier.latestComment) {
      return {
        type: 'whisper' as const,
        title: dossier.latestComment.postTitle,
        slug: dossier.latestComment.postSlug,
        snippet: dossier.latestComment.content,
        created_at: dossier.latestComment.created_at,
      };
    }
    return null;
  }, [dossier]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={cn(
          'inline-flex items-center gap-2 group cursor-pointer text-left transition-colors',
          variant === 'parchment'
            ? 'text-[#3d2712] hover:text-[#7c2d12]'
            : 'text-[#e8cf96] hover:text-[#f3e5c8]',
          className
        )}
        title={`Inspect ${displayUsername}'s Guild Card`}
      >
        {showAvatar && (
          <img
            src={displayAvatar}
            alt={displayUsername}
            className={cn(
              'rounded-full object-cover border transition-transform group-hover:scale-105 shrink-0',
              avatarSize === 'md' ? 'w-7 h-7' : 'w-6 h-6',
              variant === 'parchment' ? 'border-[#6e552f]' : 'border-[#c8aa6e]'
            )}
          />
        )}
        <span className="font-semibold group-hover:underline">
          {displayUsername}
        </span>
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <div className="bg3-panel w-full max-w-md overflow-hidden border border-[#c8aa6e] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              {/* Top Guild Banner */}
              <div className="bg-gradient-to-r from-[#24190e] via-[#18120c] to-[#24190e] p-5 border-b border-[#6e552f]/70 relative">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="absolute top-3.5 right-3.5 text-[#9e8f77] hover:text-[#f3e5c8] p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4">
                  <img
                    src={dossier?.avatar_url || displayAvatar}
                    alt={displayUsername}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#c8aa6e] shadow-md shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-lg font-bold text-[#e8cf96] truncate">
                        {dossier?.username || displayUsername}
                      </h3>
                      {(dossier?.role || role) === 'admin' ? (
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
                    </div>

                    {dossier?.created_at && (
                      <p className="text-[11px] text-[#9e8f77] flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-[#c8aa6e]" />
                        <span>
                          Guild Member since{' '}
                          {new Date(dossier.created_at).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              year: 'numeric',
                            }
                          )}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Guild Bio / Motto */}
                <p className="mt-3.5 text-xs sm:text-sm text-[#e8dcc4] italic bg-[#0b0908]/80 p-3 border border-[#6e552f]/50 leading-relaxed">
                  &ldquo;
                  {dossier?.bio ||
                    'A wandering scribe of the Chronicler’s Archive, yet to inscribe a personal motto.'}
                  &rdquo;
                </p>
              </div>

              {/* Body: Stats & Latest Activity */}
              <div className="p-5 space-y-4 bg-[#14100d]">
                {loading ? (
                  <div className="py-6 text-center text-xs font-display uppercase tracking-widest text-[#c8aa6e]">
                    Consulting the Guild Ledger...
                  </div>
                ) : (
                  <>
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-2.5 text-center">
                      <div className="bg-[#0b0908] border border-[#6e552f]/60 p-2.5">
                        <span className="font-display text-lg font-bold text-[#e8cf96] block">
                          {dossier?.scrollCount ?? 0}
                        </span>
                        <span className="font-display text-[10px] uppercase tracking-widest text-[#9e8f77] inline-flex items-center gap-1">
                          <ScrollText className="w-3 h-3 text-[#c8aa6e]" />
                          <span>Scrolls Inscribed</span>
                        </span>
                      </div>

                      <div className="bg-[#0b0908] border border-[#6e552f]/60 p-2.5">
                        <span className="font-display text-lg font-bold text-[#e8cf96] block">
                          {dossier?.whisperCount ?? 0}
                        </span>
                        <span className="font-display text-[10px] uppercase tracking-widest text-[#9e8f77] inline-flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-[#c8aa6e]" />
                          <span>Whispers Left</span>
                        </span>
                      </div>
                    </div>

                    {/* Latest Action Box (SpaceBattles Style) */}
                    <div className="bg-[#0b0908] border border-[#6e552f]/60 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-widest text-[#c8aa6e]">
                        <span>Latest Realm Activity</span>
                        {latestActivity && (
                          <span className="text-[#8c7b65]">
                            {formatRelativeDate(latestActivity.created_at)}
                          </span>
                        )}
                      </div>

                      {latestActivity ? (
                        latestActivity.type === 'scroll' ? (
                          <div>
                            <span className="text-xs text-[#9e8f77] block">
                              Inscribed a scroll:
                            </span>
                            <Link
                              href={`/post/${latestActivity.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="font-display text-sm font-bold text-[#e8cf96] hover:underline line-clamp-1"
                            >
                              {latestActivity.title}
                            </Link>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs text-[#9e8f77] block">
                              Whispered on{' '}
                              <Link
                                href={`/post/${latestActivity.slug}#comments`}
                                onClick={() => setIsOpen(false)}
                                className="text-[#e8cf96] hover:underline font-semibold"
                              >
                                {latestActivity.title}
                              </Link>
                              :
                            </span>
                            <p className="text-xs text-[#d4c3a3] italic line-clamp-2 mt-0.5">
                              &ldquo;{latestActivity.snippet}&rdquo;
                            </p>
                          </div>
                        )
                      ) : (
                        <p className="text-xs text-[#8c7b65] italic">
                          No scrolls or whispers recorded in the archive yet.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Footer Button to Full User Noticeboard */}
                <div className="pt-1 flex justify-end">
                  <Link
                    href={`/scribe/${encodeURIComponent(
                      dossier?.username || displayUsername
                    )}`}
                    onClick={() => setIsOpen(false)}
                    className="w-full font-display text-xs uppercase tracking-wider text-center py-2.5 px-4 bg-[#2c2012] text-[#e8cf96] border border-[#c8aa6e] hover:bg-[#3d2c19] transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <ScrollText className="w-3.5 h-3.5" />
                    <span>View Scribe&apos;s Noticeboard &amp; History</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}