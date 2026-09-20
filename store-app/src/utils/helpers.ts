import { validateIranianMobile, isValidIranianMobile, formatMobileNumber as formatMobile, cleanMobileNumber } from './mobile-validation';

/**
 * Format a price to display with currency symbol
 */
export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

/**
 * Calculate discount percentage
 */
export const calculateDiscountPercentage = (originalPrice: number, salePrice: number): number => {
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Generate a random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Clamp a number between min and max values
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Check if an email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * اعتبارسنجی شماره موبایل ایرانی - نسخه ساده
 * Iranian mobile phone validation - simple version
 */
export const isValidMobile = (mobile: string): boolean => {
  return isValidIranianMobile(mobile);
};

/**
 * اعتبارسنجی شماره موبایل ایرانی - نسخه کامل با جزئیات
 * Iranian mobile phone validation - full version with details
 */
export const validateMobile = (mobile: string) => {
  return validateIranianMobile(mobile);
};

/**
 * فرمت کردن شماره موبایل ایرانی
 * Format Iranian mobile phone number
 */
export const formatMobileNumber = (mobile: string, format: 'local' | 'international' | 'display' = 'local'): string => {
  return formatMobile(mobile, format);
};

/**
 * پاکسازی شماره موبایل از کاراکترهای غیرضروری
 * Clean mobile number from unnecessary characters
 */
export const cleanMobile = (mobile: string): string => {
  return cleanMobileNumber(mobile);
};

/**
 * Convert string to URL-friendly slug
 */
export const slugify = (text: string): string => {
  if (!text) return '';
  let s = text
    .replace(/[\u200C\u200F]/g, ' ') // حذف نیم‌فاصله‌های پنهان
    .toLowerCase();

  // نگاشت نسبی حروف فارسی به لاتین برای سازگاری URL های انگلیسی
  const map: Record<string,string> = {
    'آ':'a','ا':'a','ب':'b','پ':'p','ت':'t','ث':'s','ج':'j','چ':'ch','ح':'h','خ':'kh','د':'d','ذ':'z','ر':'r','ز':'z','ژ':'zh','س':'s','ش':'sh','ص':'s','ض':'z','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'gh','ک':'k','گ':'g','ل':'l','م':'m','ن':'n','و':'v','ه':'h','ی':'y','ء':'','ٔ':'','ً':'','ٌ':'','ٍ':'','َ':'','ُ':'','ِ':'','ّ':''
  };
  s = s.replace(/[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیءًٌٍَُِّٔ]/g, c => map[c] || '');

  // حذف کاراکترهای غیر مجاز (اجازه حروف لاتین، عدد، خط تیره و فاصله)
  s = s.replace(/[^a-z0-9\-\s]/g, '');
  // تبدیل فاصله‌ها به خط تیره
  s = s.replace(/\s+/g, '-');
  // حذف فقط خط تیره‌های بیش از 2 تا متوالی (اجازه 1 یا 2 خط فاصله)
  s = s.replace(/-{3,}/g, '-');
  // حذف خط تیره ابتدا و انتها
  s = s.replace(/^-+|-+$/g, '');
  // اگر خالی شد fallback ساده
  if (!s) {
    s = 'product';
  }
  return s.substring(0, 80);
};

/**
 * Build enriched product slug using brand/model + base name.
 * Avoid duplicates of repeated words, trim length, ensure fallback.
 * NOTE: Uniqueness in DB is guaranteed by sequentialId in final URL; we only ensure a clean base slug here.
 */
export function buildProductSlug(input: {
  name: string;
  brand?: string | null;
  model?: string | null;
  baseSlug?: string; // optional precomputed
  maxLength?: number;
}): string {
  const maxLength = input.maxLength ?? 80;
  const parts: string[] = [];
  const pushClean = (val?: string | null) => {
    if (!val) return;
    const cleaned = slugify(val);
    if (cleaned && !parts.includes(cleaned)) parts.push(cleaned);
  };
  pushClean(input.brand);
  pushClean(input.model);
  if (input.baseSlug) {
    pushClean(input.baseSlug);
  } else {
    pushClean(input.name);
  }
  let combined = parts.join('-');
  if (combined.length > maxLength) {
    combined = combined.substring(0, maxLength);
    combined = combined.replace(/-+$/,'');
  }
  if (!combined) combined = 'product';
  return combined;
}

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength).trim() + '...';
};

/**
 * Calculate cart totals
 */
export const calculateCartTotals = (items: Array<{ price: number; quantity: number }>) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax rate
  const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
  const total = subtotal + tax + shipping;

  return {
    subtotal,
    tax,
    shipping,
    total,
  };
};
