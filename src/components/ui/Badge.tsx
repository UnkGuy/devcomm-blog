import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'tag' | 'admin' | 'author' | 'user';
  className?: string;
}

export function Badge({ children, variant = 'tag', className }: BadgeProps) {
  const styles = {
    tag: 'bg-[#2b1d0f] text-[#e8cf96] border-[#6e552f]',
    admin: 'bg-[#5c1313] text-[#fde8e8] border-[#dc2626]',
    author: 'bg-[#3b2a14] text-[#f3d89c] border-[#c8aa6e]',
    user: 'bg-[#1c1612] text-[#a89882] border-[#4a3a24]',
  };

  return (
    <span
      className={cn(
        'font-display inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider border max-w-full break-all',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function GoldDivider({
  variant = 'gold',
  className,
}: {
  variant?: 'gold' | 'parchment';
  className?: string;
}) {
  if (variant === 'parchment') {
    return (
      <div className={cn('flex justify-center items-center my-4', className)}>
        <img
          src="/assets/images/parchment-divider.png"
          alt="Parchment Spellbook Divider"
          className="w-64 sm:w-80 h-16 object-contain object-center mix-blend-multiply opacity-85 select-none pointer-events-none"
        />
      </div>
    );
  }

  return (
    <div className={cn('flex justify-center items-center my-3', className)}>
      <img
        src="/assets/images/divider-gold.png"
        alt="Section Divider"
        className="w-60 h-10 object-cover object-center mix-blend-screen opacity-90 select-none pointer-events-none"
      />
    </div>
  );
}

export function WaxSeal({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/assets/images/wax-seal.png"
      alt="Wax Seal"
      width={size}
      height={size}
      className={cn('rounded-full object-cover inline-block shrink-0 select-none', className)}
    />
  );
}