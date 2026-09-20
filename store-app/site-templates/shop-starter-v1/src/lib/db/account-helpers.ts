import type { OrderStatus as DbOrderStatus } from '@/lib/db/orders';
import type { AccountOrder, OrderStatus } from '@/lib/account';

export function mapDbOrderToAccount(order: {
  id: string;
  date: string;
  total: string;
  status: DbOrderStatus;
  rawTotal?: number;
}): AccountOrder {
  const statusMap: Record<DbOrderStatus, OrderStatus> = {
    processing: 'processing',
    shipped: 'shipping',
    delivered: 'delivered',
    cancelled: 'processing',
  };

  const total =
    order.rawTotal ?? (Number(order.total.replace(/[^\d]/g, '')) || 0);

  return {
    id: order.id,
    date: order.date,
    total,
    status: statusMap[order.status],
  };
}
