import { CartPageView } from '@/components/cart/CartPageView';
import { sitePageMetadata } from '@/lib/metadata';

export async function generateMetadata() {
  return sitePageMetadata('سبد خرید', 'سبد خرید و تسویه حساب');
}

export default function CartPage() {
  return <CartPageView />;
}
