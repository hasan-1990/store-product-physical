import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting برای درخواست‌های تصویر
const imageRequestCache = new Map<string, number[]>();
const MAX_REQUESTS_PER_SECOND = 10;
const CLEANUP_INTERVAL = 60000; // پاکسازی هر 60 ثانیه

// پاکسازی خودکار cache
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of imageRequestCache.entries()) {
    const validTimestamps = timestamps.filter(t => now - t < 10000);
    if (validTimestamps.length === 0) {
      imageRequestCache.delete(key);
    } else {
      imageRequestCache.set(key, validTimestamps);
    }
  }
}, CLEANUP_INTERVAL);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // فقط برای درخواست‌های تصویر
  if (pathname.startsWith('/uploads/') || pathname.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const cacheKey = `${clientIP}:${pathname}`;
    const now = Date.now();
    
    // گرفتن تاریخچه درخواست‌ها
    const timestamps = imageRequestCache.get(cacheKey) || [];
    const recentRequests = timestamps.filter(t => now - t < 1000); // آخرین 1 ثانیه
    
    // بررسی محدودیت
    if (recentRequests.length >= MAX_REQUESTS_PER_SECOND) {
      console.warn(`⚠️ Rate limit exceeded for ${clientIP} - ${pathname}`);
      return new NextResponse('Too Many Requests', { status: 429 });
    }
    
    // اضافه کردن timestamp جدید
    recentRequests.push(now);
    imageRequestCache.set(cacheKey, recentRequests);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/uploads/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
