'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import type { CartItem } from '@/lib/cart';
import { formatCartPrice } from '@/lib/cart';
import { QuantitySelector } from '@/components/ui/QuantitySelector';

type CartItemRowProps = {
  item: CartItem;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
};

export function CartItemRow({ item, onQuantityChange, onRemove }: CartItemRowProps) {
  return (
    <div className="flex flex-col gap-6 border-b border-outline pb-6 md:flex-row">
      <Link
        href={`/products/${item.slug}`}
        className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-surface-container"
      >
        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="128px" />
      </Link>

      <div className="flex flex-grow flex-col justify-between py-1">
        <div>
          <div className="flex items-start justify-between gap-4">
            <Link href={`/products/${item.slug}`} className="text-lg font-semibold text-on-surface hover:text-primary">
              {item.name}
            </Link>
            <span className="shrink-0 text-lg font-semibold text-secondary">{formatCartPrice(item.price)}</span>
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">{item.variant}</p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <QuantitySelector
            value={item.quantity}
            onChange={(quantity) => onQuantityChange(item.id, quantity)}
          />
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-red-600 hover:underline"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}
