import { listCustomers } from '@/lib/db/content';
import { sitePageMetadata } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return sitePageMetadata('مشتریان', 'مدیریت مشتریان فروشگاه');
}

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-2xl text-on-surface md:text-[32px]">مشتریان</h1>
        <p className="mt-1 text-sm text-on-surface-variant">لیست مشتریان و تاریخچه خرید</p>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="px-6 py-4">نام</th>
              <th className="px-6 py-4">ایمیل</th>
              <th className="px-6 py-4">تعداد سفارش</th>
              <th className="px-6 py-4">مجموع خرید</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline text-sm">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-on-surface-variant">
                  هنوز مشتری ثبت‌شده‌ای وجود ندارد.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.email} className="hover:bg-surface">
                  <td className="px-6 py-4 font-medium">{customer.name}</td>
                  <td className="px-6 py-4 text-on-surface-variant" dir="ltr">
                    {customer.email}
                  </td>
                  <td className="px-6 py-4">{customer.orders.toLocaleString('fa-IR')}</td>
                  <td className="px-6 py-4">{customer.spent}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
