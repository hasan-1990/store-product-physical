/**
 * اعتبارسنجی نام و نام خانوادگی
 * 
 * پشتیبانی از:
 * - حروف فارسی
 * - حروف انگلیسی
 * - فیلتر کلمات ممنوعه
 */

// ============================================
// Regex های پیشرفته برای اعتبارسنجی نام
// ============================================

// حروف فارسی کامل (عربی + فارسی)
const PERSIAN_NAME_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/;

// حروف انگلیسی + فاصله + آپاستروف (O'Neil)
const ENGLISH_NAME_REGEX = /^[a-zA-Z\s'-]+$/;

// ترکیبی (فارسی + انگلیسی)
const MIXED_NAME_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF a-zA-Z\s'-]+$/;

// الگوی تشخیص اعداد در نام
const HAS_NUMBERS_REGEX = /\d/;

// الگوی تشخیص کاراکترهای خاص نامعتبر
const INVALID_SPECIAL_CHARS_REGEX = /[!@#$%^&*()_+=\[\]{};:"\\|,.<>\/?~`]/;

// الگوی تشخیص فاصله‌های متوالی
const MULTIPLE_SPACES_REGEX = /\s{2,}/g;

// الگوی تشخیص نام یک حرفی
const SINGLE_LETTER_REGEX = /^[a-zA-Z\u0600-\u06FF]$/;

// ============================================
// کلمات ممنوعه با دسته‌بندی
// ============================================

// کلمات سیستمی
const SYSTEM_WORDS = ['admin', 'administrator', 'root', 'system', 'test', 'guest', 'user', 'null', 'undefined', 'none', 'unknown'];

// کلمات SQL Injection
const SQL_WORDS = ['select', 'drop', 'delete', 'insert', 'update', 'truncate', 'alter', 'create', 'exec', 'execute', 'script'];

// کلمات رکیک انگلیسی
const PROFANITY_EN = ['fuck', 'shit', 'damn', 'bitch', 'ass', 'bastard', 'hell', 'dick', 'cock', 'pussy', 'whore', 'slut', 'crap'];

// کلمات رکیک فارسی
const PROFANITY_FA = ['کیری', 'جنده', 'کسشعر', 'کص', 'کون', 'گوه', 'خر', 'حرومزاده', 'عوضی', 'احمق', 'سگ', 'کس'];

// الگوهای تکراری مشکوک
const SUSPICIOUS_PATTERNS = ['123', '111', '000', 'aaa', 'xxx', 'zzz', '999', 'abc', 'qwe'];

// ترکیب همه کلمات ممنوعه
const FORBIDDEN_WORDS = [
  ...SYSTEM_WORDS,
  ...SQL_WORDS,
  ...PROFANITY_EN,
  ...PROFANITY_FA,
  ...SUSPICIOUS_PATTERNS
];

export interface NameValidationOptions {
  type?: 'firstName' | 'lastName' | 'fullName';
  allowEnglish?: boolean;
  allowPersian?: boolean;
  allowMixed?: boolean;
  minLength?: number;
  maxLength?: number;
  checkForbiddenWords?: boolean;
}

export interface NameValidationResult {
  isValid: boolean;
  cleaned?: string;
  error?: string;
  warnings?: string[];
}

/**
 * اعتبارسنجی نام
 */
export function validateName(
  name: string,
  options: NameValidationOptions = {}
): NameValidationResult {
  const {
    type = 'firstName',
    allowEnglish = true,
    allowPersian = true,
    allowMixed = true,
    minLength = 2,
    maxLength = 50,
    checkForbiddenWords = true
  } = options;
  
  // پاکسازی فاصله‌های اضافی
  const cleaned = name.trim().replace(/\s+/g, ' ');
  
  // بررسی خالی بودن
  if (!cleaned) {
    const labels = {
      firstName: 'نام',
      lastName: 'نام خانوادگی',
      fullName: 'نام و نام خانوادگی'
    };
    return { 
      isValid: false, 
      error: `${labels[type]} الزامی است` 
    };
  }
  
  // بررسی طول
  if (cleaned.length < minLength) {
    return { 
      isValid: false, 
      error: `حداقل ${minLength} کاراکتر وارد کنید` 
    };
  }
  
  if (cleaned.length > maxLength) {
    return { 
      isValid: false, 
      error: `حداکثر ${maxLength} کاراکتر مجاز است` 
    };
  }
  
  // بررسی اعداد
  if (HAS_NUMBERS_REGEX.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'نام نمی‌تواند شامل عدد باشد' 
    };
  }
  
  // بررسی کاراکترهای خاص نامعتبر
  if (INVALID_SPECIAL_CHARS_REGEX.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'نام شامل کاراکترهای غیرمجاز است' 
    };
  }
  
  // بررسی نام یک حرفی
  if (SINGLE_LETTER_REGEX.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'نام نمی‌تواند فقط یک حرف باشد' 
    };
  }
  
  // بررسی کاراکترهای مجاز
  let regex: RegExp;
  
  if (allowMixed) {
    regex = MIXED_NAME_REGEX;
  } else if (allowPersian && !allowEnglish) {
    regex = PERSIAN_NAME_REGEX;
  } else if (allowEnglish && !allowPersian) {
    regex = ENGLISH_NAME_REGEX;
  } else {
    return { 
      isValid: false, 
      error: 'تنظیمات نامعتبر' 
    };
  }
  
  if (!regex.test(cleaned)) {
    let message = 'فقط حروف مجاز است';
    if (allowPersian && allowEnglish) {
      message = 'فقط حروف فارسی یا انگلیسی مجاز است';
    } else if (allowPersian) {
      message = 'فقط حروف فارسی مجاز است';
    } else if (allowEnglish) {
      message = 'فقط حروف انگلیسی مجاز است';
    }
    return { 
      isValid: false, 
      error: message 
    };
  }
  
  // بررسی کلمات ممنوعه
  if (checkForbiddenWords) {
    const lowerCleaned = cleaned.toLowerCase();
    const foundForbidden = FORBIDDEN_WORDS.find(word => 
      lowerCleaned.includes(word.toLowerCase())
    );
    
    if (foundForbidden) {
      return { 
        isValid: false, 
        error: 'نام وارد شده نامعتبر است' 
      };
    }
  }
  
  // بررسی اینکه فقط اعداد نباشد
  if (/^\d+$/.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'نام نمی‌تواند فقط عدد باشد' 
    };
  }
  
  // بررسی تکرار زیاد کاراکترها
  if (/(.)\1{3,}/.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'نام نامعتبر است (تکرار کاراکتر)' 
    };
  }
  
  // هشدارها (اختیاری)
  const warnings: string[] = [];
  
  // اگر خیلی کوتاه باشد
  if (cleaned.length < 3) {
    warnings.push('نام کمی کوتاه است');
  }
  
  // اگر فقط یک کلمه باشد و نوع fullName است
  if (type === 'fullName' && !cleaned.includes(' ')) {
    warnings.push('لطفاً نام و نام خانوادگی را وارد کنید');
  }
  
  return { 
    isValid: true, 
    cleaned,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * اعتبارسنجی نام کوچک
 */
export function validateFirstName(firstName: string): NameValidationResult {
  return validateName(firstName, { type: 'firstName' });
}

/**
 * اعتبارسنجی نام خانوادگی
 */
export function validateLastName(lastName: string): NameValidationResult {
  return validateName(lastName, { type: 'lastName' });
}

/**
 * اعتبارسنجی نام کامل
 */
export function validateFullName(fullName: string): NameValidationResult {
  return validateName(fullName, { 
    type: 'fullName',
    minLength: 5,
    maxLength: 100
  });
}

/**
 * جداسازی نام و نام خانوادگی از نام کامل
 */
export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const cleaned = fullName.trim().replace(/\s+/g, ' ');
  const parts = cleaned.split(' ');
  
  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: ''
    };
  }
  
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

/**
 * فرمت کردن نام (حرف اول بزرگ)
 */
export function formatName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
