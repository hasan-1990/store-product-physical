import { SalesChart } from '@/components/admin/SalesChart';
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid';
import { getOrderStats, getSalesChartData } from '@/lib/db/orders';
import { sitePageMetadata } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return sitePageMetadata('تحلیل‌ها', 'تحلیل فروش فروشگاه');
}

export default async function AdminAnalyticsPage() {
  const [stats, chart] = await Promise.all([getOrderStats(), getSalesChartData()]);

  const adminStats = [
    {
      id: 'sales',
      label: 'فروش کل (ماهانه)',
      value: `${stats.monthlyRevenue.toLocaleString('fa-IR')} تومان`,
      change: '+۱۲.۵٪',
      changePositive: true,
      icon: 'payments' as const,
      iconBg: 'bg-primary-container',
    },
    {
      id: 'orders',
      label: 'سفارشات ماهانه',
      value: `${stats.monthlyOrders.toLocaleString('fa-IR')} سفارش`,
      change: '+۴.۲٪',
      changePositive: true,
      icon: 'bag' as const,
      iconBg: 'bg-secondary-container',
    },
    {
      id: 'customers',
      label: 'مشتریان',
      value: `${stats.totalCustomers.toLocaleString('fa-IR')} نفر`,
      change: '-۱.۵٪',
      changePositive: false,
      icon: 'users' as const,
      iconBg: 'bg-surface-container',
    },
    {
      id: 'conversion',
      label: 'سفارش هفتگی',
      value: `${stats.weeklyOrders.toLocaleString('fa-IR')} سفارش`,
      change: '+۲۸٪',
      changePositive: true,
      icon: 'trending' as const,
      iconBg: 'bg-red-50',
    },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-2xl text-on-surface md:text-[32px]">تحلیل‌ها</h1>
        <p className="mt-1 text-sm text-on-surface-variant">گزارش عملکرد فروش و رفتار مشتریان</p>
      </div>
      <AdminStatsGrid stats={adminStats} />
      <div className="grid grid-cols-1">
        <SalesChart data={chart} />
      </div>
    </>
  );
}
