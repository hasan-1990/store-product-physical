import { Leaf, Heart, Truck } from 'lucide-react';
import type { FeatureItem } from '@/lib/types/site-content';

const iconMap = { leaf: Leaf, heart: Heart, truck: Truck };

type FeaturesProps = {
  items: FeatureItem[];
};

export function Features({ items }: FeaturesProps) {
  return (
    <section className="section-gap bg-surface-container-low">
      <div className="page-container">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {items.map((feature) => {
            const Icon = iconMap[feature.icon];
            return (
              <article key={feature.title} className="flex flex-col items-center text-center">
                <span className="mb-4 rounded-full bg-primary-container p-4">
                  <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                </span>
                <h3 className="mb-2 text-lg font-semibold text-on-surface">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-on-surface-variant">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
