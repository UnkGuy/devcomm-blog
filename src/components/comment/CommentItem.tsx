'use client';

import React from 'react';
import { Trash2, User, Shield, Crown } from 'lucide-react';
import type { CommentWithAuthor } from '@/types/database.types';
import { formatRelativeDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface CommentItemProps {
  comment: CommentWithAuthor;
  postAuthorId: string;
  currentUserId?: string;
  currentUserRole?: 'user' | 'admin';
  onDelete: (commentId: string) => void;
  isDeleting?: boolean;
}

export function CommentItem({
  comment,
  postAuthorId,
  currentUserId,
  currentUserRole,
  onDelete,
  isDeleting,
}: CommentItemProps) {
  const isCommentAuthor = Boolean(currentUserId && currentUserId === comment.author_id);
  const isPostOwner = Boolean(currentUserId && currentUserId === postAuthorId);
  const isAdmin = currentUserRole === 'admin';

  // Requirement #5: Post owner can delete comments made on their post (plus comment author or admin)
  const canDelete = isCommentAuthor || isPostOwner || isAdmin;
  const isCommentByPostOwner = comment.author_id === postAuthorId;

  return (
    <div className="bg3-panel p-4 sm:p-5 transition-opacity duration-200">
      <div className="flex items-center justify-between gap-2 border-b border-[#6e552f]/40 pb-2.5 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display text-sm font-bold text-[#e8cf96] inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#c8aa6e]" />
            {comment.profiles?.username || 'Traveler'}
          </span>

          {comment.profiles?.role === 'admin' && (
            <Badge variant="admin">
              <Shield className="w-3 h-3" />
              <span>Admin</span>
            </Badge>
          )}

          {isCommentByPostOwner && (
            <Badge variant="author">
              <Crown className="w-3 h-3" />
              <span>Scroll Author</span>
            </Badge>
          )}

          <span className="text-xs text-[#8c7b65]">
            &bull; {formatRelativeDate(comment.created_at)}
          </span>
        </div>

        {canDelete && (
          <Button
            type="button"
            variant="crimson"
            size="sm"
            disabled={isDeleting}
            onClick={() => onDelete(comment.id)}
            title={
              isPostOwner && !isCommentAuthor
                ? 'Delete comment on your post (Post Owner Moderation)'
                : 'Delete comment'
            }
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Removing...' : 'Delete'}</span>
          </Button>
        )}
      </div>

      <p className="text-base text-[#e8dcc4] whitespace-pre-line leading-relaxed">
        {comment.content}
      </p>
    </div>
  );
}