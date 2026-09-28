import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'crimson' | 'obsidian' | 'parchment';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  className,
  variant = 'gold',
  size = 'md',
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    gold: 'bg-[#2c2012] text-[#e8cf96] border-[#c8aa6e] hover:bg-[#3d2c19] hover:text-[#fff3d1]',
    crimson: 'bg-[#5c1313] text-[#fbd5d5] border-[#dc2626] hover:bg-[#751919]',
    obsidian: 'bg-[#14100d] text-[#c8b696] border-[#6e552f] hover:border-[#c8aa6e] hover:text-[#f3e5c8]',
    parchment: 'bg-[#2b1d0f] text-[#f3e5c8] border-[#6e552f] hover:bg-[#3d2915]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
  };

  return (
    <button
      disabled={disabled}
      className={cn(
        'font-display inline-flex items-center justify-center gap-2 border font-semibold tracking-wider uppercase transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}   