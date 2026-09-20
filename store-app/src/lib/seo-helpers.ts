import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { analyzePageSEOAdvanced } from './advanced-seo-analyzer';
import { CacheManager, CACHE_KEYS } from '@/lib/cache-manager';
import {
  deleteFallbackPageByUrl,
  getFallbackPageByUrl,
  saveFallbackPage,
  type FallbackSEOPage,
} from '@/lib/seo-fallback-storage';

// TypeScript interfaces
export interface IGlobalSEOSettings {
  _id?: string;
  siteTitle: string;
  siteDescription: string;
  siteUrl: string;
  siteName: string;
  language: string;
  direction: 'rtl' | 'ltr';
  allowCrawling: boolean;
  googleSiteVerification?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  robotsRules?: string[];
  
  // شبکه‌های اجتماعی
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    telegram?: string;
  };
  
  // اطلاعات تماس
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  
  // محتوای صفحه درباره ما
  aboutPage?: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroBadgeText?: string;
    storyTitle?: string;
    storySubtitle?: string;
    storyParagraph1?: string;
    storyParagraph2?: string;
    storyParagraph3?: string;
    missionTitle?: string;
    missionDescription?: string;
    valuesTitle?: string;
    valuesSubtitle?: string;
    value1Title?: string;
    value1Description?: string;
    value2Title?: string;
    value2Description?: string;
    value3Title?: string;
    value3Description?: string;
    contactTitle?: string;
    contactSubtitle?: string;
    socialTitle?: string;
    socialSubtitle?: string;
  };
  
  // SEO اضافی
  seoKeywords?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISEOPage {
  _id?: ObjectId | string;
  url: string;
  title: string;
  description: string;
  keywords?: string;
  h1Title?: string;
  h2Title?: string;
  content?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robotsContent?: string;
  structuredData?: any;
  customMeta?: any;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * دریافت تنظیمات عمومی SEO
 */
export async function getGlobalSEOSettings(): Promise<IGlobalSEOSettings | null> {
  try {
    const db = await connectDB();
    
    // دریافت تنظیمات از collection اختصاصی SEO
    const settings = await db.seoglobalsettings.findOne({});
    
    if (settings) {
      return settings as unknown as IGlobalSEOSettings;
    }
    
    // اگر تنظیمات وجود نداشت، null برمیگردونیم
    // API route خودش مقادیر پیش‌فرض رو می‌سازه
    return null;
  } catch (error) {
    console.error('خطا در دریافت تنظیمات عمومی SEO:', error);
    return null;
  }
}

/**
 * بروزرسانی تنظیمات عمومی SEO
 */
export async function updateGlobalSEOSettings(settings: Partial<IGlobalSEOSettings>): Promise<IGlobalSEOSettings | null> {
  try {
    const db = await connectDB();
    
    // حذف فیلدهای که نباید update بشن
    const { _id, createdAt, ...updateData } = settings as any;
    
    // بروزرسانی یا ایجاد تنظیمات در collection اختصاصی SEO
    const result = await db.seoglobalsettings.findOneAndUpdate(
      {}, // فقط یک document برای تنظیمات کلی داریم
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { 
        upsert: true,
        returnDocument: 'after'
      }
    );
    
    // پاک کردن کش Redis بعد از بروزرسانی تنظیمات عمومی SEO
    await Promise.all([
      CacheManager.invalidatePattern(`${CACHE_KEYS.SETTINGS}*`),
      CacheManager.invalidatePattern('seo:*'),
      CacheManager.invalidatePattern('page:*')
    ]).catch(err => console.warn('⚠️ خطا در پاک کردن کش:', err));
    
    return result as unknown as IGlobalSEOSettings;
  } catch (error) {
    console.error('خطا در بروزرسانی تنظیمات عمومی SEO:', error);
    return null;
  }
}

function fallbackToSEOPage(page: FallbackSEOPage): ISEOPage {
  return {
    _id: page._id,
    url: page.url,
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    h1Title: page.h1Title,
    h2Title: page.h2Title,
    content: page.content,
    ogTitle: page.ogTitle,
    ogDescription: page.ogDescription,
    ogImage: page.ogImage,
    twitterTitle: page.twitterTitle,
    twitterDescription: page.twitterDescription,
    twitterImage: page.twitterImage,
    canonicalUrl: page.canonicalUrl,
    robotsContent: page.robotsContent,
    structuredData: page.structuredData,
    customMeta: page.customMeta,
    isActive: page.isActive,
    createdAt: new Date(page.createdAt),
    updatedAt: new Date(page.updatedAt),
  };
}

function seoPageToFallbackInput(page: ISEOPage): Omit<FallbackSEOPage, 'createdAt' | 'updatedAt'> {
  return {
    _id: page._id?.toString() || '',
    url: page.url,
    title: page.title,
    description: page.description,
    keywords: page.keywords || '',
    h1Title: page.h1Title || '',
    h2Title: page.h2Title || '',
    content: page.content || '',
    ogTitle: page.ogTitle || '',
    ogDescription: page.ogDescription || '',
    ogImage: page.ogImage || '',
    twitterTitle: page.twitterTitle || '',
    twitterDescription: page.twitterDescription || '',
    twitterImage: page.twitterImage || '',
    canonicalUrl: page.canonicalUrl || '',
    robotsContent: page.robotsContent || 'index, follow',
    structuredData: page.structuredData || null,
    customMeta: page.customMeta || {},
    isActive: page.isActive,
  };
}

async function syncSEOPageToFallback(page: ISEOPage | null): Promise<void> {
  if (!page) return;
  try {
    await saveFallbackPage(seoPageToFallbackInput(page));
  } catch (error) {
    console.warn('⚠️ خطا در همگام‌سازی SEO با fallback:', page.url, error);
  }
}

/**
 * دریافت SEO data برای URL مشخص (MongoDB + JSON fallback)
 */
export async function getSEODataByUrl(url: string): Promise<ISEOPage | null> {
  try {
    const db = await connectDB();
    const seoData = await db.seopages.findOne({ url, isActive: true });
    if (seoData) return seoData as ISEOPage;
  } catch (error) {
    console.error('خطا در دریافت SEO از MongoDB برای URL:', url, error);
  }

  try {
    const fallback = await getFallbackPageByUrl(url);
    if (fallback) {
      console.log('📁 SEO از fallback برای:', url);
      return fallbackToSEOPage(fallback);
    }
  } catch (error) {
    console.error('خطا در دریافت SEO از fallback برای URL:', url, error);
  }

  return null;
}

/**
 * دریافت تمام صفحات SEO
 */
export async function getAllSEOPages(includeInactive = false): Promise<ISEOPage[]> {
  try {
    const db = await connectDB();
    
    const filter = includeInactive ? {} : { isActive: true };
    const pages = await db.seopages
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
    
    return pages as ISEOPage[];
  } catch (error) {
    console.error('خطا در دریافت صفحات SEO:', error);
    return [];
  }
}

/**
 * دریافت تمام URL های سایت
 */
export async function getAllSitePages(): Promise<string[]> {
  return [
    '/',
    '/about/',
    '/contact/',
    '/products/',
    '/blog/',
    '/cart/',
    '/checkout/',
    '/login/'
  ];
}

/**
 * جستجوی صفحات SEO
 */
export async function searchSEOPages(query: string): Promise<ISEOPage[]> {
  try {
    const db = await connectDB();
    
    const searchFilter = {
      $or: [
        { url: { $regex: query, $options: 'i' } },
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { keywords: { $regex: query, $options: 'i' } }
      ]
    };
    
    const pages = await db.seopages
      .find(searchFilter)
      .sort({ createdAt: -1 })
      .toArray();
    
    return pages as ISEOPage[];
  } catch (error) {
    console.error('خطا در جستجوی صفحات SEO:', error);
    return [];
  }
}

/**
 * دریافت آمار SEO
 */
export async function getSEOStats() {
  try {
    const db = await connectDB();
    
    const total = await db.seopages.countDocuments();
    const active = await db.seopages.countDocuments({ isActive: true });
    const inactive = await db.seopages.countDocuments({ isActive: false });
    
    return {
      total,
      active,
      inactive
    };
  } catch (error) {
    console.error('خطا در دریافت آمار SEO:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0
    };
  }
}

/**
 * ایجاد یا بروزرسانی SEO page
 */
export async function upsertSEOPage(url: string, seoData: Partial<ISEOPage>): Promise<ISEOPage | null> {
  try {
    const db = await connectDB();
    
    const existingPage = await db.seopages.findOne({ url });
    
    if (existingPage) {
      // بروزرسانی صفحه موجود
      const updateData = {
        ...seoData,
        updatedAt: new Date()
      };
      
      const result = await db.seopages.findOneAndUpdate(
        { url },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      
      // پاک کردن کش Redis بعد از بروزرسانی SEO
      await Promise.all([
        CacheManager.invalidatePattern(`${CACHE_KEYS.SETTINGS}*`),
        CacheManager.invalidatePattern('seo:*'),
        CacheManager.invalidatePattern('page:*')
      ]).catch(err => console.warn('⚠️ خطا در پاک کردن کش:', err));
      
      console.log('✅ صفحه SEO بروزرسانی شد:', result?.value?.url);
      const saved = result?.value as unknown as ISEOPage;
      await syncSEOPageToFallback(saved);
      return saved;
    } else {
      // ایجاد صفحه جدید
      const newPageData = {
        url,
        title: seoData.title || '',
        description: seoData.description || '',
        keywords: seoData.keywords || '',
        h1Title: seoData.h1Title || '',
        h2Title: seoData.h2Title || '',
        content: seoData.content || '',
        ogTitle: seoData.ogTitle || '',
        ogDescription: seoData.ogDescription || '',
        ogImage: seoData.ogImage || '',
        twitterTitle: seoData.twitterTitle || '',
        twitterDescription: seoData.twitterDescription || '',
        twitterImage: seoData.twitterImage || '',
        canonicalUrl: seoData.canonicalUrl || '',
        robotsContent: seoData.robotsContent || 'index, follow',
        structuredData: seoData.structuredData || null,
        customMeta: seoData.customMeta || {},
        isActive: seoData.isActive !== undefined ? seoData.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.seopages.insertOne(newPageData);
      const saved = await db.seopages.findOne({ _id: result.insertedId });
      
      // پاک کردن کش Redis بعد از ایجاد صفحه SEO جدید
      await Promise.all([
        CacheManager.invalidatePattern(`${CACHE_KEYS.SETTINGS}*`),
        CacheManager.invalidatePattern('seo:*'),
        CacheManager.invalidatePattern('page:*')
      ]).catch(err => console.warn('⚠️ خطا در پاک کردن کش:', err));
      
      console.log('✅ صفحه SEO جدید ایجاد شد:', saved?.url);
      const savedPage = saved as ISEOPage;
      await syncSEOPageToFallback(savedPage);
      return savedPage;
    }
  } catch (error) {
    console.error('❌ خطا در ایجاد/بروزرسانی SEO page:', error);
    return null;
  }
}

/**
 * حذف SEO page
 */
export async function deleteSEOPage(url: string): Promise<boolean> {
  try {
    const db = await connectDB();
    const result = await db.seopages.deleteOne({ url });
    
    if (result.deletedCount > 0) {
      // پاک کردن کش Redis بعد از حذف صفحه SEO
      await Promise.all([
        CacheManager.invalidatePattern(`${CACHE_KEYS.SETTINGS}*`),
        CacheManager.invalidatePattern('seo:*'),
        CacheManager.invalidatePattern('page:*')
      ]).catch(err => console.warn('⚠️ خطا در پاک کردن کش:', err));
      
      console.log('✅ صفحه SEO حذف شد:', url);
      await deleteFallbackPageByUrl(url).catch(err =>
        console.warn('⚠️ خطا در حذف SEO از fallback:', err)
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ خطا در حذف SEO page:', error);
    return false;
  }
}

/**
 * فعال/غیرفعال کردن SEO page
 */
export async function toggleSEOPage(url: string, isActive: boolean): Promise<ISEOPage | null> {
  try {
    const db = await connectDB();
    const result = await db.seopages.findOneAndUpdate(
      { url },
      { $set: { isActive, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    // پاک کردن کش Redis بعد از تغییر وضعیت
    await Promise.all([
      CacheManager.invalidatePattern(`${CACHE_KEYS.SETTINGS}*`),
      CacheManager.invalidatePattern('seo:*'),
      CacheManager.invalidatePattern('page:*')
    ]).catch(err => console.warn('⚠️ خطا در پاک کردن کش:', err));
    
    const saved = result?.value as unknown as ISEOPage | null;
    if (saved) {
      await syncSEOPageToFallback(saved);
    }

    return saved;
  } catch (error) {
    console.error('❌ خطا در تغییر وضعیت SEO page:', error);
    return null;
  }
}

/**
 * تحلیل SEO صفحه
 */
export async function analyzePageSEO(url: string) {
  try {
    const seoData = await getSEODataByUrl(url);
    
    if (!seoData) {
      return {
        score: 0,
        title: '',
        description: '',
        keywords: '',
        issues: ['صفحه SEO یافت نشد'],
        suggestions: ['ابتدا تنظیمات SEO را برای این صفحه ایجاد کنید'],
        scoreBreakdown: {},
        loadTime: 0,
        wordCount: 0,
        h1Count: 0,
        h2Count: 0,
        imageCount: 0,
        hasOpenGraph: false,
        hasTwitterCard: false,
        hasStructuredData: false
      };
    }
    
    const score = calculateSEOScore(seoData);
    
    return {
      score,
      title: seoData.title,
      description: seoData.description,
      keywords: seoData.keywords || '',
      issues: [],
      suggestions: [],
      scoreBreakdown: {},
      loadTime: 0,
      wordCount: seoData.content ? seoData.content.split(/\s+/).length : 0,
      h1Count: seoData.h1Title ? 1 : 0,
      h2Count: seoData.h2Title ? 1 : 0,
      imageCount: 0,
      hasOpenGraph: !!(seoData.ogTitle && seoData.ogDescription),
      hasTwitterCard: !!(seoData.twitterTitle && seoData.twitterDescription),
      hasStructuredData: !!seoData.structuredData
    };
  } catch (error) {
    console.error('خطا در تحلیل SEO:', error);
    return {
      score: 0,
      title: '',
      description: '',
      keywords: '',
      issues: ['خطا در تحلیل SEO'],
      suggestions: [],
      scoreBreakdown: {},
      loadTime: 0,
      wordCount: 0,
      h1Count: 0,
      h2Count: 0,
      imageCount: 0,
      hasOpenGraph: false,
      hasTwitterCard: false,
      hasStructuredData: false
    };
  }
}

function calculateSEOScore(seoData: ISEOPage): number {
  let score = 0;
  
  // عنوان (20 امتیاز)
  if (seoData.title && seoData.title.length >= 30 && seoData.title.length <= 60) {
    score += 20;
  } else if (seoData.title) {
    score += 10;
  }
  
  // توضیحات (20 امتیاز)
  if (seoData.description && seoData.description.length >= 120 && seoData.description.length <= 160) {
    score += 20;
  } else if (seoData.description) {
    score += 10;
  }
  
  // کلمات کلیدی (10 امتیاز)
  if (seoData.keywords) {
    score += 10;
  }
  
  // H1 (10 امتیاز)
  if (seoData.h1Title) {
    score += 10;
  }
  
  // H2 (10 امتیاز)
  if (seoData.h2Title) {
    score += 10;
  }
  
  // محتوا (15 امتیاز)
  if (seoData.content && seoData.content.length >= 300) {
    score += 15;
  } else if (seoData.content) {
    score += 7;
  }
  
  // Open Graph (10 امتیاز)
  if (seoData.ogTitle && seoData.ogDescription) {
    score += 10;
  }
  
  // Twitter Card (5 امتیاز)
  if (seoData.twitterTitle && seoData.twitterDescription) {
    score += 5;
  }
  
  return score;
}
