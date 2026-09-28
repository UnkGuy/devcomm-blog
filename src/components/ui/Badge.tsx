'use client';

import React, { useState, useEffect } from 'react';
import { cn, WAX_SEAL_IMAGES, getWaxSealImage } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'tag' | 'author' | 'admin' | 'crimson' | 'gold';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    default:
      'bg-[#1c1612] text-[#d4c3a3] border border-[#6e552f]/80',
    tag:
      'bg-[#23170b]/15 text-[#3d2712] border border-[#8c6a3d] font-semibold',
    author:
      'bg-[#2c2012] text-[#e8cf96] border border-[#c8aa6e]',
    admin:
      'bg-[#450a0a] text-[#fca5a5] border border-[#dc2626]',
    crimson:
      'bg-[#3b0d0d] text-[#fecaca] border border-[#991b1b]',
    gold:
      'bg-[#2c2012] text-[#e8cf96] border border-[#c8aa6e]',
  };

  return (
    <span
      className={cn(
        'font-display inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

interface GoldDividerProps {
  variant?: 'gold' | 'parchment';
  className?: string;
}

export function GoldDivider({
  variant = 'gold',
  className,
}: GoldDividerProps) {
  if (variant === 'parchment') {
    return (
      <div className={cn('my-5 flex justify-center select-none', className)}>
        <img
          src="/assets/images/parchment-divider.png"
          alt=""
          aria-hidden="true"
          className="h-14 sm:h-20 w-full max-w-lg object-contain mix-blend-multiply opacity-90"
        />
      </div>
    );
  }

  return (
    <div className={cn('my-4 flex justify-center select-none', className)}>
      <img
        src="/assets/images/divider-gold.png"
        alt=""
        aria-hidden="true"
        className="h-11 sm:h-16 w-full max-w-lg object-contain mix-blend-screen opacity-95"
      />
    </div>
  );
}

interface WaxSealProps {
  size?: number;
  seed?: string;
  className?: string;
}

export function WaxSeal({ size = 36, seed, className }: WaxSealProps) {
  const [sealSrc, setSealSrc] = useState<string>(() =>
    seed ? getWaxSealImage(seed) : WAX_SEAL_IMAGES[0]
  );

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * WAX_SEAL_IMAGES.length);
    setSealSrc(WAX_SEAL_IMAGES[randomIndex]);
  }, []);

  return (
    <img
      src={sealSrc}
      alt="Guild Wax Seal"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn(
        'wax-seal-stamp shrink-0 object-contain select-none pointer-events-none',
        className
      )}
    />
  );
}