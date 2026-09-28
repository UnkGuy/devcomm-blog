'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { addCommentAction } from '@/lib/actions/comment.actions';
import type { CommentWithAuthor } from '@/types/database.types';
import { Button } from '@/components/ui/Button';

interface CommentFormProps {
  postId: string;
  postSlug: string;
  onCommentAdded: (comment: CommentWithAuthor) => void;
}

export function CommentForm({
  postId,
  postSlug,
  onCommentAdded,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError(null);

    const result = await addCommentAction(postId, content, postSlug, null);

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    if (result?.data) {
      onCommentAdded(result.data as unknown as CommentWithAuthor);
      setContent('');
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg3-panel p-5 space-y-3">
      <label className="block font-display text-xs uppercase tracking-widest text-[#c8aa6e] font-semibold">
        Leave a Whisper on This Scroll
      </label>

      <textarea
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your counsel, findings, or critique with the scribe..."
        required
        className="w-full px-3.5 py-2.5 bg-[#0b0908] border border-[#6e552f] text-[#f3e5c8] placeholder:text-[#786852] focus:outline-none focus:border-[#c8aa6e] text-base"
      />

      {error && <p className="text-xs text-[#f87171]">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" variant="gold" size="sm" disabled={submitting}>
          <Send className="w-3.5 h-3.5" />
          <span>{submitting ? 'Inscribing...' : 'Post Whisper'}</span>
        </Button>
      </div>
    </form>
  );
}