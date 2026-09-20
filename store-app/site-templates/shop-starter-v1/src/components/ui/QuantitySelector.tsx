'use client';

import { Minus, Plus } from 'lucide-react';

type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
};

export function QuantitySelector({ value, onChange }: QuantitySelectorProps) {
  return (
    <div className="flex items-center rounded-lg border border-outline bg-surface p-1">
      <button
        type="button"
        aria-label="کاهش تعداد"
        className="flex h-10 w-10 items-center justify-center rounded transition hover:bg-surface-container"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-12 text-center font-bold">{value}</span>
      <button
        type="button"
        aria-label="افزایش تعداد"
        className="flex h-10 w-10 items-center justify-center rounded transition hover:bg-surface-container"
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
