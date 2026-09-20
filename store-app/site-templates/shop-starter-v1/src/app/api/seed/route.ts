import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ensureDefaultAdmin } from '@/lib/db/admin';
import { upsertSiteContent } from '@/lib/db/site-content';
import { seedPromoCodes, seedCampaigns } from '@/lib/db/content';
import { DEFAULT_SITE_CONTENT } from '@/lib/types/site-content';
import type { ProductDocument } from '@/lib/db/products';

import { catalogProducts } from '@/../scripts/seed-data/catalog-products';
import { productDetails } from '@/../scripts/seed-data/product-details';

const FEATURED_SLUGS = new Set(['radiance-serum', 'velvet-lipstick', 'liquid-concealer', 'matte-foundation']);

function buildDetailFromCatalog(
  item: (typeof catalogProducts)[number],
): Omit<ProductDocument, 'createdAt' | 'updatedAt'> {
  const detailed = productDetails[item.slug] ?? productDetails['radiance-serum'];
  const useDetailed = item.slug === 'radiance-serum' || item.slug === 'hydrating-serum';
  const slug = useDetailed && item.slug === 'hydrating-serum' ? 'radiance-serum' : item.slug;

  return {
    slug,
    name: useDetailed && item.slug === 'hydrating-serum' ? detailed.name : item.name,
    category: item.category,
    categoryLabel: item.categoryLabel,
    categorySlug: item.category,
    price: useDetailed ? detailed.price : item.price,
    image: useDetailed ? detailed.image : item.image,
    badge: item.badge ?? null,
    skinTypes: item.skinTypes,
    brand: item.brand,
    stock: 20,
    active: true,
    featured: FEATURED_SLUGS.has(slug),
    gallery: useDetailed ? detailed.gallery : [item.image],
    rating: useDetailed ? detailed.rating : 4.5,
    reviewCount: useDetailed ? detailed.reviewCount : 12,
    shortDescription: useDetailed
      ? detailed.shortDescription
      : `${item.name} — محصول اصل MUSE با کیفیت بالا.`,
    description: useDetailed
      ? detailed.description
      : { title: item.name, body: `${item.name} از مجموعه MUSE`, benefits: [] },
    ingredients: useDetailed ? detailed.ingredients : [],
    howToUse: useDetailed ? detailed.howToUse : ['طبق دستور روی پوست تمیز استفاده کنید.'],
    highlights: useDetailed ? detailed.highlights : [{ icon: 'leaf', label: 'اصل و با کیفیت' }],
    reviews: useDetailed ? detailed.reviews : [],
    related: useDetailed ? detailed.related : [],
  };
}

export async function POST() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    return NextResponse.json({ success: false, error: 'Seed disabled in production' }, { status: 403 });
  }

  try {
    const db = await connectDB();
    await ensureDefaultAdmin();
    await upsertSiteContent(DEFAULT_SITE_CONTENT);
    await seedPromoCodes([
      { code: 'MUSE10', discount: 375_000 },
      { code: 'WELCOME', discount: 200_000 },
    ]);
    await seedCampaigns([
      { title: 'تخفیف بهاره ۱۴۰۳', status: 'فعال', reach: '۲,۴۵۰ نفر', conversion: '۴.۲٪', active: true },
      { title: 'کد خوش‌آمدگویی MUSE10', status: 'فعال', reach: '۸۹۰ نفر', conversion: '۶.۱٪', active: true },
      { title: 'ارسال رایگان آخر هفته', status: 'پایان‌یافته', reach: '۱,۱۲۰ نفر', conversion: '۳.۵٪', active: false },
    ]);

    const count = await db.products.countDocuments();
    if (count > 0) {
      return NextResponse.json({
        success: true,
        message: 'Database already seeded (site content updated)',
        count,
      });
    }

    const now = new Date();
    const seen = new Set<string>();
    const docs = catalogProducts
      .map((item) => buildDetailFromCatalog(item))
      .filter((doc) => {
        if (seen.has(doc.slug)) return false;
        seen.add(doc.slug);
        return true;
      })
      .map((doc) => ({ ...doc, createdAt: now, updatedAt: now }));

    await db.products.insertMany(docs as Record<string, unknown>[]);

    return NextResponse.json({
      success: true,
      message: `Seeded ${docs.length} products`,
      admin: process.env.ADMIN_EMAIL || 'admin@muse.local',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Seed failed' },
      { status: 500 },
    );
  }
}
