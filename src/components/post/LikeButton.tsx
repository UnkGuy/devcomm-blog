'use client';

import React, { useState, useOptimistic, useTransition } from 'react';
import { Sparkles, Dices } from 'lucide-react';
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
  const [rollResult, setRollResult] = useState<number | null>(null);
  
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

    // Only roll the dice when *granting* inspiration, not removing it
    if (!optimisticState.isLiked) {
      const result = Math.floor(Math.random() * 20) + 1;
      setRollResult(result);
      setTimeout(() => setRollResult(null), 3000); // Hide dice badge after 3s
    }

    startTransition(async () => {
      setOptimisticState(null);
      await togglePostLikeAction(postId, currentPath);
    });
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`font-display inline-flex items-center gap-1.5 px-3 py-1 text-xs border transition-colors cursor-pointer relative z-10 ${
          optimisticState.isLiked
            ? 'bg-[#3d2915] text-[#f3d89c] border-[#c8aa6e] shadow-[0_0_8px_rgba(200,170,110,0.4)]'
            : 'bg-[#23170b]/10 text-[#3d2712] border-[#8c6a3d] hover:bg-[#23170b]/20 hover:text-[#5c3e21]'
        }`}
        title="Grant Inspiration (Like)"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{optimisticState.count}</span>
      </button>

      {/* Floating d20 Roll Animation Badge */}
      {rollResult !== null && (
        <div
          className={`absolute left-0 bottom-full mb-2 whitespace-nowrap px-2.5 py-1 border text-[10px] font-display uppercase tracking-wider flex items-center gap-1.5 shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-300 z-20 pointer-events-none ${
            rollResult === 20
              ? 'bg-[#4a3a14] border-[#e8cf96] text-[#fde68a]' // Critical Success
              : rollResult === 1
              ? 'bg-[#3b0d0d] border-[#991b1b] text-[#fca5a5]' // Critical Fail
              : 'bg-[#1c1612] border-[#c8aa6e] text-[#d4c3a3]' // Normal Roll
          }`}
        >
          <Dices className="w-3.5 h-3.5" />
          <span>
            {rollResult === 20
              ? 'Critical Inspiration! (Nat 20)'
              : rollResult === 1
              ? 'Pity Inspiration... (Nat 1)'
              : `Rolled a ${rollResult}`}
          </span>
        </div>
      )}
    </div>
  );
}