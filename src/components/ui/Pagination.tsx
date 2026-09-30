'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Generate numbered page buttons
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 pt-6 flex-wrap">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="font-display px-3 py-1.5 text-xs uppercase tracking-wider border border-[#6e552f] bg-[#14100d] text-[#c8aa6e] hover:border-[#c8aa6e] disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1 cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>Prev</span>
      </button>

      {pages.map((pageNum) => {
        const isCurrent = pageNum === currentPage;
        return (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            className={`font-display min-w-[34px] h-[34px] px-2.5 text-xs font-bold border transition-colors cursor-pointer ${
              isCurrent
                ? 'bg-[#2c2012] text-[#fff3d1] border-[#c8aa6e] shadow-[0_0_10px_rgba(200,170,110,0.25)]'
                : 'bg-[#0b0908] text-[#9e8f77] border-[#4a3a24] hover:border-[#c8aa6e] hover:text-[#e8cf96]'
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="font-display px-3 py-1.5 text-xs uppercase tracking-wider border border-[#6e552f] bg-[#14100d] text-[#c8aa6e] hover:border-[#c8aa6e] disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1 cursor-pointer"
      >
        <span>Next</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}