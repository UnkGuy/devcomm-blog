'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'error' | 'success';
  onClose: () => void;
}

export function Toast({ message, type = 'error', onClose }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md">
      <div
        className={`flex items-center gap-3 px-4 py-3 border shadow-xl ${
          type === 'error'
            ? 'bg-[#2a0a0a] border-[#dc2626] text-[#fecaca]'
            : 'bg-[#142615] border-[#c8aa6e] text-[#e8cf96]'
        }`}
      >
        {type === 'error' ? (
          <AlertTriangle className="w-5 h-5 text-[#f87171] shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-[#c8aa6e] shrink-0" />
        )}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-current/70 hover:text-current cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}