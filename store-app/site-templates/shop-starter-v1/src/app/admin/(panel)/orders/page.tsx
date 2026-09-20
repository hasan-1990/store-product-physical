import { AdminOrdersTable } from '@/components/admin/AdminOrdersTable';
import { listOrders } from '@/lib/db/orders';
import { sitePageMetadata } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return sitePageMetadata('سفارشات', 'مدیریت سفارشات فروشگاه');
}

export default async function AdminOrdersPage() {
  const orders = await listOrders(50);

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-2xl text-on-surface md:text-[32px]">سفارشات</h1>
        <p className="mt-1 text-sm text-on-surface-variant">مدیریت و پیگیری سفارش‌های فروشگاه</p>
      </div>
      <AdminOrdersTable orders={orders} />
    </>
  );
}
