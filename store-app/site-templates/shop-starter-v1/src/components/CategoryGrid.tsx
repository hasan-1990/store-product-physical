import Image from 'next/image';
import Link from 'next/link';
import type { HomeCategory } from '@/lib/types/site-content';

type CategoryGridProps = {
  categories: HomeCategory[];
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className="section-gap">
      <div className="page-container">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?cat=${cat.slug}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-card bg-surface-container-low shadow-soft"
            >
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <h3 className="absolute bottom-4 right-4 text-lg font-semibold text-white">{cat.title}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
