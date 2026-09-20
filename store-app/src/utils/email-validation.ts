/**
 * اعتبارسنجی ایمیل
 * Email Validation with Regex
 */

// Regex استاندارد و قوی برای ایمیل
const EMAIL_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// Regex ساده‌تر برای بررسی سریع
const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// لیست دامنه‌های ایمیل موقت (برای جلوگیری از اسپم)
const TEMP_EMAIL_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'throwaway.email',
  'mailinator.com',
  'temp-mail.org',
  'trashmail.com',
  'fakeinbox.com',
  'yopmail.com',
  'maildrop.cc',
  'getnada.com',
  'dispostable.com',
  'mohmal.com',
  'sharklasers.com',
];

// دامنه‌های ایمیل معتبر ایرانی
const IRANIAN_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'protonmail.com',
  'zoho.com',
  'mail.ru',
  'aol.com',
];

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  domain?: string;
  isIranian?: boolean;
  isTemporary?: boolean;
}

/**
 * پاکسازی ایمیل از فاصله‌های اضافی
 */
export function cleanEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  return email.trim().toLowerCase();
}

/**
 * استخراج دامنه از ایمیل
 */
export function extractEmailDomain(email: string): string | null {
  const cleaned = cleanEmail(email);
  const parts = cleaned.split('@');
  
  if (parts.length !== 2) {
    return null;
  }
  
  return parts[1];
}

/**
 * بررسی اینکه ایمیل موقت است یا نه
 */
export function isTemporaryEmail(email: string): boolean {
  const domain = extractEmailDomain(email);
  
  if (!domain) {
    return false;
  }
  
  return TEMP_EMAIL_DOMAINS.some(tempDomain => 
    domain.toLowerCase() === tempDomain.toLowerCase()
  );
}

/**
 * بررسی اینکه ایمیل ایرانی است یا نه
 */
export function isIranianEmail(email: string): boolean {
  const domain = extractEmailDomain(email);
  
  if (!domain) {
    return false;
  }
  
  return IRANIAN_EMAIL_DOMAINS.some(iranianDomain => 
    domain.toLowerCase() === iranianDomain.toLowerCase()
  );
}

/**
 * اعتبارسنجی کامل ایمیل
 */
export function validateEmail(email: string, options?: {
  allowTempEmails?: boolean;
  customDomains?: string[];
  strictMode?: boolean;
}): EmailValidationResult {
  const {
    allowTempEmails = false,
    customDomains,
    strictMode = false
  } = options || {};
  
  // پاکسازی
  const cleaned = cleanEmail(email);
  
  // بررسی خالی بودن
  if (!cleaned) {
    return {
      isValid: false,
      error: 'ایمیل الزامی است'
    };
  }
  
  // بررسی طول کل (RFC 5321)
  if (cleaned.length > 254) {
    return {
      isValid: false,
      error: 'ایمیل خیلی طولانی است (حداکثر 254 کاراکتر)'
    };
  }
  
  // بررسی وجود @
  const atCount = (cleaned.match(/@/g) || []).length;
  if (atCount !== 1) {
    return {
      isValid: false,
      error: 'فرمت ایمیل نامعتبر است'
    };
  }
  
  // تقسیم به local و domain
  const [localPart, domainPart] = cleaned.split('@');
  
  // بررسی طول local part (قبل از @)
  if (localPart.length === 0 || localPart.length > 64) {
    return {
      isValid: false,
      error: 'بخش قبل از @ نامعتبر است'
    };
  }
  
  // بررسی طول domain part
  if (domainPart.length === 0 || domainPart.length > 253) {
    return {
      isValid: false,
      error: 'دامنه ایمیل نامعتبر است'
    };
  }
  
  // بررسی با Regex (strict mode)
  const regex = strictMode ? EMAIL_REGEX : SIMPLE_EMAIL_REGEX;
  if (!regex.test(cleaned)) {
    return {
      isValid: false,
      error: 'فرمت ایمیل نامعتبر است'
    };
  }
  
  // بررسی نقطه‌های متوالی
  if (/\.\./.test(cleaned)) {
    return {
      isValid: false,
      error: 'ایمیل نمی‌تواند شامل نقطه‌های متوالی باشد'
    };
  }
  
  // بررسی شروع یا پایان با نقطه
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      isValid: false,
      error: 'ایمیل نمی‌تواند با نقطه شروع یا تمام شود'
    };
  }
  
  // بررسی وجود TLD (حداقل یک نقطه در domain)
  if (!domainPart.includes('.')) {
    return {
      isValid: false,
      error: 'دامنه ایمیل باید شامل نقطه باشد'
    };
  }
  
  // استخراج TLD (آخرین بخش بعد از نقطه)
  const tld = domainPart.split('.').pop() || '';
  if (tld.length < 2) {
    return {
      isValid: false,
      error: 'پسوند دامنه نامعتبر است'
    };
  }
  
  // بررسی ایمیل موقت
  const isTemp = isTemporaryEmail(cleaned);
  if (!allowTempEmails && isTemp) {
    return {
      isValid: false,
      error: 'استفاده از ایمیل موقت مجاز نیست',
      domain: domainPart,
      isTemporary: true
    };
  }
  
  // بررسی دامنه‌های سفارشی
  if (customDomains && customDomains.length > 0) {
    const isAllowed = customDomains.some(domain => 
      domainPart.toLowerCase() === domain.toLowerCase()
    );
    
    if (!isAllowed) {
      return {
        isValid: false,
        error: `فقط ایمیل‌های ${customDomains.join(', ')} مجاز هستند`,
        domain: domainPart
      };
    }
  }
  
  return {
    isValid: true,
    domain: domainPart,
    isIranian: isIranianEmail(cleaned),
    isTemporary: isTemp
  };
}

/**
 * تابع ساده برای استفاده سریع
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email).isValid;
}

/**
 * اعتبارسنجی با پیام خطای فارسی
 */
export function validateEmailWithMessage(email: string, options?: {
  allowTempEmails?: boolean;
}): { isValid: boolean; message: string; domain?: string } {
  const result = validateEmail(email, options);
  
  return {
    isValid: result.isValid,
    message: result.isValid 
      ? `ایمیل معتبر${result.isIranian ? ' (دامنه معتبر)' : ''}` 
      : result.error || 'ایمیل نامعتبر است',
    domain: result.domain
  };
}

/**
 * اعتبارسنجی لیستی از ایمیل‌ها
 */
export function validateEmailList(emails: string[]): {
  valid: string[];
  invalid: Array<{ email: string; error: string }>;
} {
  const valid: string[] = [];
  const invalid: Array<{ email: string; error: string }> = [];
  
  emails.forEach(email => {
    const result = validateEmail(email);
    if (result.isValid) {
      valid.push(cleanEmail(email));
    } else {
      invalid.push({
        email,
        error: result.error || 'نامعتبر'
      });
    }
  });
  
  return { valid, invalid };
}

/**
 * ماسک کردن ایمیل برای نمایش (حفظ حریم خصوصی)
 */
export function maskEmail(email: string): string {
  const cleaned = cleanEmail(email);
  const [localPart, domainPart] = cleaned.split('@');
  
  if (!localPart || !domainPart) {
    return email;
  }
  
  // نمایش 2 کاراکتر اول و آخر local part
  if (localPart.length <= 4) {
    return `${localPart.charAt(0)}***@${domainPart}`;
  }
  
  const visibleStart = localPart.substring(0, 2);
  const visibleEnd = localPart.substring(localPart.length - 2);
  
  return `${visibleStart}***${visibleEnd}@${domainPart}`;
}

// Export all functions as default object
const emailValidation = {
  validate: validateEmail,
  isValid: isValidEmail,
  clean: cleanEmail,
  extractDomain: extractEmailDomain,
  isTemporary: isTemporaryEmail,
  isIranian: isIranianEmail,
  validateWithMessage: validateEmailWithMessage,
  validateList: validateEmailList,
  mask: maskEmail,
  regex: EMAIL_REGEX,
  simpleRegex: SIMPLE_EMAIL_REGEX,
  tempDomains: TEMP_EMAIL_DOMAINS
};

export default emailValidation;
