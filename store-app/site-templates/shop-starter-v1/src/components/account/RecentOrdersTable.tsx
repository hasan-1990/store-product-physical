import Link from 'next/link';
import { Eye } from 'lucide-react';
import type { AccountOrder } from '@/lib/account';
import { orderStatusLabels } from '@/lib/account';
import { formatPrice } from '@/lib/data';

type RecentOrdersTableProps = {
  orders: AccountOrder[];
};

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-outline/20 bg-white">
      <div className="flex items-center justify-between border-b border-outline/10 px-6 py-5">
        <h3 className="text-lg font-semibold text-on-surface">سفارش‌های اخیر</h3>
        <Link href="/account/orders" className="text-xs font-semibold uppercase tracking-wider text-secondary hover:underline">
          مشاهده همه
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                شماره سفارش
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                تاریخ
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                مبلغ کل
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                وضعیت
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                  هنوز سفارشی ثبت نکرده‌اید.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-surface">
                  <td className="px-6 py-4 text-sm text-on-surface">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{order.date}</td>
                  <td className="px-6 py-4 text-sm text-on-surface">{formatPrice(order.total)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        order.status === 'shipping'
                          ? 'rounded-full bg-secondary-container px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-secondary'
                          : 'rounded-full bg-surface-container px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant'
                      }
                    >
                      {orderStatusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <button
                      type="button"
                      aria-label={`مشاهده سفارش ${order.id}`}
                      className="text-primary transition-colors hover:text-secondary"
                    >
                      <Eye className="h-5 w-5" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
