// src/middleware/security.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security Middleware - اضافه کردن Security Headers
 * این middleware باید در middleware.ts اصلی import و استفاده شود
 */

// Rate limiting in-memory storage (برای production باید از Redis استفاده کنید)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

/**
 * Simple rate limiting
 */
export function rateLimit(ip: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return true;
  }

  if (record.count >= config.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Get client IP address
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * اضافه کردن Security Headers به Response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection (legacy but still useful)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  
  // Content Security Policy (CSP)
  // ⚠️ این را بر اساس نیازهای پروژه تنظیم کنید
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://www.google-analytics.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  return response;
}

/**
 * بررسی و اجبار HTTPS در production
 */
export function enforceHTTPS(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    
    if (protocol !== 'https') {
      const host = request.headers.get('host');
      const url = `https://${host}${request.nextUrl.pathname}${request.nextUrl.search}`;
      return NextResponse.redirect(url, 301);
    }
  }
  
  return null;
}

/**
 * Rate limiting برای API routes
 */
export function checkAPIRateLimit(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  
  // فقط برای API routes
  if (!pathname.startsWith('/api/')) {
    return null;
  }
  
  const ip = getClientIP(request);
  
  // Rate limit configs مختلف برای endpoint های مختلف
  let config: RateLimitConfig;
  
  if (pathname.startsWith('/api/auth/')) {
    // Authentication endpoints: محدودیت بیشتر
    config = { windowMs: 15 * 60 * 1000, maxRequests: 5 }; // 5 per 15 min
  } else if (pathname.startsWith('/api/admin/')) {
    // Admin endpoints: محدودیت متوسط
    config = { windowMs: 15 * 60 * 1000, maxRequests: 50 }; // 50 per 15 min
  } else {
    // سایر API endpoints: محدودیت عادی
    config = { windowMs: 15 * 60 * 1000, maxRequests: 100 }; // 100 per 15 min
  }
  
  const allowed = rateLimit(ip, config);
  
  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'تعداد درخواست‌های شما از حد مجاز گذشته است. لطفاً چند دقیقه صبر کنید.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      { status: 429 }
    );
  }
  
  return null;
}

/**
 * پاک‌سازی دوره‌ای حافظه rate limiting
 */
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of requestCounts.entries()) {
      if (now > record.resetTime) {
        requestCounts.delete(ip);
      }
    }
  }, 60 * 1000); // هر 1 دقیقه
}

/**
 * اعتبارسنجی و Sanitize ورودی‌ها
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // حذف کاراکترهای خطرناک
    return input
      .trim()
      .replace(/[<>]/g, '') // حذف HTML tags
      .replace(/javascript:/gi, '') // حذف javascript: protocol
      .replace(/on\w+=/gi, ''); // حذف event handlers
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // جلوگیری از prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * اعتبارسنجی JWT Secret
 */
export function validateSecrets() {
  const requiredSecrets = [
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'DATABASE_URL'
  ];
  
  const missing: string[] = [];
  const weak: string[] = [];
  
  for (const secret of requiredSecrets) {
    const value = process.env[secret];
    
    if (!value) {
      missing.push(secret);
      continue;
    }
    
    // بررسی قدرت کلید
    if (
      value.length < 32 ||
      value === 'your-secret-key' ||
      value === 'change-this' ||
      value === 'dev-only-secret-do-not-use-in-production'
    ) {
      weak.push(secret);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ CRITICAL: Missing environment variables:', missing);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  if (weak.length > 0) {
    console.warn('⚠️ WARNING: Weak secrets detected:', weak);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Weak secrets detected: ${weak.join(', ')}. Please use strong random values.`);
    }
  }
}

// Validate secrets on startup
if (typeof window === 'undefined') {
  validateSecrets();
}
