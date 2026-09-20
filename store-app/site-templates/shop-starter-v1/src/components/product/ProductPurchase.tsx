'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Heart } from 'lucide-react';
import type { ProductDetail } from '@/lib/products';
import { formatPrice } from '@/lib/data';
import { useCart } from '@/components/providers/CartProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RatingStars } from '@/components/ui/RatingStars';
import { QuantitySelector } from '@/components/ui/QuantitySelector';

const highlightIcons = { leaf: Leaf, heart: Heart };

type ProductPurchaseProps = {
  product: ProductDetail;
};

export function ProductPurchase({ product }: ProductPurchaseProps) {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  async function handleAddToCart() {
    setAdding(true);
    try {
      const ok = await addItem(product.id, quantity);
      if (ok) router.push('/cart');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col justify-center space-y-8">
      <ProductPurchaseHeader product={product} />
      <p className="text-base leading-7 text-on-surface-variant">{product.shortDescription}</p>
      <ProductPurchaseActions
        quantity={quantity}
        adding={adding}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
      />
      <ProductHighlights items={product.highlights} />
    </div>
  );
}

function ProductPurchaseHeader({ product }: ProductPurchaseProps) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {product.badge && <Badge>{product.badge}</Badge>}
        <div className="flex items-center gap-2">
          <RatingStars rating={product.rating} />
          <span className="text-sm text-on-surface-variant">({product.reviewCount} نظر)</span>
        </div>
      </div>
      <h1 className="section-title">{product.name}</h1>
      <p className="text-xl font-semibold text-primary">{formatPrice(product.price)}</p>
    </header>
  );
}

function ProductPurchaseActions({
  quantity,
  adding,
  onQuantityChange,
  onAddToCart,
}: {
  quantity: number;
  adding: boolean;
  onQuantityChange: (value: number) => void;
  onAddToCart: () => void;
}) {
  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-4">
        <QuantitySelector value={quantity} onChange={onQuantityChange} />
        <Button className="flex-1 py-4" onClick={onAddToCart} disabled={adding}>
          {adding ? 'در حال افزودن...' : 'افزودن به سبد خرید'}
        </Button>
      </div>
      <Button variant="outline" fullWidth className="py-4" onClick={onAddToCart} disabled={adding}>
        خرید سریع
      </Button>
    </div>
  );
}

function ProductHighlights({ items }: { items: ProductDetail['highlights'] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 pt-4">
      {items.map((item) => {
        const Icon = highlightIcons[item.icon as keyof typeof highlightIcons];
        return (
          <li key={item.label} className="flex items-center gap-3">
            {Icon && <Icon className="h-5 w-5 text-secondary" strokeWidth={1.5} />}
            <span className="text-xs font-semibold text-on-surface-variant">{item.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
