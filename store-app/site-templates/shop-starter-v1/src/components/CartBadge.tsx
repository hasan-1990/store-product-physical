'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/providers/CartProvider';

export function CartBadge() {
  const { itemCount } = useCart();

  return (
    <Link href="/cart" aria-label="سبد خرید" className="relative text-on-surface transition hover:text-primary">
      <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white">
          {itemCount.toLocaleString('fa-IR')}
        </span>
      )}
    </Link>
  );
}
