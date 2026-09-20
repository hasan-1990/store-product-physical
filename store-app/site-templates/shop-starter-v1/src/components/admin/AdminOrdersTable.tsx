import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { orderStatusLabels, orderStatusStyles, type AdminOrderStatus } from '@/lib/admin';
import { cn } from '@/lib/utils';

export type AdminOrderRow = {
  id: string;
  customer: string;
  date: string;
  total: string;
  status: AdminOrderStatus;
};

type AdminOrdersTableProps = {
  orders: AdminOrderRow[];
};

export function AdminOrdersTable({ orders }: AdminOrdersTableProps) {
  return (
    <section className="glass-card mt-10 overflow-hidden">
      <div className="flex items-center justify-between border-b border-outline p-8">
        <h2 className="text-lg font-semibold text-on-surface">آخرین سفارشات</h2>
        <Link href="/admin/orders" className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline">
          مشاهده همه
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="px-8 py-4">شناسه سفارش</th>
              <th className="px-8 py-4">مشتری</th>
              <th className="px-8 py-4">تاریخ</th>
              <th className="px-8 py-4">مبلغ کل</th>
              <th className="px-8 py-4">وضعیت</th>
              <th className="px-8 py-4">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline text-sm">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-12 text-center text-on-surface-variant">
                  هنوز سفارشی ثبت نشده است.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-surface">
                  <td className="px-8 py-4 font-mono">{order.id}</td>
                  <td className="px-8 py-4">{order.customer}</td>
                  <td className="px-8 py-4">{order.date}</td>
                  <td className="px-8 py-4">{order.total}</td>
                  <td className="px-8 py-4">
                    <span className={cn('rounded-full px-3 py-1 text-xs font-bold', orderStatusStyles[order.status])}>
                      {orderStatusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <button type="button" aria-label="عملیات" className="rounded p-1 transition hover:bg-surface-container">
                      <MoreHorizontal className="h-5 w-5" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
