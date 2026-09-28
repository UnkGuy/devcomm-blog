'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { MessageSquare, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { deleteCommentAction } from '@/lib/actions/comment.actions';
import type { CommentWithAuthor } from '@/types/database.types';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

interface CommentSectionProps {
  postId: string;
  postSlug: string;
  postAuthorId: string;
  initialComments: CommentWithAuthor[];
  currentUserId?: string;
  currentUserRole?: 'user' | 'admin';
}

export function CommentSection({
  postId,
  postSlug,
  postAuthorId,
  initialComments,
  currentUserId,
  currentUserRole,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Supabase Realtime Subscription for instant live comments/deletions
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`comments-post-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const newId = payload.new.id as string;
          const { data } = await supabase
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
            .eq('id', newId)
            .single();

          if (data) {
            setComments((prev) => {
              if (prev.some((c) => c.id === data.id)) return prev;
              return [...prev, data as unknown as CommentWithAuthor];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          const deletedId = payload.old.id as string;
          setComments((prev) => prev.filter((c) => c.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  function handleCommentAdded(newComment: CommentWithAuthor) {
    setComments((prev) => {
      if (prev.some((c) => c.id === newComment.id)) return prev;
      return [...prev, newComment];
    });
  }

  function handleDeleteComment(commentId: string) {
    const previousComments = [...comments];
    setDeletingId(commentId);

    // Optimistic UI: immediately remove the comment card from the screen
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    startTransition(async () => {
      const result = await deleteCommentAction(commentId, postSlug);
      setDeletingId(null);

      if (result?.error) {
        // Revert if server rejected deletion
        setComments(previousComments);
        setToastMessage(result.error);
      }
    });
  }

  return (
    <section id="comments" className="space-y-5 mt-10">
      <div className="flex items-center justify-between border-b border-[#6e552f] pb-3">
        <h2 className="font-display text-xl font-bold text-[#e8cf96] flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#c8aa6e]" />
          <span>Whispers &amp; Counsel ({comments.length})</span>
        </h2>
        {currentUserId === postAuthorId && (
          <span className="text-xs text-[#c8aa6e] font-display uppercase tracking-wider">
            Scroll Owner Moderation Active
          </span>
        )}
      </div>

      {/* Add Comment Box or Sign-In Prompt */}
      {currentUserId ? (
        <CommentForm
          postId={postId}
          postSlug={postSlug}
          onCommentAdded={handleCommentAdded}
        />
      ) : (
        <div className="bg3-panel p-5 flex items-center justify-between gap-4">
          <p className="text-sm text-[#b8a68e]">
            You must enter the archive to leave a comment on this scroll.
          </p>
          <Link href="/login">
            <Button variant="gold" size="sm">
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Separate Smaller Cards for Each Comment */}
      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postAuthorId={postAuthorId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onDelete={handleDeleteComment}
              isDeleting={deletingId === comment.id}
            />
          ))}
        </div>
      ) : (
        <div className="bg3-panel p-8 text-center text-sm text-[#8c7b65]">
          No whispers have been left on this scroll yet. Be the first to speak!
        </div>
      )}

      <Toast
        message={toastMessage}
        type="error"
        onClose={() => setToastMessage(null)}
      />
    </section>
  );
}