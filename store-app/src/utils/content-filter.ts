/**
 * فیلتر محتوای نامناسب
 * 
 * بررسی و فیلتر کردن:
 * - کلمات رکیک فارسی و انگلیسی
 * - لینک‌های مشکوک
 * - اطلاعات حساس (کارت، حساب بانکی)
 * - ایمیل و شماره تلفن (اختیاری)
 */

// ============================================
// الگوهای پیشرفته برای فیلتر محتوا
// ============================================

// کلمات رکیک انگلیسی (با variant ها)
const PROFANITY_EN_REGEX = /\b(f+u+c+k+|s+h+i+t+|b+i+t+c+h+|a+s+s+|d+a+m+n+|bastard|hell|crap|piss|cock|dick|pussy|whore|slut|bitch|fucking|motherfucker|bullshit)\w*/gi;

// کلمات رکیک فارسی (با حروف مختلف)
const PROFANITY_FA_REGEX = /\b(ک+ی+ر+[یی]*|ج+ن+د+ه|ک+[سص]+ش+ع+ر|ک+[سص]+|ک+و+ن+|گ+و+ه+|خ+ر+|حرومزاده|ع+و+ض+ی+|ا+ح+م+ق+|س+گ+)\w*/gi;

// لینک‌های کوتاه شده و مشکوک
const SUSPICIOUS_LINKS_REGEX = /\b(bit\.ly|goo\.gl|tinyurl\.com|t\.co|ow\.ly|is\.gd|buff\.ly|rb\.gy|cutt\.ly|short\.io|tiny\.cc|x\.co)\b/gi;

// الگوهای spam
const SPAM_PATTERNS_REGEX = /(click here|فوری|برنده شدید|جایزه|کلیک کنید|رایگان|100%|!!!+|₿|bitcoin|crypto)/gi;

// الگوی لینک‌های Telegram
const TELEGRAM_LINK_REGEX = /(t\.me|telegram\.me|@[a-z0-9_]{5,})/gi;

// ترکیب همه الگوهای ممنوعه
const FORBIDDEN_PATTERNS: RegExp[] = [
  PROFANITY_EN_REGEX,
  PROFANITY_FA_REGEX,
  SUSPICIOUS_LINKS_REGEX,
  SPAM_PATTERNS_REGEX
];

// ============================================
// الگوهای اطلاعات بانکی حساس
// ============================================

// شماره کارت (16 رقمی با فرمت‌های مختلف)
const CARD_NUMBER_PATTERN = /(?:\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}|\d{16})/g;

// شبا ایران (IR + 24 رقم)
const IBAN_PATTERN = /\b(IR|ir)[\u06f0-\u06f90-9]{24}\b/gi;

// CVV2 (3-4 رقم بعد از کارت)
const CVV_PATTERN = /\b(cvv2?|cvc)\s*[:\u06f0-\u06f90-9]{3,4}\b/gi;

// شماره حساب بانکی (10-16 رقم)
const ACCOUNT_NUMBER_PATTERN = /(?<!\d)[\u06f0-\u06f90-9]{10,16}(?!\d)/g;

// شماره شبا کوتاه (فقط اعداد 24 رقمی)
const SHORT_SHEBA_PATTERN = /(?<!\d)[\u06f0-\u06f90-9]{24}(?!\d)/g;

// الگوی لینک
const LINK_PATTERN = /(https?:\/\/[^\s]+)|(\b[a-z0-9]+\.[a-z]{2,}\b)/gi;

// الگوی ایمیل
const EMAIL_PATTERN = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;

// الگوی شماره موبایل ایران
const PHONE_PATTERN = /\b(09|9)\d{9}\b/g;

export interface ContentFilterOptions {
  blockLinks?: boolean;
  blockEmails?: boolean;
  blockPhoneNumbers?: boolean;
  blockBankInfo?: boolean;
  replaceWith?: string;
  checkForbiddenWords?: boolean;
}

export interface ContentFilterResult {
  isClean: boolean;
  filtered: string;
  violations: string[];
  blockedItems: {
    links?: string[];
    emails?: string[];
    phones?: string[];
    bankInfo?: string[];
    forbiddenWords?: string[];
  };
}

/**
 * فیلتر محتوا
 */
export function filterContent(
  content: string,
  options: ContentFilterOptions = {}
): ContentFilterResult {
  const {
    blockLinks = false,
    blockEmails = false,
    blockPhoneNumbers = false,
    blockBankInfo = true, // پیش‌فرض فعال (امنیت)
    replaceWith = '***',
    checkForbiddenWords = true
  } = options;
  
  let filtered = content;
  const violations: string[] = [];
  const blockedItems: ContentFilterResult['blockedItems'] = {};
  
  // 1. فیلتر کلمات ممنوعه
  if (checkForbiddenWords) {
    const forbiddenWords: string[] = [];
    
    FORBIDDEN_PATTERNS.forEach(pattern => {
      const matches = filtered.match(pattern);
      if (matches) {
        forbiddenWords.push(...matches);
        filtered = filtered.replace(pattern, replaceWith);
      }
    });
    
    if (forbiddenWords.length > 0) {
      violations.push('کلمات نامناسب');
      blockedItems.forbiddenWords = [...new Set(forbiddenWords)];
    }
  }
  
  // 2. فیلتر اطلاعات بانکی (همیشه فعال برای امنیت)
  if (blockBankInfo) {
    const bankInfo: string[] = [];
    
    // شماره کارت
    const cardMatches = filtered.match(CARD_NUMBER_PATTERN);
    if (cardMatches) {
      bankInfo.push(...cardMatches);
      filtered = filtered.replace(CARD_NUMBER_PATTERN, replaceWith);
    }
    
    // شبا
    const ibanMatches = filtered.match(IBAN_PATTERN);
    if (ibanMatches) {
      bankInfo.push(...ibanMatches);
      filtered = filtered.replace(IBAN_PATTERN, replaceWith);
    }
    
    // شماره حساب
    const accountMatches = filtered.match(ACCOUNT_NUMBER_PATTERN);
    if (accountMatches) {
      // فقط اگر بیشتر از 16 رقم باشد (تا با شماره موبایل اشتباه نگیرد)
      const longAccounts = accountMatches.filter(m => m.length >= 16);
      if (longAccounts.length > 0) {
        bankInfo.push(...longAccounts);
        filtered = filtered.replace(ACCOUNT_NUMBER_PATTERN, (match) => 
          match.length >= 16 ? replaceWith : match
        );
      }
    }
    
    if (bankInfo.length > 0) {
      violations.push('اطلاعات بانکی');
      blockedItems.bankInfo = [...new Set(bankInfo)];
    }
  }
  
  // 3. فیلتر لینک‌ها
  if (blockLinks) {
    const links: string[] = [];
    const linkMatches = filtered.match(LINK_PATTERN);
    
    if (linkMatches) {
      links.push(...linkMatches);
      filtered = filtered.replace(LINK_PATTERN, replaceWith);
      violations.push('لینک');
      blockedItems.links = [...new Set(links)];
    }
  }
  
  // 4. فیلتر ایمیل‌ها
  if (blockEmails) {
    const emails: string[] = [];
    const emailMatches = filtered.match(EMAIL_PATTERN);
    
    if (emailMatches) {
      emails.push(...emailMatches);
      filtered = filtered.replace(EMAIL_PATTERN, replaceWith);
      violations.push('ایمیل');
      blockedItems.emails = [...new Set(emails)];
    }
  }
  
  // 5. فیلتر شماره موبایل
  if (blockPhoneNumbers) {
    const phones: string[] = [];
    const phoneMatches = filtered.match(PHONE_PATTERN);
    
    if (phoneMatches) {
      phones.push(...phoneMatches);
      filtered = filtered.replace(PHONE_PATTERN, replaceWith);
      violations.push('شماره تلفن');
      blockedItems.phones = [...new Set(phones)];
    }
  }
  
  return {
    isClean: violations.length === 0,
    filtered,
    violations: [...new Set(violations)],
    blockedItems
  };
}

/**
 * بررسی سریع محتوا (بدون فیلتر کردن)
 */
export function checkContent(content: string): {
  isClean: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // کلمات ممنوعه
  if (FORBIDDEN_PATTERNS.some(pattern => pattern.test(content))) {
    issues.push('شامل کلمات نامناسب');
  }
  
  // اطلاعات بانکی
  if (CARD_NUMBER_PATTERN.test(content) || IBAN_PATTERN.test(content)) {
    issues.push('شامل اطلاعات بانکی');
  }
  
  // لینک‌های مشکوک
  if (/bit\.ly|goo\.gl|tinyurl/i.test(content)) {
    issues.push('شامل لینک مشکوک');
  }
  
  return {
    isClean: issues.length === 0,
    issues
  };
}

/**
 * پاکسازی HTML tags
 */
export function stripHTMLTags(content: string): string {
  return content.replace(/<[^>]*>/g, '');
}

/**
 * پاکسازی کامل (HTML + فیلتر محتوا)
 */
export function sanitizeContent(
  content: string,
  options: ContentFilterOptions = {}
): string {
  // حذف HTML tags
  let cleaned = stripHTMLTags(content);
  
  // فیلتر محتوا
  const filtered = filterContent(cleaned, {
    ...options,
    blockBankInfo: true, // همیشه فعال
    checkForbiddenWords: true // همیشه فعال
  });
  
  return filtered.filtered;
}

/**
 * اعتبارسنجی محتوای کاربر (برای فرم‌ها)
 */
export function validateUserContent(
  content: string,
  options: {
    minLength?: number;
    maxLength?: number;
    allowLinks?: boolean;
    allowEmails?: boolean;
  } = {}
): {
  isValid: boolean;
  error?: string;
  cleaned?: string;
} {
  const {
    minLength = 10,
    maxLength = 5000,
    allowLinks = false,
    allowEmails = false
  } = options;
  
  // بررسی خالی
  if (!content.trim()) {
    return { isValid: false, error: 'محتوا نمی‌تواند خالی باشد' };
  }
  
  // بررسی طول
  if (content.length < minLength) {
    return { 
      isValid: false, 
      error: `محتوا خیلی کوتاه است (حداقل ${minLength} کاراکتر)` 
    };
  }
  
  if (content.length > maxLength) {
    return { 
      isValid: false, 
      error: `محتوا خیلی طولانی است (حداکثر ${maxLength} کاراکتر)` 
    };
  }
  
  // فیلتر محتوا
  const filtered = filterContent(content, {
    blockLinks: !allowLinks,
    blockEmails: !allowEmails,
    blockPhoneNumbers: false,
    blockBankInfo: true,
    checkForbiddenWords: true
  });
  
  if (!filtered.isClean) {
    return {
      isValid: false,
      error: `محتوا شامل موارد ممنوعه است: ${filtered.violations.join(', ')}`
    };
  }
  
  return {
    isValid: true,
    cleaned: filtered.filtered
  };
}
