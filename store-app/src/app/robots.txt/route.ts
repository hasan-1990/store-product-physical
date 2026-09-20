import { NextResponse } from 'next/server';
import { getGlobalSEOSettings } from '@/lib/seo-helpers';

// تولید robots.txt
const generateRobots = async (): Promise<string> => {
  try {
    // دریافت تنظیمات عمومی از MongoDB
    const globalSettings = await getGlobalSEOSettings();
    const baseURL = globalSettings?.siteUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    const allowCrawling = globalSettings?.allowCrawling !== false;
    const robotsRules = globalSettings?.robotsRules || [];
    
    let robots = '';
    
    if (robotsRules.length > 0) {
      // استفاده از قوانین سفارشی
      robots = robotsRules.join('\n');
    } else {
      // قوانین پیش‌فرض
      if (allowCrawling) {
        robots = `User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /categories/
Disallow: /private/
Disallow: /_next/
Disallow: /.well-known/

# Allow specific files
Allow: /api/sitemap.xml
Allow: /sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Sitemap
Sitemap: ${baseURL}/sitemap.xml`;
      } else {
        robots = `User-agent: *
Disallow: /`;
      }
    }
    
    return robots;
  } catch (error) {
    console.error('خطا در تولید robots.txt:', error);
    
    // Fallback robots.txt
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    return `User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/
Disallow: /categories/
Disallow: /_next/
Disallow: /.well-known/

Sitemap: ${baseURL}/sitemap.xml`;
  }
};

export async function GET() {
  try {
    const robots = await generateRobots();
    
    return new NextResponse(robots, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400' // 24 ساعت cache
      }
    });
  } catch (error) {
    console.error('خطا در تولید robots.txt:', error);
    return NextResponse.json(
      { error: 'خطا در تولید robots.txt' },
      { status: 500 }
    );
  }
}