import Image from 'next/image';
import Link from 'next/link';
import type { HeroContent } from '@/lib/types/site-content';

type HeroProps = {
  hero: HeroContent;
};

export function Hero({ hero }: HeroProps) {
  return (
    <section className="section-gap">
      <div className="page-container">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 flex flex-col items-start text-right lg:order-1">
            <span className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              {hero.eyebrow}
            </span>
            <h1 className="font-display text-4xl font-semibold leading-tight text-on-surface md:text-5xl lg:text-[48px] lg:leading-[56px]">
              {hero.title}
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-on-surface-variant">{hero.description}</p>
            <Link href={hero.ctaHref} className="btn-primary mt-8">
              {hero.ctaLabel}
            </Link>
          </div>

          <div className="relative order-1 aspect-[4/5] overflow-hidden rounded-card bg-surface-container-low shadow-soft lg:order-2 lg:aspect-auto lg:min-h-[560px]">
            <Image
              src={hero.image}
              alt={hero.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
