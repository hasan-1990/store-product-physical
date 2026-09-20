export type AdminOrderStatus = 'processing' | 'shipped' | 'cancelled' | 'delivered';

export type AdminNavItem = {
  id: string;
  label: string;
  href: string;
  icon: 'dashboard' | 'analytics' | 'products' | 'orders' | 'customers' | 'marketing';
};

export const adminNavItems: AdminNavItem[] = [
  { id: 'dashboard', label: 'پیشخوان', href: '/admin', icon: 'dashboard' },
  { id: 'analytics', label: 'تحلیل‌ها', href: '/admin/analytics', icon: 'analytics' },
  { id: 'products', label: 'محصولات', href: '/admin/products', icon: 'products' },
  { id: 'orders', label: 'سفارشات', href: '/admin/orders', icon: 'orders' },
  { id: 'customers', label: 'مشتریان', href: '/admin/customers', icon: 'customers' },
  { id: 'marketing', label: 'بازاریابی', href: '/admin/marketing', icon: 'marketing' },
];

export const orderStatusLabels: Record<AdminOrderStatus, string> = {
  processing: 'در حال پردازش',
  shipped: 'ارسال شده',
  cancelled: 'لغو شده',
  delivered: 'تحویل شده',
};

export const orderStatusStyles: Record<AdminOrderStatus, string> = {
  processing: 'bg-secondary-container/30 text-secondary',
  shipped: 'bg-primary-container/40 text-primary',
  cancelled: 'bg-red-50 text-red-600',
  delivered: 'bg-surface-container text-on-surface',
};
