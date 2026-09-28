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
    startTransition(async () => {
      setOptimisticState(null);
      await togglePostLikeAction(postId, currentPath);
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`font-display inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border transition-colors cursor-pointer ${
        optimisticState.isLiked
          ? 'bg-[#3d2915] text-[#f3d89c] border-[#c8aa6e]'
          : 'bg-[#23170b]/10 text-[#3d2712] border-[#8c6a3d] hover:bg-[#23170b]/20'
      }`}
      title="Grant Inspiration (Like)"
    >
      <Sparkles className="w-3.5 h-3.5" />
      <span>{optimisticState.count}</span>
    </button>
  );
}