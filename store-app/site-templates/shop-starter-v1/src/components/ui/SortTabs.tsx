'use client';

import { cn } from '@/lib/utils';

type SortTabsProps<T extends string> = {
  label?: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SortTabs<T extends string>({ label = 'ترتیب', options, value, onChange }: SortTabsProps<T>) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-outline/20 bg-surface-container-high/50 p-1.5">
      <span className="pr-2 text-xs font-bold text-on-surface-variant">{label}:</span>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            'rounded-md px-4 py-1.5 text-sm transition-colors',
            value === option.id
              ? 'bg-white font-semibold text-primary shadow-sm'
              : 'font-medium text-on-surface-variant hover:bg-white/50',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
