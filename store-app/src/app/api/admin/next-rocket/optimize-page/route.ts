import { NextResponse } from 'next/server';
import { NextRocket } from '@/modules/next-rocket';

/**
 * API برای بهینه‌سازی یک صفحه خاص
 * 
 * POST /api/admin/next-rocket/optimize-page
 * Body: { url: string, html?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, html } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL الزامی است' },
        { status: 400 }
      );
    }

    // اگر HTML داده نشده، fetch کن
    let pageHtml = html;
    if (!pageHtml) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}${url}`);
        if (!response.ok) {
          return NextResponse.json(
            { error: 'نتوانستیم صفحه را دریافت کنیم' },
            { status: 404 }
          );
        }
        pageHtml = await response.text();
      } catch (error) {
        return NextResponse.json(
          { error: 'خطا در دریافت صفحه' },
          { status: 500 }
        );
      }
    }

    // بهینه‌سازی صفحه
    const rocket = NextRocket.getInstance();
    const optimizedHtml = await rocket.optimizePage(pageHtml, url);

    // ذخیره در cache
    const cacheKey = `page:${url}`;
    await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/next-rocket/cache`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: cacheKey,
          value: optimizedHtml,
          ttl: 600,
          tags: ['page', url.split('/')[1]],
        }),
      }
    );

    return NextResponse.json({
      success: true,
      message: 'صفحه با موفقیت بهینه‌سازی شد',
      url,
      originalSize: Buffer.byteLength(pageHtml, 'utf8'),
      optimizedSize: Buffer.byteLength(optimizedHtml, 'utf8'),
      reduction: Math.round((1 - Buffer.byteLength(optimizedHtml, 'utf8') / Buffer.byteLength(pageHtml, 'utf8')) * 100),
    });
  } catch (error) {
    console.error('❌ خطا در بهینه‌سازی صفحه:', error);
    return NextResponse.json(
      { error: 'خطا در بهینه‌سازی صفحه' },
      { status: 500 }
    );
  }
}

/**
 * دریافت لیست صفحات بهینه‌شده
 * 
 * GET /api/admin/next-rocket/optimize-page
 */
export async function GET() {
  try {
    const cacheResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/next-rocket/cache`,
      { cache: 'no-store' }
    );

    if (!cacheResponse.ok) {
      return NextResponse.json({ pages: [] });
    }

    const { stats } = await cacheResponse.json();
    
    // فیلتر کردن فقط صفحات (که با page: شروع می‌شوند)
    const pages = Object.keys(stats || {})
      .filter(key => key.startsWith('page:'))
      .map(key => ({
        url: key.replace('page:', ''),
        cachedAt: stats[key].cachedAt,
        hits: stats[key].hits || 0,
        size: stats[key].size || 0,
      }));

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('❌ خطا در دریافت لیست صفحات:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست صفحات' },
      { status: 500 }
    );
  }
}
