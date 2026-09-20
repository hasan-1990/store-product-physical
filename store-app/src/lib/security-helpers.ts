// src/lib/security-helpers.ts
import crypto from 'crypto';

/**
 * Security Helper Functions
 * توابع کمکی برای امنیت برنامه
 */

/**
 * تولید کلید تصادفی قوی
 */
export function generateSecureKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash کردن داده با SHA-256
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * تولید session ID امن
 */
export function generateSecureSessionId(): string {
  return `session_${Date.now()}_${generateSecureKey(16)}`;
}

/**
 * اعتبارسنجی ایمیل
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * اعتبارسنجی شماره موبایل ایرانی
 */
export function isValidIranianMobile(mobile: string): boolean {
  const mobileRegex = /^09\d{9}$/;
  return mobileRegex.test(mobile);
}

/**
 * اعتبارسنجی قدرت رمز عبور
 */
export interface PasswordStrength {
  score: number; // 0-100
  isStrong: boolean;
  feedback: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length < 8) {
    feedback.push('رمز عبور باید حداقل 8 کاراکتر باشد');
  } else if (password.length >= 8) {
    score += 20;
  }
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Complexity checks
  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('رمز عبور باید حداقل یک حرف کوچک داشته باشد');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('رمز عبور باید حداقل یک حرف بزرگ داشته باشد');
  }
  
  if (/[0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push('رمز عبور باید حداقل یک عدد داشته باشد');
  }
  
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push('رمز عبور باید حداقل یک کاراکتر خاص داشته باشد (!@#$%^&*)');
  }
  
  // Common passwords check
  const commonPasswords = ['123456', 'password', '12345678', 'qwerty', 'admin'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    score -= 50;
    feedback.push('رمز عبور شما بسیار رایج است');
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    isStrong: score >= 70,
    feedback: feedback.length > 0 ? feedback : ['رمز عبور قوی است']
  };
}

/**
 * Sanitize string برای جلوگیری از XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize HTML
 */
export function sanitizeHTML(html: string): string {
  // حذف تگ‌های خطرناک
  const dangerous = /<script|<iframe|<object|<embed|javascript:|on\w+=/gi;
  return html.replace(dangerous, '');
}

/**
 * Sanitize MongoDB query برای جلوگیری از NoSQL injection
 */
export function sanitizeMongoQuery<T>(query: T): T {
  if (typeof query !== 'object' || query === null) {
    return query;
  }
  
  const sanitized: any = Array.isArray(query) ? [] : {};
  
  for (const [key, value] of Object.entries(query)) {
    // جلوگیری از operator injection
    if (key.startsWith('$')) {
      continue;
    }
    
    // جلوگیری از prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Validate file upload
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): FileValidationResult {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']
  } = options;
  
  // Check size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `حجم فایل نباید بیشتر از ${Math.round(maxSize / 1024 / 1024)}MB باشد`
    };
  }
  
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'نوع فایل مجاز نیست'
    };
  }
  
  // Check extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'پسوند فایل مجاز نیست'
    };
  }
  
  return { valid: true };
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return generateSecureKey(32);
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}

/**
 * Escape SQL (اگر از SQL استفاده می‌کنید)
 */
export function escapeSQL(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '\\0');
}

/**
 * Validate URL
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate and sanitize redirect URL (جلوگیری از open redirect)
 */
export function sanitizeRedirectURL(url: string, allowedDomains: string[]): string | null {
  try {
    const parsed = new URL(url);
    
    // فقط HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    // چک کردن domain
    if (!allowedDomains.includes(parsed.hostname)) {
      return null;
    }
    
    return url;
  } catch {
    // اگر URL نامعتبر است، فقط pathname را برمی‌گردانیم
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }
    return null;
  }
}

/**
 * Rate limit checker (in-memory)
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remainingAttempts: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetTime: newEntry.resetTime
    };
  }
  
  if (entry.count >= maxAttempts) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: entry.resetTime
    };
  }
  
  entry.count++;
  return {
    allowed: true,
    remainingAttempts: maxAttempts - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Clear expired rate limit entries
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Auto cleanup every minute
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 60 * 1000);
}

/**
 * Generate secure random string
 */
export function generateRandomString(length: number, charset: string = 'alphanumeric'): string {
  const charsets = {
    numeric: '0123456789',
    alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    alphanumeric: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    hex: '0123456789abcdef',
    base64: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  };
  
  const chars = charsets[charset as keyof typeof charsets] || charsets.alphanumeric;
  const randomBytes = crypto.randomBytes(length);
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return result;
}

/**
 * Mask sensitive data (برای logging)
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  
  const masked = '*'.repeat(data.length - visibleChars);
  const visible = data.slice(-visibleChars);
  return masked + visible;
}

/**
 * Validate Iranian National ID
 */
export function isValidIranianNationalId(nationalId: string): boolean {
  if (!/^\d{10}$/.test(nationalId)) return false;
  
  const check = parseInt(nationalId[9]);
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(nationalId[i]) * (10 - i);
  }
  
  const remainder = sum % 11;
  return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
}
