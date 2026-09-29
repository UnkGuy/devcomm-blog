'use client';

import React, { useOptimistic, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { togglePostLikeAction } from '@/lib/actions/post.actions';

interface LikeButtonProps {
  postId: string;
  initialLikesCount: number;
  initialIsLiked: boolean;
  currentPath: string;
}

export function LikeButton({
  postId,
  initialLikesCount,
  initialIsLiked,
  currentPath,
}: LikeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticState, setOptimisticState] = useOptimistic(
    { count: initialLikesCount, isLiked: initialIsLiked },
    (state) => ({
      count: state.isLiked ? state.count - 1 : state.count + 1,
      isLiked: !state.isLiked,
    })
  );

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!optimisticState.isLiked) {
      // Fire global dice roll animation
      const result = Math.floor(Math.random() * 20) + 1;
      window.dispatchEvent(
        new CustomEvent('trigger-dice-roll', {
          detail: { type: 'inspiration', result },
        })
      );
      // Wait for the animation before locking in the like
      setTimeout(() => {
        startTransition(async () => {
          setOptimisticState(null);
          await togglePostLikeAction(postId, currentPath);
        });
      }, 1500);
    } else {
      // Removing like happens instantly
      startTransition(async () => {
        setOptimisticState(null);
        await togglePostLikeAction(postId, currentPath);
      });
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`font-display inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-colors cursor-pointer relative z-10 ${
        optimisticState.isLiked
          ? 'bg-[#3d2915] text-[#f3d89c] border-[#c8aa6e] shadow-[0_0_8px_rgba(200,170,110,0.4)]'
          : 'bg-[#23170b]/10 text-[#3d2712] border-[#8c6a3d] hover:bg-[#23170b]/20 hover:text-[#5c3e21]'
      }`}
      title="Grant Inspiration (Like)"
    >
      <Sparkles className="w-4 h-4" />
      <span>{optimisticState.count}</span>
    </button>
  );
}