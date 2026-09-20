import type { Metadata } from 'next';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { CategoryGrid } from '@/components/CategoryGrid';
import { BestSellers } from '@/components/BestSellers';
import { Testimonials } from '@/components/Testimonials';
import { BlogSection } from '@/components/BlogSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteContent } from '@/lib/db/site-content';
import { listFeaturedProducts } from '@/lib/db/products';
import {
  buildCanonicalPath,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const title = `${content.site.name} | ${content.site.tagline}`;
  const description = content.site.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: buildCanonicalPath('/'),
      images: [{ url: content.hero.image, alt: content.site.name }],
    },
    alternates: { canonical: buildCanonicalPath('/') },
  };
}

export default async function HomePage() {
  const [content, featuredProducts] = await Promise.all([
    getSiteContent(),
    listFeaturedProducts(4),
  ]);

  return (
    <>
      <JsonLd
        data={[
          buildOrganizationJsonLd(content.site),
          buildWebSiteJsonLd(content.site),
        ]}
      />
      <Hero hero={content.hero} />
      <Features items={content.features} />
      <CategoryGrid categories={content.homeCategories} />
      <BestSellers products={featuredProducts} />
      <Testimonials items={content.testimonials} />
      <BlogSection articles={content.articles} />
    </>
  );
}
