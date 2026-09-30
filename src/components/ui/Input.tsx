'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  variant?: 'dark' | 'parchment';
}

export function Input({
  label,
  className,
  variant = 'dark',
  type = 'text',
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full space-y-1.5 relative">
      {label && (
        <label
          className={cn(
            'block font-display text-xs uppercase tracking-widest font-semibold',
            variant === 'dark' ? 'text-[#c8aa6e]' : 'text-[#5a4228]'
          )}
        >
          {label}
        </label>
      )}
      
      <div className="relative w-full">
        <input
          type={inputType}
          className={cn(
            'w-full px-3.5 py-2 text-base transition-colors focus:outline-none',
            isPassword ? 'pr-10' : '',
            variant === 'dark'
              ? 'bg-[#0b0908] border border-[#6e552f] text-[#f3e5c8] placeholder:text-[#786852] focus:border-[#c8aa6e]'
              : 'bg-[#f8edd6]/80 border border-[#8c6a3d] text-[#23170b] placeholder:text-[#785c3c] focus:border-[#4a3319]',
            className
          )}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors",
              variant === 'dark' ? 'text-[#8c7b65] hover:text-[#c8aa6e]' : 'text-[#8c6a3d] hover:text-[#4a3319]'
            )}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}