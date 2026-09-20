import { connectDB } from '@/lib/mongodb';
import {
  DEFAULT_SITE_CONTENT,
  type SiteContentDocument,
} from '@/lib/types/site-content';

export async function getSiteContent(): Promise<SiteContentDocument> {
  const db = await connectDB();
  const doc = await db.siteContent.findOne({ key: 'main' });

  if (!doc) {
    return { ...DEFAULT_SITE_CONTENT, updatedAt: new Date() };
  }

  const content = doc as unknown as SiteContentDocument;
  return {
    ...DEFAULT_SITE_CONTENT,
    ...content,
    site: { ...DEFAULT_SITE_CONTENT.site, ...content.site },
    productFilters: {
      ...DEFAULT_SITE_CONTENT.productFilters,
      ...content.productFilters,
    },
    updatedAt: content.updatedAt ?? new Date(),
  };
}

export async function upsertSiteContent(
  data: Omit<SiteContentDocument, 'updatedAt'>,
): Promise<void> {
  const db = await connectDB();
  await db.siteContent.updateOne(
    { key: 'main' },
    { $set: { ...data, key: 'main', updatedAt: new Date() } },
    { upsert: true },
  );
}
