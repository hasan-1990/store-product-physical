// src/lib/input-sanitization.ts
import mongoSanitize from 'mongo-sanitize';

/**
 * Input Sanitization - پاک‌سازی و اعتبارسنجی ورودی‌ها
 * جلوگیری از XSS، SQL Injection، NoSQL Injection
 */

/**
 * Sanitize string برای جلوگیری از XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // حذف < و >
    .replace(/javascript:/gi, '') // حذف javascript: protocol
    .replace(/on\w+\s*=/gi, '') // حذف event handlers (onclick=, onload=, etc.)
    .replace(/data:text\/html/gi, '') // حذف data URLs
    .substring(0, 10000); // محدود کردن طول
}

/**
 * Sanitize HTML - حذف تگ‌های خطرناک
 */
export function sanitizeHTML(html: string): string {
  if (typeof html !== 'string') return '';
  
  const dangerous = [
    /<script[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?<\/iframe>/gi,
    /<object[\s\S]*?<\/object>/gi,
    /<embed[\s\S]*?<\/embed>/gi,
    /<link[\s\S]*?>/gi,
    /<style[\s\S]*?<\/style>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi
  ];
  
  let sanitized = html;
  for (const pattern of dangerous) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  return sanitized.substring(0, 50000);
}

/**
 * Sanitize MongoDB query - جلوگیری از NoSQL Injection
 */
export function sanitizeMongoQuery<T>(query: T): T {
  if (!query || typeof query !== 'object') {
    return query;
  }
  
  // استفاده از mongo-sanitize
  const sanitized = mongoSanitize(query);
  
  // بررسی اضافی برای prototype pollution
  if (typeof sanitized === 'object' && sanitized !== null) {
    const cleaned: any = Array.isArray(sanitized) ? [] : {};
    
    for (const [key, value] of Object.entries(sanitized)) {
      // جلوگیری از prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      
      // جلوگیری از MongoDB operators در keys
      if (key.startsWith('$') && !isAllowedMongoOperator(key)) {
        continue;
      }
      
      if (typeof value === 'object' && value !== null) {
        cleaned[key] = sanitizeMongoQuery(value);
      } else {
        cleaned[key] = value;
      }
    }
    
    return cleaned as T;
  }
  
  return sanitized as T;
}

/**
 * لیست operator های مجاز MongoDB
 */
function isAllowedMongoOperator(op: string): boolean {
  const allowed = [
    '$eq', '$ne', '$gt', '$gte', '$lt', '$lte',
    '$in', '$nin', '$exists', '$type', '$regex',
    '$and', '$or', '$not', '$nor',
    '$text', '$search'
  ];
  
  return allowed.includes(op);
}

/**
 * Sanitize ایمیل
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  
  return email
    .trim()
    .toLowerCase()
    .replace(/[^\w@.-]/g, '') // فقط حروف، اعداد، @، نقطه و dash
    .substring(0, 254); // طول استاندارد ایمیل
}

/**
 * Sanitize شماره موبایل ایرانی
 */
export function sanitizeMobile(mobile: string): string {
  if (typeof mobile !== 'string') return '';
  
  // حذف تمام کاراکترهای غیرعددی
  let cleaned = mobile.replace(/\D/g, '');
  
  // حذف 0 اول اگر وجود داشت (09123456789 -> 9123456789)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // اضافه کردن 98 برای کد کشور (اختیاری)
  // if (cleaned.length === 10 && cleaned.startsWith('9')) {
  //   cleaned = '98' + cleaned;
  // }
  
  return cleaned;
}

/**
 * Sanitize URL
 */
export function sanitizeURL(url: string): string | null {
  if (typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    
    // فقط HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    // اگر URL نامعتبر است، بررسی می‌کنیم که آیا relative path است
    if (url.startsWith('/') && !url.startsWith('//')) {
      // حذف کاراکترهای خطرناک
      return url.replace(/[<>'"]/g, '').substring(0, 1000);
    }
    return null;
  }
}

/**
 * Sanitize آبجکت کامل
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized: any = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    // جلوگیری از prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    
    // Sanitize key
    const cleanKey = sanitizeString(key);
    
    // Sanitize value بسته به نوع
    if (typeof value === 'string') {
      sanitized[cleanKey] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[cleanKey] = value.map(item => 
        typeof item === 'object' ? sanitizeObject(item) : sanitizeString(String(item))
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[cleanKey] = sanitizeObject(value);
    } else {
      sanitized[cleanKey] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * اعتبارسنجی و Sanitize کردن Search Query
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') return '';
  
  return query
    .trim()
    .replace(/[<>'"\\]/g, '') // حذف کاراکترهای خطرناک
    .replace(/\s+/g, ' ') // normalize spaces
    .substring(0, 200); // محدود کردن طول
}

/**
 * Escape کردن Regex characters
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize نام فایل
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') return '';
  
  return filename
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_') // فقط حروف، اعداد، نقطه، dash و underscore
    .replace(/\.{2,}/g, '.') // حذف .. (directory traversal)
    .replace(/^\.+/, '') // حذف نقطه از ابتدا
    .replace(/\.+$/, '') // حذف نقطه از انتها
    .substring(0, 200);
}

/**
 * بررسی و Sanitize JSON
 */
export function sanitizeJSON(jsonString: string): any | null {
  try {
    const parsed = JSON.parse(jsonString);
    return sanitizeObject(parsed);
  } catch {
    return null;
  }
}

/**
 * Sanitize pagination parameters
 */
export function sanitizePagination(page?: any, limit?: any): { page: number; limit: number } {
  const defaultPage = 1;
  const defaultLimit = 20;
  const maxLimit = 100;
  
  let cleanPage = parseInt(String(page), 10);
  let cleanLimit = parseInt(String(limit), 10);
  
  if (isNaN(cleanPage) || cleanPage < 1) {
    cleanPage = defaultPage;
  }
  
  if (isNaN(cleanLimit) || cleanLimit < 1) {
    cleanLimit = defaultLimit;
  }
  
  if (cleanLimit > maxLimit) {
    cleanLimit = maxLimit;
  }
  
  return { page: cleanPage, limit: cleanLimit };
}

/**
 * Sanitize sort parameters
 */
export function sanitizeSort(sort?: string, allowedFields: string[] = []): string {
  if (typeof sort !== 'string' || !sort.trim()) {
    return '';
  }
  
  const field = sort.replace(/^-/, ''); // حذف - برای descending
  
  if (allowedFields.length > 0 && !allowedFields.includes(field)) {
    return ''; // field مجاز نیست
  }
  
  // فقط حروف، اعداد و underscore
  if (!/^[a-zA-Z0-9_]+$/.test(field)) {
    return '';
  }
  
  return sort.startsWith('-') ? `-${field}` : field;
}

/**
 * Remove HTML tags (برای plain text)
 */
export function stripHTML(html: string): string {
  if (typeof html !== 'string') return '';
  
  return html
    .replace(/<[^>]*>/g, '') // حذف تمام تگ‌ها
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Truncate text با حفظ کلمات کامل
 */
export function truncateText(text: string, maxLength: number = 200): string {
  if (typeof text !== 'string') return '';
  
  const cleaned = stripHTML(text).trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // پیدا کردن آخرین فاصله قبل از maxLength
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Validate و sanitize ObjectId (MongoDB)
 */
export function sanitizeObjectId(id: any): string | null {
  if (typeof id !== 'string') {
    id = String(id);
  }
  
  // MongoDB ObjectId باید 24 کاراکتر hexadecimal باشه
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    return id;
  }
  
  return null;
}

/**
 * Batch sanitization برای آرایه‌ای از رشته‌ها
 */
export function sanitizeArray(arr: string[]): string[] {
  if (!Array.isArray(arr)) return [];
  
  return arr
    .filter(item => typeof item === 'string')
    .map(item => sanitizeString(item))
    .filter(item => item.length > 0);
}
