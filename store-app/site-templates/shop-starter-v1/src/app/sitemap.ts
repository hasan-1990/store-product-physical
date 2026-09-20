import type { MetadataRoute } from 'next';
import { getAllProductSlugs } from '@/lib/db/products';
import { buildCanonicalPath, getSiteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: buildCanonicalPath('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: buildCanonicalPath('/products'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: buildCanonicalPath('/products?cat=skincare'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: buildCanonicalPath('/products?cat=makeup'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: buildCanonicalPath('/products?cat=hair'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: buildCanonicalPath('/products?cat=fragrance'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllProductSlugs();
    productRoutes = slugs.map((slug) => ({
      url: `${siteUrl}/products/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    productRoutes = [];
  }

  return [...staticRoutes, ...productRoutes];
}
