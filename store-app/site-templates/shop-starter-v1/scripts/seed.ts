import { DEFAULT_SITE_CONTENT } from '../src/lib/types/site-content';
import { catalogProducts } from './seed-data/catalog-products';
import { productDetails } from './seed-data/product-details';
import { connectDB } from '../src/lib/mongodb';
import { ensureDefaultAdmin } from '../src/lib/db/admin';
import { upsertSiteContent } from '../src/lib/db/site-content';
import { seedPromoCodes, seedCampaigns } from '../src/lib/db/content';
import type { ProductDocument } from '../src/lib/db/products';
import { loadEnvFiles } from './load-env';

loadEnvFiles();

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

function printMongoHelp(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const isRefused =
    message.includes('ECONNREFUSED') || message.includes('MongoServerSelectionError');

  if (!isRefused) return;

  console.error('\n❌ MongoDB در دسترس نیست.\n');
  console.error('  npm run db:local');
  console.error('  npm run seed\n');
  console.error('  راهنما: docs/local-database.md\n');
}

async function seed() {
  try {
    await connectDB();
    await ensureDefaultAdmin();

    await upsertSiteContent(DEFAULT_SITE_CONTENT);
    console.log('✅ Site content upserted.');

    await seedPromoCodes([
      { code: 'MUSE10', discount: 375_000 },
      { code: 'WELCOME', discount: 200_000 },
    ]);
    console.log('✅ Promo codes upserted.');

    await seedCampaigns([
      { title: 'تخفیف بهاره ۱۴۰۳', status: 'فعال', reach: '۲,۴۵۰ نفر', conversion: '۴.۲٪', active: true },
      { title: 'کد خوش‌آمدگویی MUSE10', status: 'فعال', reach: '۸۹۰ نفر', conversion: '۶.۱٪', active: true },
      { title: 'ارسال رایگان آخر هفته', status: 'پایان‌یافته', reach: '۱,۱۲۰ نفر', conversion: '۳.۵٪', active: false },
    ]);
    console.log('✅ Campaigns seeded (if empty).');

    const db = await connectDB();
    const count = await db.products.countDocuments();
    if (count > 0) {
      console.log(`ℹ️  Database already has ${count} products. Skipping product seed.`);
      console.log('   Run with RESET_PRODUCTS=true to re-seed products.');
      if (process.env.RESET_PRODUCTS === 'true') {
        await db.products.deleteMany({});
        console.log('🗑️  Products cleared for re-seed.');
      } else {
        return;
      }
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
    console.log(`✅ Seeded ${docs.length} products.`);
    console.log(
      'Default admin:',
      process.env.ADMIN_EMAIL || 'admin@muse.local',
      '/',
      process.env.ADMIN_PASSWORD || 'Admin@123',
    );
  } catch (error) {
    printMongoHelp(error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
