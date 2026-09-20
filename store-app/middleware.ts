import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from "next-auth/middleware";
import { getToken } from 'next-auth/jwt';
import { getClientIP } from '@/lib/visitor-tracking';
import { isDevOnlyApiRoute, isDevRouteAllowed } from '@/lib/dev-routes';

// ===== RATE LIMITING =====
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string, pathname: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  
  // تنظیمات مختلف برای endpoint های مختلف
  let maxRequests = 100;
  let windowMs = 15 * 60 * 1000; // 15 minutes
  
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
    maxRequests = 5; // فقط 5 تلاش برای login/register
    windowMs = 15 * 60 * 1000;
  } else if (pathname.startsWith('/api/auth/')) {
    maxRequests = 100; // session check و سایر auth endpoint ها
    windowMs = 15 * 60 * 1000;
  } else if (pathname.startsWith('/api/admin/')) {
    maxRequests = 50;
  } else if (pathname.startsWith('/api/')) {
    maxRequests = 100;
  } else {
    maxRequests = 200; // صفحات عادی
  }
  
  const key = `${ip}:${pathname.split('/').slice(0, 3).join('/')}`; // Group by base path
  const entry = rateLimitStore.get(key);
  
  // پاک کردن entry های منقضی شده
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key);
  }
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
      blocked: false
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (entry.count >= maxRequests) {
    entry.blocked = true;
    return { allowed: false, remaining: 0 };
  }
  
  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

// پاک‌سازی دوره‌ای
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // هر 1 دقیقه

export default withAuth(
  async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (isDevOnlyApiRoute(pathname) && !isDevRouteAllowed()) {
      return NextResponse.json(
        { success: false, message: 'Not found' },
        { status: 404 }
      );
    }

    const maintenanceActive =
      process.env.MAINTENANCE_MODE === 'true' ||
      request.cookies.get('maintenance_mode')?.value === 'true';
    if (maintenanceActive) {
      const maintenanceExempt =
        pathname.startsWith('/maintenance') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/uploads') ||
        pathname === '/favicon.ico' ||
        pathname === '/robots.txt' ||
        pathname === '/sitemap.xml';

      if (!maintenanceExempt) {
        const token = await getToken({
          req: request,
          secret: process.env.NEXTAUTH_SECRET,
        });
        const role = (token as { role?: string } | null)?.role;
        const isAdmin = !!role && role.toString().toLowerCase().includes('admin');
        if (!isAdmin) {
          return NextResponse.redirect(new URL('/maintenance', request.url));
        }
      }
    }

    let response = NextResponse.next();
    
    // ===== 1. SECURITY HEADERS =====
    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    // XSS Protection
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://www.google-analytics.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    response.headers.set('Content-Security-Policy', csp);
    
    // HSTS (HTTPS only) - فقط در production
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // CORS Headers
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.NEXTAUTH_URL,
      'http://localhost:3000',
      'http://localhost:3001'
    ].filter(Boolean);
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }

    const staticAssetPrefixes = [
      '/uploads',
      '/_next/static',
      '/_next/image',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml'
    ];

    const isStaticAsset = staticAssetPrefixes.some((prefix) =>
      pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`)
    );

    if (isStaticAsset) {
      return response;
    }

    // Cache control
    // نکته: cache کردن /api/auth/session یا صفحات /admin می‌تواند باعث stale شدن session
    // و logout شدن اشتباهی بعد از refresh در production شود.
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
      response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.append('Vary', 'Cookie');
    } else if (pathname === '/api/auth/session') {
      response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.append('Vary', 'Cookie');
    } else if (pathname.startsWith('/api/auth')) {
      response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.append('Vary', 'Cookie');
    } else {
      response.headers.set('Cache-Control', 'no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }
    
    // مسیرهای مجاز در حالت تعمیر
    const allowedPaths = [
      '/maintenance',
      '/admin/login',
      '/api/',
      '/_next',
      '/uploads',
      '/favicon.ico'
    ];

    // مسیرهای غیرقابل ردیابی
    const excludeFromTracking = [
      '/admin',
      '/api',
  '/_next',
  '/uploads',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
      '/maintenance'
    ];

    // ===== 2. HTTPS & WWW REDIRECT (Production only) =====
    if (process.env.NODE_ENV === 'production' && process.env.PREFERRED_HOST) {
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host') || '';
      const preferredHost = process.env.PREFERRED_HOST;
      
      // Redirect HTTP to HTTPS
      if (protocol !== 'https') {
        const url = `https://${preferredHost}${pathname}${request.nextUrl.search}`;
        return NextResponse.redirect(url, 301);
      }
      
      // Redirect non-preferred host
      if (host !== preferredHost && !host.startsWith('localhost')) {
        const url = `https://${preferredHost}${pathname}${request.nextUrl.search}`;
        return NextResponse.redirect(url, 301);
      }
    }
    
    // ===== 3. RATE LIMITING =====
    const ip = getClientIP(request);
  const rateLimit = checkRateLimit(ip, pathname);
    
  if (!rateLimit.allowed) {
      console.warn(`🚫 Rate limit exceeded: ${ip} - ${pathname}`);
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'تعداد درخواست‌های شما از حد مجاز گذشته است. لطفاً چند دقیقه صبر کنید.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + 900),
            ...Object.fromEntries(response.headers.entries())
          }
        }
      );
    }
    
    // اضافه کردن rate limit headers
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    
    // درخواست‌های SEO analyzer را اجازه بده
    const userAgent = request.headers.get('user-agent') || '';
    if (userAgent.includes('SEO-Analyzer')) {
      return response;
    }

    // اگر مسیر API عمومی است (غیر از admin)، بگذار ادامه یابد
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin/')) {
      return response;
    }

    // اگر مسیر مجاز است، بگذار ادامه یابد
    for (const allowedPath of allowedPaths) {
      if (pathname.startsWith(allowedPath)) {
        return response;
      }
    }

    // ردیابی بازدیدکنندگان برای صفحات عمومی
    const shouldTrack = !excludeFromTracking.some(path => pathname.startsWith(path));
    
    if (shouldTrack && request.method === 'GET') {
      try {
        const ip = getClientIP(request);
        const userAgent = request.headers.get('user-agent') || 'unknown';
        const referrer = request.headers.get('referer') || undefined;
        
        // Just log the visit without MongoDB operations in middleware
        console.log('📊 Visit:', { pathname, ip: ip.substring(0, 10) + '...', ua: userAgent.substring(0, 20) + '...' });
      } catch (error) {
        console.error('📊 Error logging visit:', error);
      }
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Public admin routes (don't require authentication)
        const publicAdminRoutes = [
          '/admin/login',
          '/admin/login-simple',
          '/admin/forgot-password',
          '/admin/reset-password'
        ];
        
        // Check if current path is public
        const isPublicRoute = publicAdminRoutes.some(route => pathname.startsWith(route));
        
        // Debug log
        if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
          console.log('🔐 Auth Check:', { pathname, isPublicRoute, hasToken: !!token, role: token?.role });
        }
        
        // Protect admin routes and API admin routes (except public routes)
        if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) && !isPublicRoute) {
          const role = typeof token?.role === 'string' ? token.role.toLowerCase() : undefined;
          return role === 'admin';
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
}
