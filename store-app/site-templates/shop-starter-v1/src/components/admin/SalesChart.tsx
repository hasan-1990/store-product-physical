'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export type SalesChartPoint = {
  day: string;
  value: number;
  label: string;
  highlight?: boolean;
};

type SalesChartProps = {
  data: SalesChartPoint[];
};

export function SalesChart({ data }: SalesChartProps) {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const maxValue = Math.max(...data.map((bar) => bar.value), 1);

  return (
    <div className="glass-card flex min-h-[400px] flex-col p-8 lg:col-span-8">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-on-surface">نمودار فروش روزانه</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRange('7d')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition',
              range === '7d' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant',
            )}
          >
            ۷ روز اخیر
          </button>
          <button
            type="button"
            onClick={() => setRange('30d')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition',
              range === '30d' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant',
            )}
          >
            ۳۰ روز اخیر
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-end gap-4 px-2">
        {data.map((bar) => (
          <div key={bar.day} className="group relative flex flex-1 flex-col items-center">
            <span className="absolute -top-8 rounded bg-on-surface px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
              {bar.label}
            </span>
            <div
              className={cn(
                'w-full rounded-t-lg transition-all group-hover:scale-y-105',
                bar.highlight ? 'bg-primary hover:bg-primary/90' : 'bg-primary-container/40 hover:bg-primary-container',
              )}
              style={{ height: `${Math.max(8, (bar.value / maxValue) * 100)}%` }}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between text-xs text-on-surface-variant opacity-60">
        {data.map((bar) => (
          <span key={bar.day}>{bar.day}</span>
        ))}
      </div>
    </div>
  );
}
