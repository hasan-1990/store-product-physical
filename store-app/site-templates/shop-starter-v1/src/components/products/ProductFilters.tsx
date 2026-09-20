'use client';

import { Grid3x3, Tag, User, BadgeCheck } from 'lucide-react';
import type { CatalogCategory, SkinType } from '@/lib/catalog';
import type { ProductFilterConfig } from '@/lib/types/site-content';
import { Button } from '@/components/ui/Button';
import { FilterSection } from '@/components/products/FilterSection';
import { cn } from '@/lib/utils';

export type ProductFiltersState = {
  categories: CatalogCategory[];
  maxPrice: number;
  skinType: SkinType;
  brand: string;
};

type ProductFiltersProps = {
  filters: ProductFiltersState;
  onChange: (filters: ProductFiltersState) => void;
  filterConfig: ProductFilterConfig;
};

export function ProductFilters({ filters, onChange, filterConfig }: ProductFiltersProps) {
  function update(partial: Partial<ProductFiltersState>) {
    onChange({ ...filters, ...partial });
  }

  function toggleCategory(id: CatalogCategory) {
    const categories = filters.categories.includes(id)
      ? filters.categories.filter((c) => c !== id)
      : [...filters.categories, id];
    update({ categories });
  }

  return (
    <div className="card-surface p-6">
      <h3 className="mb-6 border-b border-outline pb-2 text-base font-semibold text-on-surface">فیلترها</h3>

      <FilterSection icon={Grid3x3} title="دسته بندی">
        <div className="space-y-3">
          {filterConfig.categories.map((cat) => (
            <label key={cat.id} className="group flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat.id)}
                onChange={() => toggleCategory(cat.id)}
                className="h-4 w-4 rounded border-outline text-primary focus:ring-primary"
              />
              <span className="text-on-surface-variant transition-colors group-hover:text-on-surface">
                {cat.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={Tag} title="محدوده قیمت">
        <input
          type="range"
          min={0}
          max={2_000_000}
          step={50_000}
          value={filters.maxPrice}
          onChange={(e) => update({ maxPrice: Number(e.target.value) })}
          className="mb-2 h-1.5 w-full cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs font-medium text-on-surface-variant">
          <span>۰</span>
          <span>{filters.maxPrice.toLocaleString('fa-IR')} تومان</span>
        </div>
      </FilterSection>

      <FilterSection icon={User} title="نوع پوست">
        <div className="flex flex-wrap gap-2">
          {filterConfig.skinTypes.map((skin) => (
            <button
              key={skin.id}
              type="button"
              onClick={() => update({ skinType: skin.id })}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                filters.skinType === skin.id
                  ? 'border-primary bg-primary text-white'
                  : 'border-outline text-on-surface-variant hover:border-primary hover:text-primary',
              )}
            >
              {skin.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={BadgeCheck} title="برند">
        <select
          value={filters.brand}
          onChange={(e) => update({ brand: e.target.value })}
          className="w-full rounded-lg border-none bg-surface-container p-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary"
        >
          {filterConfig.brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </FilterSection>

      <Button fullWidth className="py-3 text-sm shadow-md">
        اعمال فیلترها
      </Button>
    </div>
  );
}
