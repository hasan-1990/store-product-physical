'use client';

import { CreditCard, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AdminStatItem = {
  id: string;
  label: string;
  value: string;
  change: string;
  changePositive: boolean;
  icon: 'payments' | 'bag' | 'users' | 'trending';
  iconBg: string;
};

const iconMap = {
  payments: CreditCard,
  bag: ShoppingBag,
  users: Users,
  trending: TrendingUp,
} as const;

type AdminStatsGridProps = {
  stats: AdminStatItem[];
};

export function AdminStatsGrid({ stats }: AdminStatsGridProps) {
  return (
    <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon];
        return (
          <div key={stat.id} className="glass-card flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between">
              <div className={cn('rounded-lg p-2', stat.iconBg)}>
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <span
                className={cn(
                  'text-xs font-semibold uppercase tracking-wider',
                  stat.changePositive ? 'text-secondary' : 'text-red-600',
                )}
              >
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{stat.label}</p>
              <h3 className="mt-1 font-display text-xl text-on-surface">{stat.value}</h3>
            </div>
          </div>
        );
      })}
    </div>
  );
}
