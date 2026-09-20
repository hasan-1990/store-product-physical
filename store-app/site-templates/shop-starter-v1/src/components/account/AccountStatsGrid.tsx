import { Heart, ShoppingBag, Star } from 'lucide-react';

type AccountStatsGridProps = {
  orderCount: number;
  points: number;
  favoriteCount: number;
};

export function AccountStatsGrid({ orderCount, points, favoriteCount }: AccountStatsGridProps) {
  const stats = [
    {
      label: 'امتیاز باشگاه مشتریان',
      value: points.toLocaleString('fa-IR'),
      icon: Star,
      valueClass: 'text-secondary',
      iconClass: 'text-secondary bg-secondary-container/40',
    },
    {
      label: 'مجموع سفارش‌ها',
      value: orderCount.toLocaleString('fa-IR'),
      icon: ShoppingBag,
      valueClass: 'text-on-surface',
      iconClass: 'text-primary bg-primary-container/60',
    },
    {
      label: 'کالاهای مورد علاقه',
      value: favoriteCount.toLocaleString('fa-IR'),
      icon: Heart,
      valueClass: 'text-on-surface',
      iconClass: 'text-on-surface-variant bg-surface-container',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center justify-between rounded-xl border border-outline/10 bg-surface-container-low p-6"
        >
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              {stat.label}
            </p>
            <h3 className={`font-display text-2xl md:text-[32px] md:leading-10 ${stat.valueClass}`}>
              {stat.value}
            </h3>
          </div>
          <span className={`rounded-full p-3 ${stat.iconClass}`}>
            <stat.icon className="h-6 w-6" strokeWidth={1.5} />
          </span>
        </div>
      ))}
    </div>
  );
}
