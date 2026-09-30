'use client';

import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  Trash2,
  Shield,
  Crown,
  Reply,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { CommentWithAuthor } from '@/types/database.types';
import { formatRelativeDate, processHtmlAutoLinks, getAvatarFallback } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UserPopover } from '@/components/user/UserPopover';
import { CommentForm } from './CommentForm';

export interface CommentTreeNode extends CommentWithAuthor {
  replies: CommentTreeNode[];
  parentAuthorUsername?: string | null;
}

interface CommentItemProps {
  comment: CommentTreeNode;
  postId: string;
  postSlug: string;
  postAuthorId: string;
  currentUserId?: string;
  currentUserRole?: 'user' | 'admin';
  onDelete: (commentId: string) => void;
  onReplyAdded: (newComment: CommentWithAuthor) => void;
  deletingId: string | null;
  depth?: number;
}

export function CommentItem({
  comment,
  postId,
  postSlug,
  postAuthorId,
  currentUserId,
  currentUserRole,
  onDelete,
  onReplyAdded,
  deletingId,
  depth = 0,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [repliesCollapsed, setRepliesCollapsed] = useState(false);

  const isCommentAuthor = Boolean(
    currentUserId && currentUserId === comment.author_id
  );
  const isPostOwner = Boolean(currentUserId && currentUserId === postAuthorId);
  const isAdmin = currentUserRole === 'admin';

  const canDelete = isCommentAuthor || isPostOwner || isAdmin;
  const isCommentByPostOwner = comment.author_id === postAuthorId;
  const isDeleting = deletingId === comment.id;

  const renderedHtml = useMemo(() => {
    if (!comment.content.trim()) return '';
    
    // 1. Convert plain text and bare URLs to standard HTML & <a> tags
    const rawHtml = marked.parse(comment.content, {
      async: false,
      gfm: true,
      breaks: true,
    }) as string;

    // 2. Intercept those <a> tags and morph them into embeds via our optimized util
    const embeddedHtml = processHtmlAutoLinks(rawHtml);

    // 3. Sanitize for security
    if (typeof window !== 'undefined') {
      return DOMPurify.sanitize(embeddedHtml, {
        ADD_TAGS: ['iframe', 'video'],
        ADD_ATTR: [
          'allow',
          'allowfullscreen',
          'frameborder',
          'scrolling',
          'target',
          'rel',
          'controls',
        ],
      });
    }
    return embeddedHtml;
  }, [comment.content]);

  return (
    <div className="space-y-2.5">
      <div className={`bg3-panel p-3 sm:p-4 transition-opacity duration-200 ${depth > 0 ? 'bg-[#120e0b] border-[#6e552f]/80' : ''}`}>
        {depth > 0 && comment.parentAuthorUsername && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-[#c8aa6e] font-display uppercase tracking-wider">
            <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
            <span>Replying to @{comment.parentAuthorUsername}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-b border-[#6e552f]/40 pb-2.5 mb-2.5 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <UserPopover
              userId={comment.author_id}
              username={comment.profiles?.username || 'Traveler'}
              avatarUrl={comment.profiles?.avatar_url}
              role={comment.profiles?.role}
              variant="dark"
              avatarSize="md"
            />

            {comment.profiles?.role === 'admin' && (
              <Badge variant="admin"><Shield className="w-3 h-3" /><span>Archivist</span></Badge>
            )}

            {isCommentByPostOwner && (
              <Badge variant="author"><Crown className="w-3 h-3" /><span>Scroll Author</span></Badge>
            )}

            <span className="text-xs text-[#8c7b65]">
              &bull; {formatRelativeDate(comment.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentUserId && (
              <button
                type="button"
                onClick={() => setIsReplying((prev) => !prev)}
                className="font-display text-xs uppercase tracking-wider px-2.5 py-1 border border-[#6e552f] bg-[#1c1612] text-[#d4c3a3] hover:border-[#c8aa6e] hover:text-[#e8cf96] inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Reply className="w-3 h-3 text-[#c8aa6e]" />
                <span>Reply</span>
              </button>
            )}

            {canDelete && (
              <Button type="button" variant="crimson" size="sm" disabled={isDeleting} onClick={() => onDelete(comment.id)}>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Removing...' : 'Delete'}</span>
              </Button>
            )}
          </div>
        </div>

        <div
          className="text-[15px] sm:text-base text-[#e8dcc4] leading-relaxed [overflow-wrap:anywhere] lore-content"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />

        {comment.replies.length > 0 && (
          <div className="mt-3 pt-2 border-t border-[#6e552f]/25 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setRepliesCollapsed((prev) => !prev)}
              className="font-display text-[11px] uppercase tracking-wider text-[#c8aa6e] hover:text-[#f3e5c8] inline-flex items-center gap-1 cursor-pointer"
            >
              {repliesCollapsed ? (
                <><ChevronDown className="w-3.5 h-3.5" /><span>Show {comment.replies.length} {comment.replies.length === 1 ? 'Reply' : 'Replies'}</span></>
              ) : (
                <><ChevronUp className="w-3.5 h-3.5" /><span>Hide {comment.replies.length} {comment.replies.length === 1 ? 'Reply' : 'Replies'}</span></>
              )}
            </button>
          </div>
        )}
      </div>

      {isReplying && (
        <div className={depth === 0 ? 'pl-4 sm:pl-7' : ''}>
          <CommentForm
            postId={postId}
            postSlug={postSlug}
            parentId={comment.id}
            replyToUsername={comment.profiles?.username || 'Traveler'}
            onCommentAdded={(newReply) => {
              onReplyAdded(newReply);
              setIsReplying(false);
              setRepliesCollapsed(false);
            }}
            onCancel={() => setIsReplying(false)}
          />
        </div>
      )}

      {comment.replies.length > 0 && !repliesCollapsed && (
        <div className={depth === 0 ? 'pl-4 sm:pl-7 border-l-2 border-[#6e552f]/60 space-y-2.5' : 'space-y-2.5'}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              postSlug={postSlug}
              postAuthorId={postAuthorId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onDelete={onDelete}
              onReplyAdded={onReplyAdded}
              deletingId={deletingId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}