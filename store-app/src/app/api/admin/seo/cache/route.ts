import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { cacheType } = await request.json();

    let result = { success: false, message: '' };

    switch (cacheType) {
      case 'seo-data':
        result = await clearSEODataCache();
        break;
      case 'sitemap':
        result = await clearSitemapCache();
        break;
      case 'reports':
        result = await clearReportsCache();
        break;
      case 'all':
        const seoResult = await clearSEODataCache();
        const sitemapResult = await clearSitemapCache();
        const reportsResult = await clearReportsCache();
        
        result = {
          success: seoResult.success && sitemapResult.success && reportsResult.success,
          message: 'تمام کش‌های SEO پاک شدند'
        };
        break;
      default:
        return NextResponse.json(
          { error: 'نوع کش مشخص نشده' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('خطا در پاکسازی کش:', error);
    return NextResponse.json(
      { error: 'خطا در پاکسازی کش' },
      { status: 500 }
    );
  }
}

async function clearSEODataCache() {
  try {
    // پاک کردن فایل‌های کش SEO
    const cacheFiles = [
      'seo-analysis-cache.json',
      'seo-performance-cache.json',
      'seo-keywords-cache.json'
    ];

    const dataDir = path.join(process.cwd(), 'data');
    
    for (const file of cacheFiles) {
      const filePath = path.join(dataDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return { success: true, message: 'کش داده‌های SEO پاک شد' };
  } catch (error) {
    return { success: false, message: 'خطا در پاک کردن کش داده‌های SEO' };
  }
}

async function clearSitemapCache() {
  try {
    // پاک کردن کش sitemap
    const sitemapCachePath = path.join(process.cwd(), 'data', 'sitemap-cache.json');
    if (fs.existsSync(sitemapCachePath)) {
      fs.unlinkSync(sitemapCachePath);
    }

    return { success: true, message: 'کش Sitemap پاک شد' };
  } catch (error) {
    return { success: false, message: 'خطا در پاک کردن کش Sitemap' };
  }
}

async function clearReportsCache() {
  try {
    // پاک کردن کش گزارش‌ها
    const reportsCacheFiles = [
      'reports-complete-cache.json',
      'reports-performance-cache.json',
      'reports-content-cache.json',
      'reports-technical-cache.json'
    ];

    const dataDir = path.join(process.cwd(), 'data');
    
    for (const file of reportsCacheFiles) {
      const filePath = path.join(dataDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return { success: true, message: 'کش گزارش‌ها پاک شد' };
  } catch (error) {
    return { success: false, message: 'خطا در پاک کردن کش گزارش‌ها' };
  }
}

export async function GET() {
  try {
    // نمایش وضعیت کش‌ها
    const dataDir = path.join(process.cwd(), 'data');
    const cacheStatus = {
      seoData: checkCacheExists(dataDir, ['seo-analysis-cache.json', 'seo-performance-cache.json']),
      sitemap: checkCacheExists(dataDir, ['sitemap-cache.json']),
      reports: checkCacheExists(dataDir, ['reports-complete-cache.json', 'reports-performance-cache.json'])
    };

    return NextResponse.json({ cacheStatus });

  } catch (error) {
    console.error('خطا در بررسی وضعیت کش:', error);
    return NextResponse.json(
      { error: 'خطا در بررسی وضعیت کش' },
      { status: 500 }
    );
  }
}

function checkCacheExists(dataDir: string, files: string[]): boolean {
  return files.some(file => fs.existsSync(path.join(dataDir, file)));
}