import type { Db } from 'mongodb';

export async function getDynamicContent(db: Db, category?: string): Promise<Record<string, string>> {
  const query: Record<string, unknown> = { isActive: true };
  if (category) query.category = category;

  const contents = await db.collection('dynamicContent').find(query).toArray();
  const contentMap: Record<string, string> = {};

  for (const item of contents) {
    const row = item as { key: string; value: unknown };
    const cleanValue =
      typeof row.value === 'string' ? row.value.replace(/[\x00-\x1F\x7F]/g, '') : String(row.value ?? '');
    contentMap[row.key] = cleanValue;
  }

  return contentMap;
}

export async function getPublicSettings(db: Db) {
  const dynamicContent = await getDynamicContent(db);
  const seoSettings = (await db.collection('seoglobalsettings').findOne({})) as Record<string, unknown> | null;

  const aboutPage = (seoSettings?.aboutPage as Record<string, string>) || {};
  const contact = (seoSettings?.contact as Record<string, string>) || {};
  const socialMedia = (seoSettings?.socialMedia as Record<string, string>) || {};

  const defaultSettings: Record<string, unknown> = {
    site_name:
      dynamicContent.site_name ||
      dynamicContent.logo_text ||
      seoSettings?.siteName ||
      seoSettings?.siteTitle ||
      'فروشگاه',
    site_description:
      dynamicContent.site_description || seoSettings?.siteDescription || 'مقصد نهایی تجارت الکترونیک شما',
    seo_description:
      dynamicContent.seo_description ||
      seoSettings?.siteDescription ||
      'محصولات با کیفیت را با قیمت‌های شکست‌ناپذیر کشف کنید',
    seo_keywords:
      dynamicContent.seo_keywords || seoSettings?.seoKeywords || 'تجارت الکترونیک, خرید آنلاین',
    contact_email: contact.email || 'info@shop.com',
    contact_phone: contact.phone || '021-12345678',
    contact_address: contact.address || 'تهران، خیابان آزادی',
    facebook_url: socialMedia.facebook || '',
    instagram_url: socialMedia.instagram || '',
    twitter_url: socialMedia.twitter || '',
    telegram_url: socialMedia.telegram || '',
    hero_title: aboutPage.heroTitle || 'درباره ما',
    hero_subtitle: aboutPage.heroSubtitle || 'مقصد نهایی تجارت الکترونیک شما',
  };

  const settings = await db.collection('settings').find({}).toArray();
  const settingsObj = settings.reduce(
    (acc, setting) => {
      const row = setting as { key: string; value: string; type?: string };
      let value: unknown = row.value;
      if (row.type === 'boolean') value = row.value === 'true';
      else if (row.type === 'number') value = parseFloat(row.value);
      else if (row.type === 'json') {
        try {
          value = JSON.parse(row.value);
        } catch {
          value = row.value;
        }
      }
      acc[row.key] = value;
      return acc;
    },
    {} as Record<string, unknown>,
  );

  return {
    ...defaultSettings,
    ...settingsObj,
    site_name: settingsObj.site_name || seoSettings?.siteName || defaultSettings.site_name,
    site_description:
      settingsObj.site_description || seoSettings?.siteDescription || defaultSettings.site_description,
    taxRate: settingsObj.taxRate ?? 9,
    shippingCost: settingsObj.shippingCost ?? 50000,
    freeShippingThreshold: settingsObj.freeShippingThreshold ?? 1_000_000,
  };
}
