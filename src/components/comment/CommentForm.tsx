'use client';

import React, { useState } from 'react';
import { Send, X, CornerDownRight, Dices } from 'lucide-react';
import { addCommentAction } from '@/lib/actions/comment.actions';
import type { CommentWithAuthor } from '@/types/database.types';
import { Button } from '@/components/ui/Button';

interface CommentFormProps {
  postId: string;
  postSlug: string;
  parentId?: string | null;
  replyToUsername?: string;
  onCommentAdded: (comment: CommentWithAuthor) => void;
  onCancel?: () => void;
}

const DND_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival',
];

export function CommentForm({
  postId,
  postSlug,
  parentId = null,
  replyToUsername,
  onCommentAdded,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [showSkillCheck, setShowSkillCheck] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(DND_SKILLS[0]);
  const [modifier, setModifier] = useState<number>(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReply = Boolean(parentId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError(null);

    const skillCheckData = showSkillCheck
      ? { skill: selectedSkill, modifier }
      : null;

    const result = await addCommentAction(
      postId,
      content,
      postSlug,
      parentId,
      skillCheckData
    );

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    if (result?.data) {
      onCommentAdded(result.data as unknown as CommentWithAuthor);
      setContent('');
      setShowSkillCheck(false);
      setModifier(0);
      onCancel?.();
    }
    setSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isReply
          ? 'bg-[#0e0b09] border border-[#c8aa6e]/70 p-3.5 space-y-2.5 mt-2'
          : 'bg3-panel p-5 space-y-3'
      }
    >
      <div className="flex items-center justify-between">
        <label className="font-display text-xs uppercase tracking-widest text-[#c8aa6e] font-semibold flex items-center gap-1.5">
          {isReply ? (
            <>
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>Replying to @{replyToUsername || 'Traveler'}</span>
            </>
          ) : (
            <span>Leave a Whisper on This Scroll</span>
          )}
        </label>

        {isReply && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-[#9e8f77] hover:text-[#f3e5c8] inline-flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      <textarea
        rows={isReply ? 2 : 3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          isReply
            ? `Write your reply to @${replyToUsername || 'Traveler'}...`
            : 'Share your counsel, findings, or critique with the scribe...'
        }
        autoFocus={isReply}
        required
        className="w-full px-3.5 py-2 bg-[#0b0908] border border-[#6e552f] text-[#f3e5c8] placeholder:text-[#786852] focus:outline-none focus:border-[#c8aa6e] text-sm sm:text-base"
      />

      {/* Optional Skill Check Attacher */}
      {showSkillCheck && (
        <div className="flex items-center gap-2 bg-[#1c1612] p-2 border border-[#6e552f]/60 flex-wrap">
          <Dices className="w-4 h-4 text-[#c8aa6e]" />
          <span className="text-xs text-[#d4c3a3] font-display uppercase tracking-wider">
            Roll Check:
          </span>
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="bg-[#0b0908] text-[#f3e5c8] border border-[#6e552f] px-2 py-1 text-xs focus:outline-none"
          >
            {DND_SKILLS.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowSkillCheck(false)}
            className="ml-auto text-xs text-[#fca5a5] hover:text-white"
          >
            Cancel Roll
          </button>
        </div>
      )}

      {error && <p className="text-xs text-[#f87171]">{error}</p>}

      <div className="flex justify-between items-center">
        {!showSkillCheck ? (
          <button
            type="button"
            onClick={() => setShowSkillCheck(true)}
            className="text-[11px] font-display uppercase tracking-wider text-[#9e8f77] hover:text-[#c8aa6e] flex items-center gap-1.5 border border-transparent hover:border-[#6e552f] px-2 py-1 transition-colors"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Attach Skill Check</span>
          </button>
        ) : (
          <div /> // Spacer
        )}

        <div className="flex gap-2">
          {isReply && onCancel && (
            <Button type="button" variant="obsidian" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="gold" size="sm" disabled={submitting}>
            <Send className="w-3.5 h-3.5" />
            <span>
              {submitting
                ? 'Inscribing...'
                : isReply
                ? 'Post Reply'
                : 'Post Whisper'}
            </span>
          </Button>
        </div>
      </div>
    </form>
  );
}