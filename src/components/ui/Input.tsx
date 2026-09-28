import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  variant?: 'dark' | 'parchment';
}

export function Input({
  label,
  className,
  variant = 'dark',
  ...props
}: InputProps) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          className={cn(
            'block font-display text-xs uppercase tracking-widest font-semibold',
            variant === 'dark' ? 'text-[#c8aa6e]' : 'text-[#3d2712]'
          )}
        >
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-3.5 py-2 text-base transition-colors focus:outline-none',
          variant === 'dark'
            ? 'bg-[#0b0908] border border-[#6e552f] text-[#f3e5c8] placeholder:text-[#786852] focus:border-[#c8aa6e]'
            : 'bg-[#f8edd6]/80 border border-[#8c6a3d] text-[#23170b] placeholder:text-[#785c3c] focus:border-[#3d2712]',
          className
        )}
        {...props}
      />
    </div>
  );
}