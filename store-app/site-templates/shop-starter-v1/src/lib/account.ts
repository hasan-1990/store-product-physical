export type OrderStatus = 'shipping' | 'delivered' | 'processing';

export type AccountOrder = {
  id: string;
  date: string;
  total: number;
  status: OrderStatus;
};

export type AccountNavItem = {
  id: string;
  label: string;
  href: string;
  icon: 'dashboard' | 'orders' | 'addresses' | 'favorites' | 'settings';
};

export const accountNavItems: AccountNavItem[] = [
  { id: 'dashboard', label: 'پیشخوان', href: '/account', icon: 'dashboard' },
  { id: 'orders', label: 'سفارش‌های من', href: '/account/orders', icon: 'orders' },
  { id: 'addresses', label: 'آدرس‌ها', href: '/account/addresses', icon: 'addresses' },
  { id: 'favorites', label: 'علاقه‌مندی‌ها', href: '/account/favorites', icon: 'favorites' },
  { id: 'settings', label: 'تنظیمات حساب', href: '/account/settings', icon: 'settings' },
];

export const orderStatusLabels: Record<OrderStatus, string> = {
  shipping: 'در حال ارسال',
  delivered: 'تحویل شده',
  processing: 'در حال پردازش',
};
