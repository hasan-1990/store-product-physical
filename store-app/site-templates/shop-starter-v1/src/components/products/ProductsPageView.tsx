'use client';

import { useMemo, useState } from 'react';
import type { CatalogCategory, CatalogProduct, SkinType } from '@/lib/catalog';
import type { PromoCardContent, ProductFilterConfig } from '@/lib/types/site-content';
import { ProductFilters, type ProductFiltersState } from '@/components/products/ProductFilters';
import { ProductCard } from '@/components/products/ProductCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { SortTabs } from '@/components/ui/SortTabs';
import { Pagination } from '@/components/ui/Pagination';
import { PromoCard } from '@/components/ui/PromoCard';

type SortOption = 'popular' | 'newest' | 'cheapest';

const sortOptions = [
  { id: 'popular' as const, label: 'محبوب‌ترین' },
  { id: 'newest' as const, label: 'جدیدترین' },
  { id: 'cheapest' as const, label: 'ارزان‌ترین' },
];

const categoryFilterMap: Record<string, CatalogCategory> = {
  makeup: 'face-makeup',
  skincare: 'skincare',
  hair: 'face-makeup',
  fragrance: 'face-makeup',
};

function sortProducts(items: CatalogProduct[], sort: SortOption) {
  const copy = [...items];
  if (sort === 'cheapest') return copy.sort((a, b) => a.price - b.price);
  if (sort === 'newest') return copy.sort((a, b) => Number(b.id) - Number(a.id));
  return copy;
}

function filterProducts(items: CatalogProduct[], filters: ProductFiltersState) {
  let result = items.filter((p) => p.price <= filters.maxPrice);

  if (filters.categories.length > 0) {
    result = result.filter((p) => filters.categories.includes(p.category));
  }

  if (filters.brand !== 'همه برندها') {
    result = result.filter((p) => p.brand === filters.brand);
  }

  return result.filter((p) => p.skinTypes.includes(filters.skinType));
}

type ProductsPageViewProps = {
  initialCategory?: string;
  initialProducts: CatalogProduct[];
  promoCard: PromoCardContent;
  filterConfig: ProductFilterConfig;
};

export function ProductsPageView({
  initialCategory,
  initialProducts,
  promoCard,
  filterConfig,
}: ProductsPageViewProps) {
  const mappedCategory = initialCategory ? categoryFilterMap[initialCategory] : null;

  const [filters, setFilters] = useState<ProductFiltersState>({
    categories: mappedCategory ? [mappedCategory] : [],
    maxPrice: 10_000_000,
    skinType: 'dry' as SkinType,
    brand: 'همه برندها',
  });
  const [sort, setSort] = useState<SortOption>('popular');
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => sortProducts(filterProducts(initialProducts, filters), sort),
    [initialProducts, filters, sort],
  );

  const perPage = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const products = filtered.slice((page - 1) * perPage, page * perPage);

  function handleFiltersChange(next: ProductFiltersState) {
    setPage(1);
    setFilters(next);
  }

  return (
    <div className="flex flex-col gap-10 lg:flex-row">
      <aside className="w-full shrink-0 space-y-8 lg:w-72">
        <ProductFilters filters={filters} onChange={handleFiltersChange} filterConfig={filterConfig} />
        <PromoCard {...promoCard} />
      </aside>

      <section className="flex-1">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <PageHeader title="محصولات MUSE" description="تجربه زیبایی با الهام از طبیعت و علم مدرن." />
          <SortTabs options={sortOptions} value={sort} onChange={setSort} />
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="py-20 text-center text-on-surface-variant">محصولی با این فیلترها یافت نشد.</p>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </section>
    </div>
  );
}
