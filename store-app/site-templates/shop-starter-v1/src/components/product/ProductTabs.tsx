'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import type { ProductDetail } from '@/lib/products';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'description', label: 'توضیحات' },
  { id: 'ingredients', label: 'ترکیبات' },
  { id: 'usage', label: 'نحوه استفاده' },
] as const;

type TabId = (typeof tabs)[number]['id'];

type ProductTabsProps = {
  product: ProductDetail;
};

export function ProductTabs({ product }: ProductTabsProps) {
  const [active, setActive] = useState<TabId>('description');

  return (
    <section className="mx-auto mb-16 max-w-3xl md:mb-24 lg:mb-[120px]">
      <nav className="mb-8 flex gap-8 overflow-x-auto border-b border-outline">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              'whitespace-nowrap pb-4 text-base font-semibold transition-colors',
              active === tab.id
                ? 'border-b-2 border-on-surface text-on-surface'
                : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {active === 'description' && <DescriptionTab product={product} />}
      {active === 'ingredients' && <IngredientsTab items={product.ingredients} />}
      {active === 'usage' && <UsageTab steps={product.howToUse} />}
    </section>
  );
}

function DescriptionTab({ product }: ProductTabsProps) {
  return (
    <article className="space-y-4">
      <h3 className="font-display text-2xl font-medium text-on-surface">{product.description.title}</h3>
      <p className="text-base leading-8 text-on-surface-variant">{product.description.body}</p>
      <ul className="space-y-3 pt-4">
        {product.description.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-3">
            <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-secondary" />
            <span className="text-sm text-on-surface-variant">{benefit}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function IngredientsTab({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm text-on-surface-variant">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function UsageTab({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-4 text-sm leading-7 text-on-surface-variant">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container text-xs font-bold text-on-surface">
            {index + 1}
          </span>
          {step}
        </li>
      ))}
    </ol>
  );
}
