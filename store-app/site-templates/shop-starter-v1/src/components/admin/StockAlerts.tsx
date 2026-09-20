import Image from 'next/image';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StockAlertItem = {
  id: string;
  name: string;
  status: string;
  level: 'critical' | 'warning';
  image: string;
};

type StockAlertsProps = {
  items: StockAlertItem[];
};

export function StockAlerts({ items }: StockAlertsProps) {
  return (
    <div className="glass-card flex flex-col p-8 lg:col-span-4">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-on-surface">هشدارهای موجودی</h2>
        <AlertTriangle className="h-5 w-5 text-red-600" strokeWidth={1.5} />
      </div>

      <div className="max-h-[300px] space-y-4 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-on-surface-variant">همه محصولات موجودی کافی دارند.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-surface-container-low',
                item.level === 'critical' ? 'border-r-4 border-red-600' : 'border-r-4 border-secondary-container',
              )}
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-surface-container">
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-on-surface">{item.name}</p>
                <p
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wider',
                    item.level === 'critical' ? 'text-red-600' : 'text-secondary',
                  )}
                >
                  {item.status}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <button type="button" className="mt-auto w-full rounded-lg border border-outline py-3 text-sm transition hover:bg-on-surface hover:text-white">
        مدیریت انبار
      </button>
    </div>
  );
}
