/**
 * اعتبارسنجی شماره موبایل ایرانی
 * Iranian Mobile Phone Number Validation
 */

export interface MobileValidationResult {
  isValid: boolean;
  formatted?: string;
  cleaned?: string;
  operator?: string;
  error?: string;
}

// اپراتورهای موبایل ایران و پیش‌شماره‌های آنها
const IRANIAN_MOBILE_OPERATORS = {
  'همراه اول': ['0901', '0902', '0903', '0905', '0930', '0933', '0934', '0935', '0936', '0937', '0938', '0939'],
  'ایرانسل': ['0910', '0911', '0912', '0913', '0914', '0915', '0916', '0917', '0918', '0919', '0990', '0991', '0992', '0993', '0994', '0995', '0996', '0999'],
  'رایتل': ['0920', '0921', '0922'],
  'تله کیش': ['0932', '0934'],
  'کیش سل': ['0934'],
  'سامانتل': ['0998'],
  'تکفا': ['0932'],
  'رایانتل': ['0989'],
  'مخابرات کیش': ['0934'],
  'اپلاین': ['0997'],
  'فن آوا': ['0922'],
  'زیکس': ['0959'],
  'تک‌سل': ['0999'],
  'صدا': ['0998'],
  'معین': ['0990']
};

// الگوهای regex برای اعتبارسنجی
const MOBILE_PATTERNS = {
  // فرمت کامل با کدهای کشور مختلف
  withCountryCode: /^(\+98|0098|98)9[0-9]{9}$/,
  
  // فرمت محلی با صفر
  localWithZero: /^09[0-9]{9}$/,
  
  // فرمت بدون صفر
  withoutZero: /^9[0-9]{9}$/,
  
  // فرمت با فاصله یا خط تیره
  withSeparators: /^(\+98|0098|98|0)?9[0-9]{2}[-\s]?[0-9]{3}[-\s]?[0-9]{4}$/,
  
  // فرمت آزاد (برای پاکسازی)
  anyFormat: /^(\+98|0098|98|0)?9[0-9\s\-]{8,12}$/
};

/**
 * پاکسازی شماره موبایل از کاراکترهای غیرضروری
 */
export function cleanMobileNumber(mobile: string): string {
  if (!mobile || typeof mobile !== 'string') {
    return '';
  }
  
  // حذف تمام کاراکترهای غیر عددی به جز علامت +
  let cleaned = mobile.replace(/[^\d+]/g, '');
  
  // حذف کدهای کشور
  if (cleaned.startsWith('+98')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('0098')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('98') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  
  // حذف صفر ابتدایی
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  
  return cleaned;
}

/**
 * تشخیص اپراتور بر اساس پیش‌شماره
 */
export function detectOperator(mobile: string): string | null {
  const cleaned = cleanMobileNumber(mobile);
  
  if (cleaned.length !== 10 || !cleaned.startsWith('9')) {
    return null;
  }
  
  const prefix = '0' + cleaned.substring(0, 3);
  
  for (const [operator, prefixes] of Object.entries(IRANIAN_MOBILE_OPERATORS)) {
    if (prefixes.includes(prefix)) {
      return operator;
    }
  }
  
  return 'نامشخص';
}

/**
 * فرمت کردن شماره موبایل به فرمت استاندارد
 */
export function formatMobileNumber(mobile: string, format: 'local' | 'international' | 'display' = 'local'): string {
  const cleaned = cleanMobileNumber(mobile);
  
  if (cleaned.length !== 10 || !cleaned.startsWith('9')) {
    return mobile; // در صورت نامعتبر بودن، همان ورودی را برگردان
  }
  
  switch (format) {
    case 'local':
      return '0' + cleaned;
    case 'international':
      return '+98' + cleaned;
    case 'display':
      return `0${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    default:
      return '0' + cleaned;
  }
}

/**
 * اعتبارسنجی کامل شماره موبایل ایرانی
 */
export function validateIranianMobile(mobile: string, options?: {
  allowInternational?: boolean;
  strictOperatorCheck?: boolean;
}): MobileValidationResult {
  const { allowInternational = true, strictOperatorCheck = false } = options || {};
  
  // بررسی ورودی اولیه
  if (!mobile || typeof mobile !== 'string') {
    return {
      isValid: false,
      error: 'شماره موبایل وارد نشده است'
    };
  }
  
  // پاکسازی شماره
  const cleaned = cleanMobileNumber(mobile);
  
  // بررسی طول
  if (cleaned.length !== 10) {
    return {
      isValid: false,
      error: `طول شماره موبایل نامعتبر است (${cleaned.length} رقم)`
    };
  }
  
  // بررسی شروع با 9
  if (!cleaned.startsWith('9')) {
    return {
      isValid: false,
      error: 'شماره موبایل باید با 9 شروع شود'
    };
  }
  
  // بررسی فرمت کلی
  if (!MOBILE_PATTERNS.withoutZero.test(cleaned)) {
    return {
      isValid: false,
      error: 'فرمت شماره موبایل نامعتبر است'
    };
  }
  
  // تشخیص اپراتور
  const operator = detectOperator(mobile);
  
  // اگر بررسی دقیق اپراتور فعال باشد
  if (strictOperatorCheck && operator === 'نامشخص') {
    return {
      isValid: false,
      error: 'پیش‌شماره اپراتور نامعتبر است'
    };
  }
  
  // اگر فرمت بین‌المللی مجاز نباشد
  if (!allowInternational && (mobile.includes('+98') || mobile.includes('0098'))) {
    return {
      isValid: false,
      error: 'لطفا از فرمت محلی استفاده کنید (09xxxxxxxxx)'
    };
  }
  
  return {
    isValid: true,
    formatted: formatMobileNumber(mobile, 'local'),
    cleaned: cleaned,
    operator: operator || undefined
  };
}

/**
 * اعتبارسنجی ساده شماره موبایل (برای استفاده در forms)
 */
export function isValidIranianMobile(mobile: string): boolean {
  return validateIranianMobile(mobile).isValid;
}

/**
 * اعتبارسنجی با پیام خطای فارسی
 */
export function validateMobileWithMessage(mobile: string): { isValid: boolean; message: string } {
  const result = validateIranianMobile(mobile);
  
  return {
    isValid: result.isValid,
    message: result.isValid 
      ? `شماره موبایل معتبر ${result.operator ? `(${result.operator})` : ''}`
      : result.error || 'شماره موبایل نامعتبر است'
  };
}

/**
 * تولید شماره موبایل تصادفی برای تست
 */
export function generateRandomMobile(operator?: keyof typeof IRANIAN_MOBILE_OPERATORS): string {
  const operators = operator ? [operator] : Object.keys(IRANIAN_MOBILE_OPERATORS);
  const selectedOperator = operators[Math.floor(Math.random() * operators.length)] as keyof typeof IRANIAN_MOBILE_OPERATORS;
  const prefixes = IRANIAN_MOBILE_OPERATORS[selectedOperator];
  const selectedPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  // حذف صفر از پیش‌شماره و اضافه کردن 7 رقم تصادفی
  const baseNumber = selectedPrefix.substring(1);
  const randomDigits = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
  
  return '0' + baseNumber + randomDigits;
}

// Export all functions as default object
const mobileValidation = {
  validate: validateIranianMobile,
  isValid: isValidIranianMobile,
  clean: cleanMobileNumber,
  format: formatMobileNumber,
  detectOperator,
  validateWithMessage: validateMobileWithMessage,
  generateRandom: generateRandomMobile,
  patterns: MOBILE_PATTERNS,
  operators: IRANIAN_MOBILE_OPERATORS
};

export default mobileValidation;