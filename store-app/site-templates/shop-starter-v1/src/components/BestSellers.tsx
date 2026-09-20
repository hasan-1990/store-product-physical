import Link from 'next/link';
import Image from 'next/image';
import type { CatalogProduct } from '@/lib/catalog';
import { formatPrice } from '@/lib/data';
import { Badge } from '@/components/ui/Badge';

type BestSellersProps = {
  products: CatalogProduct[];
};

export function BestSellers({ products }: BestSellersProps) {
  return (
    <section className="section-gap">
      <div className="page-container">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="section-title">پرفروش‌ترین‌ها</h2>
          <Link href="/products" className="text-sm font-semibold text-primary hover:underline">
            مشاهده همه
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="product-card group text-center"
            >
              <div className="relative mb-4 aspect-square overflow-hidden rounded-card bg-surface-container-low">
                {product.badge && (
                  <Badge className="absolute left-3 top-3 z-10">{product.badge}</Badge>
                )}
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <p className="text-xs text-on-surface-variant">{product.categoryLabel}</p>
              <h3 className="mt-1 font-semibold text-on-surface">{product.name}</h3>
              <p className="mt-2 text-secondary">{formatPrice(product.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
