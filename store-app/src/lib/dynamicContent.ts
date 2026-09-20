import { connectDB } from '@/lib/mongodb';

/**
 * دریافت محتوای داینامیک از دیتابیس
 * این تابع در سمت سرور استفاده می‌شود
 * Cache: no-store برای اطمینان از دریافت داده‌های جدید
 */
export async function getDynamicContent(category?: string): Promise<Record<string, string>> {
  try {
    const db = await connectDB();
    
    const query: any = { isActive: true };
    if (category) query.category = category;
    
    const contents = await db.dynamicContent.find(query).toArray();
    
    // تبدیل به فرمت key-value و پاک کردن کاراکترهای کنترلی
    const contentMap: Record<string, string> = {};
    contents.forEach((item: any) => {
      // پاک کردن کاراکترهای کنترلی (null, tab, newline, etc) که در JSON مشکل ایجاد می‌کنند
      const cleanValue = typeof item.value === 'string' 
        ? item.value.replace(/[\x00-\x1F\x7F]/g, '')
        : item.value;
      contentMap[item.key] = cleanValue;
    });
    
    return contentMap;
  } catch (error) {
    console.error('خطا در دریافت محتوای داینامیک:', error);
    return {};
  }
}

/**
 * دریافت یک محتوای خاص
 */
export async function getContentByKey(key: string, defaultValue: string = ''): Promise<string> {
  try {
    const db = await connectDB();
    
    const content = await db.dynamicContent.findOne({ key, isActive: true });
    
    // پاک کردن کاراکترهای کنترلی
    const cleanValue = content?.value 
      ? (typeof content.value === 'string' ? content.value.replace(/[\x00-\x1F\x7F]/g, '') : content.value)
      : defaultValue;
    
    return cleanValue;
  } catch (error) {
    console.error(`خطا در دریافت محتوا ${key}:`, error);
    return defaultValue;
  }
}

/**
 * دریافت محتوای داینامیک بر اساس دسته‌بندی
 */
export async function getContentsByCategory(category: string): Promise<Record<string, string>> {
  return getDynamicContent(category);
}

/**
 * تبدیل محتوای داینامیک به تنظیمات سایت
 */
export async function getSiteSettings() {
  const content = await getDynamicContent();
  
  // ساخت شی تنظیمات از محتوای داینامیک
  return {
    site_name: content.site_name || content.seo_site_name || 'فروشگاه آنلاین',
    site_description: content.site_description || content.seo_site_description || 'بهترین محصولات با قیمت مناسب',
    site_title: content.site_title || content.seo_site_name || 'فروشگاه آنلاین',
    site_subtitle: content.site_subtitle || '',
    hero_title: content.hero_title || '',
    logo_text: content.logo_text || content.site_name || '',
    seo_description: content.seo_description || content.seo_site_description || content.site_description || 'خرید آنلاین محصولات با کیفیت',
    seo_keywords: content.seo_keywords || '',
    seo_title: content.seo_title || content.seo_site_name || content.site_title || '',
    og_title: content.og_title || content.seo_site_name || content.site_title || '',
    og_description: content.og_description || content.seo_site_description || content.seo_description || '',
    footer_about: content.footer_about || '',
    footer_copyright: content.footer_copyright || '',
    contact_email: content.contact_email || '',
    contact_phone: content.contact_phone || '',
    contact_address: content.contact_address || '',
  };
}

/**
 * بروزرسانی یک محتوای داینامیک
 */
export async function updateDynamicContent(key: string, value: string): Promise<boolean> {
  try {
    const db = await connectDB();
    
    const result = await db.dynamicContent.updateOne(
      { key },
      {
        $set: {
          value,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );
    
    return result.acknowledged;
  } catch (error) {
    console.error(`خطا در بروزرسانی محتوا ${key}:`, error);
    return false;
  }
}
