import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import type { CatalogProduct } from '@/lib/catalog';
import { formatPrice } from '@/lib/data';
import { Badge } from '@/components/ui/Badge';

type ProductCardProps = {
  product: CatalogProduct;
};

function ProductCardMedia({ product }: ProductCardProps) {
  return (
    <div className="product-card-image">
      <Image
        src={product.image}
        alt={product.name}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      />
      {product.badge && <Badge variant="new">{product.badge}</Badge>}
      <span className="product-card-cart">
        <ShoppingCart className="h-5 w-5" />
      </span>
    </div>
  );
}

function ProductCardInfo({ product }: ProductCardProps) {
  return (
    <div className="space-y-1 text-center">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
        {product.categoryLabel}
      </p>
      <h3 className="text-lg font-semibold text-on-surface transition-colors group-hover:text-primary">
        {product.name}
      </h3>
      <p className="font-medium text-on-surface-variant">
        {formatPrice(product.price).replace(' تومان', '')}{' '}
        <span className="text-[10px]">تومان</span>
      </p>
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const content = (
    <>
      <ProductCardMedia product={product} />
      <ProductCardInfo product={product} />
    </>
  );

  if (product.href) {
    return (
      <Link href={product.href} className="product-card group">
        {content}
      </Link>
    );
  }

  return <article className="product-card group">{content}</article>;
}
