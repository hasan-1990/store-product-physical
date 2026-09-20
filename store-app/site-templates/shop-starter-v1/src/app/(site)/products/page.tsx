import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ProductsPageView } from '@/components/products/ProductsPageView';
import { JsonLd } from '@/components/seo/JsonLd';
import { listProducts } from '@/lib/db/products';
import { getSiteContent } from '@/lib/db/site-content';
import { buildItemListJsonLd, buildProductsListingMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ cat?: string }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { cat } = await searchParams;
  const content = await getSiteContent();
  return buildProductsListingMetadata(content.site, cat);
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { cat } = await searchParams;
  const listName = cat ? `محصولات ${cat}` : 'همه محصولات';
  const [products, content] = await Promise.all([listProducts(), getSiteContent()]);

  return (
    <div className="catalog-container py-12 pt-28 md:pt-32">
      <JsonLd
        data={buildItemListJsonLd(
          products.map((p) => ({ slug: p.slug, name: p.name, image: p.image })),
          listName,
        )}
      />
      <Suspense fallback={<div className="py-20 text-center text-on-surface-variant">در حال بارگذاری...</div>}>
        <ProductsPageView
          initialCategory={cat}
          initialProducts={products}
          promoCard={content.promoCard}
          filterConfig={content.productFilters}
        />
      </Suspense>
    </div>
  );
}
