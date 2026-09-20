import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import type { ProductDetail } from '@/lib/products';
import { formatPrice } from '@/lib/data';

type RelatedProductsProps = {
  items: ProductDetail['related'];
};

export function RelatedProducts({ items }: RelatedProductsProps) {
  return (
    <section className="section-gap">
      <h2 className="section-title mb-8">محصولات مرتبط</h2>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
        {items.map((item) => (
          <RelatedProductCard key={item.slug} item={item} />
        ))}
      </div>
    </section>
  );
}

function RelatedProductCard({ item }: { item: ProductDetail['related'][number] }) {
  return (
    <Link href={`/products/${item.slug}`} className="product-card group text-center">
      <div className="product-card-image aspect-[4/5]">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <span className="product-card-cart">
          <ShoppingCart className="h-5 w-5" />
        </span>
      </div>
      <h3 className="text-base font-semibold text-on-surface">{item.name}</h3>
      <p className="mt-1 text-sm text-on-surface-variant">{formatPrice(item.price)}</p>
    </Link>
  );
}
