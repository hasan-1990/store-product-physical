import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { AdminOrdersTable } from '@/components/admin/AdminOrdersTable';
import { SalesChart } from '@/components/admin/SalesChart';
import { StockAlerts } from '@/components/admin/StockAlerts';
import { getAdminFromCookies } from '@/lib/auth';
import { getOrderStats, getSalesChartData, listOrders } from '@/lib/db/orders';
import { getLowStockProducts } from '@/lib/db/products';
import { sitePageMetadata } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return sitePageMetadata('پنل مدیریت', 'پنل مدیریت فروشگاه');
}

export default async function AdminDashboardPage() {
  const [stats, chart, orders, lowStock, admin] = await Promise.all([
    getOrderStats(),
    getSalesChartData(),
    listOrders(5),
    getLowStockProducts(),
    getAdminFromCookies(),
  ]);

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
      label: 'سفارشات جدید',
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

  const stockAlerts = lowStock.map((item) => ({
    id: item.id,
    name: item.name,
    status: item.stock <= 3 ? `فقط ${item.stock} عدد باقی مانده` : `موجودی: ${item.stock}`,
    level: item.stock <= 3 ? ('critical' as const) : ('warning' as const),
    image: item.image,
  }));

  const adminName = admin?.email?.split('@')[0] || 'مدیر';

  return (
    <>
      <AdminTopBar adminName={adminName} />
      <AdminStatsGrid stats={adminStats} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <SalesChart data={chart} />
        <StockAlerts items={stockAlerts} />
      </div>
      <AdminOrdersTable orders={orders} />
    </>
  );
}
