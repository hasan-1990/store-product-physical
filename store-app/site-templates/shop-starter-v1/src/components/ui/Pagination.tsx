'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <nav aria-label="صفحه‌بندی" className="mt-20 flex items-center justify-center gap-2">
      <button
        type="button"
        aria-label="صفحه قبل"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="btn-ghost h-10 w-10"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPageChange(n)}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border font-medium transition',
            page === n ? 'border-primary bg-primary text-white' : 'border-outline hover:border-primary',
          )}
        >
          {n.toLocaleString('fa-IR')}
        </button>
      ))}

      <button
        type="button"
        aria-label="صفحه بعد"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="btn-ghost h-10 w-10"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </nav>
  );
}
