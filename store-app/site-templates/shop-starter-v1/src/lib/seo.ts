import type { Metadata } from 'next';
import type { SiteInfo } from '@/lib/types/site-content';

export function getSiteUrl(): string {
  const domain = process.env.LICENSED_DOMAIN || process.env.NEXT_PUBLIC_SITE_URL;
  if (!domain) return 'http://localhost:3000';
  if (domain.startsWith('http://') || domain.startsWith('https://')) return domain.replace(/\/$/, '');
  return `https://${domain}`;
}

export function buildCanonicalPath(path: string): string {
  const base = getSiteUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function buildDefaultMetadata(site: SiteInfo) {
  return {
    siteName: site.name,
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    locale: 'fa_IR',
    type: 'website' as const,
  };
}

const productsCategorySeo: Record<string, { title: string; description: string }> = {
  skincare: {
    title: 'مراقبت پوست',
    description: 'محصولات مراقبت پوست میوز — سرم، کرم و مراقبت روزانه با فرمولاسیون پیشرفته',
  },
  makeup: {
    title: 'آرایشی',
    description: 'محصولات آرایشی میوز — رژ لب، کرم پودر و آرایش حرفه‌ای',
  },
  hair: {
    title: 'مراقبت مو',
    description: 'محصولات مراقبت مو میوز — شامپو، ماسک و تقویت مو',
  },
  fragrance: {
    title: 'عطر و رایحه',
    description: 'عطر و رایحه‌های لوکس میوز — ماندگاری بالا و رایحه‌های خاص',
  },
  'face-makeup': {
    title: 'آرایش صورت',
    description: 'آرایش صورت میوز — کرم پودر، کانسیلر و محصولات پایه',
  },
  'eye-makeup': {
    title: 'آرایش چشم',
    description: 'آرایش چشم میوز — ریمل، سایه و خط چشم',
  },
  'lip-makeup': {
    title: 'آرایش لب',
    description: 'آرایش لب میوز — رژ لب، برق لب و مراقبت لب',
  },
};

export function buildProductsListingMetadata(site: SiteInfo, category?: string): Metadata {
  const categoryMeta = category ? productsCategorySeo[category] : null;
  const title = categoryMeta ? `${categoryMeta.title} | ${site.name}` : `محصولات ${site.name}`;
  const description = categoryMeta?.description || site.description;
  const canonicalPath = category ? `/products?cat=${category}` : '/products';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: buildCanonicalPath(canonicalPath),
      images: [{ url: '/images/hero.jpg', alt: site.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/hero.jpg'],
    },
    alternates: {
      canonical: buildCanonicalPath(canonicalPath),
    },
  };
}

export function buildOrganizationJsonLd(site: SiteInfo) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: siteUrl,
    description: site.description,
    logo: `${siteUrl}/images/hero.jpg`,
  };
}

export function buildWebSiteJsonLd(site: SiteInfo) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: siteUrl,
    description: site.description,
    inLanguage: 'fa-IR',
  };
}

export function buildItemListJsonLd(
  items: Array<{ slug: string; name: string; image: string }>,
  listName = 'محصولات'
) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}/products/${item.slug}`,
      name: item.name,
      image: `${siteUrl}${item.image}`,
    })),
  };
}

export function buildProductJsonLd(product: {
  slug: string;
  name: string;
  description: string;
  image: string;
  price: number;
  rating?: number;
  reviewCount?: number;
}) {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: `${siteUrl}${product.image}`,
    url: `${siteUrl}/products/${product.slug}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IRR',
      price: product.price,
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/products/${product.slug}`,
    },
    ...(product.rating && product.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };
}
