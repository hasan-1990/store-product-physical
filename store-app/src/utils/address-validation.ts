/**
 * اعتبارسنجی آدرس
 * 
 * بررسی:
 * - طول مناسب
 * - وجود کلمات کلیدی
 * - عدم تکرار زیاد کاراکترها
 */

export interface AddressValidationOptions {
  minLength?: number;
  maxLength?: number;
  requireStreetNumber?: boolean;
  requireUsefulKeywords?: boolean;
}

export interface AddressValidationResult {
  isValid: boolean;
  cleaned?: string;
  warnings?: string[];
  error?: string;
  hasStreetNumber?: boolean;
  hasUsefulKeywords?: boolean;
}

// ============================================
// Regex های پیشرفته برای آدرس
// ============================================

// پلاک/شماره (فارسی و انگلیسی)
const STREET_NUMBER_REGEX = /(پلاک|plaque|plate)\s*[:\u06f0-\u06f90-9]+|شماره\s*[:\u06f0-\u06f90-9]+|(no\.|number)\s*[0-9]+|(?<!\d)\d{1,4}(?!\d{5})/gi;

// واحد/طبقه
const UNIT_REGEX = /(واحد|unit)\s*[:\u06f0-\u06f90-9]+/gi;
const FLOOR_REGEX = /(طبقه|floor)\s*[:\u06f0-\u06f90-9]+/gi;

// کلمات کلیدی مفید
const USEFUL_KEYWORDS_REGEX = /خیابان|خ\s|کوچه|ک\s|بلوار|ب\s|میدان|م\s|پلاک|پ\s|واحد|و\s|طبقه|ط\s|ساختمان|س\s|مجتمع|برج|آپارتمان|street|st\.|avenue|ave\.|alley|blvd|boulevard|building/gi;

// استان‌های ایران
const IRAN_PROVINCES_REGEX = /تهران|اصفهان|شیراز|مشهد|تبریز|کرج|اهواز|قم|رشت|کرمان|ارومیه|زاهدان|همدان|کرمانشاه|یزد|اردبیل|بندرعباس|زنجان|قزوین|سنندج|گرگان|ساری|بوشهر|سمنان|بیرجند/gi;

// الگوی بررسی تکرار زیاد
const REPETITIVE_CHARS_REGEX = /(.)\1{4,}/g;

// الگوی بررسی فاصله‌های متوالی
const MULTIPLE_SPACES_REGEX = /\s{2,}/g;

/**
 * اعتبارسنجی آدرس
 */
export function validateAddress(
  address: string,
  options: AddressValidationOptions = {}
): AddressValidationResult {
  const {
    minLength = 10,
    maxLength = 500,
    requireStreetNumber = false,
    requireUsefulKeywords = false
  } = options;
  
  // پاکسازی فاصله‌های اضافی
  const cleaned = address.trim().replace(/\s+/g, ' ');
  
  // بررسی خالی بودن
  if (!cleaned) {
    return { 
      isValid: false, 
      error: 'آدرس الزامی است' 
    };
  }
  
  // بررسی طول
  if (cleaned.length < minLength) {
    return { 
      isValid: false, 
      error: `آدرس خیلی کوتاه است. حداقل ${minLength} کاراکتر وارد کنید` 
    };
  }
  
  if (cleaned.length > maxLength) {
    return { 
      isValid: false, 
      error: `آدرس خیلی طولانی است. حداکثر ${maxLength} کاراکتر مجاز است` 
    };
  }
  
  // بررسی تکرار زیاد کاراکترها
  if (/(.)\1{4,}/.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'آدرس نامعتبر است (تکرار کاراکتر)' 
    };
  }
  
  // بررسی فقط عدد نباشد
  if (/^\d+$/.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'آدرس نمی‌تواند فقط عدد باشد' 
    };
  }
  
  // بررسی حداقل 3 کلمه داشته باشد
  const wordCount = cleaned.split(/\s+/).length;
  if (wordCount < 3) {
    return { 
      isValid: false, 
      error: 'آدرس باید شامل جزئیات بیشتری باشد' 
    };
  }
  
  const warnings: string[] = [];
  
  // بررسی وجود پلاک/شماره
  const hasStreetNumber = STREET_NUMBER_REGEX.test(cleaned);
  if (requireStreetNumber && !hasStreetNumber) {
    return {
      isValid: false,
      error: 'لطفاً شماره پلاک را در آدرس وارد کنید',
      hasStreetNumber: false
    };
  } else if (!hasStreetNumber) {
    warnings.push('توصیه می‌شود شماره پلاک را وارد کنید');
  }
  
  // بررسی کلمات کلیدی مفید
  const hasUsefulKeywords = USEFUL_KEYWORDS_REGEX.test(cleaned);
  if (requireUsefulKeywords && !hasUsefulKeywords) {
    return {
      isValid: false,
      error: 'آدرس باید شامل اطلاعات دقیق‌تری باشد (خیابان، کوچه، پلاک و ...)',
      hasUsefulKeywords: false
    };
  } else if (!hasUsefulKeywords) {
    warnings.push('آدرس می‌تواند دقیق‌تر باشد (مثلاً: خیابان، کوچه، پلاک)');
  }
  
  // بررسی طول کلمات
  const words = cleaned.split(/\s+/);
  const hasVeryShortWords = words.some(word => word.length === 1);
  if (hasVeryShortWords) {
    warnings.push('برخی کلمات خیلی کوتاه هستند');
  }
  
  return { 
    isValid: true, 
    cleaned,
    warnings: warnings.length > 0 ? warnings : undefined,
    hasStreetNumber,
    hasUsefulKeywords
  };
}

/**
 * بررسی سریع طول آدرس
 */
export function isAddressLengthValid(address: string, minLength = 10): boolean {
  return address.trim().length >= minLength;
}

/**
 * پیشنهاد بهبود آدرس
 */
export function suggestAddressImprovements(address: string): string[] {
  const suggestions: string[] = [];
  const cleaned = address.trim();
  
  if (cleaned.length < 20) {
    suggestions.push('آدرس را با جزئیات بیشتری وارد کنید');
  }
  
  if (!STREET_NUMBER_REGEX.test(cleaned)) {
    suggestions.push('شماره پلاک را اضافه کنید');
  }
  
  if (!USEFUL_KEYWORDS_REGEX.test(cleaned)) {
    suggestions.push('از کلماتی مثل خیابان، کوچه، پلاک استفاده کنید');
  }
  
  if (!/واحد|طبقه/.test(cleaned)) {
    suggestions.push('در صورت لزوم واحد و طبقه را مشخص کنید');
  }
  
  if (!/کد\s*پستی/.test(cleaned)) {
    suggestions.push('کد پستی را جداگانه وارد کنید');
  }
  
  return suggestions;
}

/**
 * استخراج اطلاعات از آدرس
 */
export function extractAddressInfo(address: string): {
  hasStreetNumber: boolean;
  hasFloorNumber: boolean;
  hasUnitNumber: boolean;
  hasUsefulKeywords: boolean;
  wordCount: number;
} {
  const cleaned = address.trim();
  
  return {
    hasStreetNumber: STREET_NUMBER_REGEX.test(cleaned),
    hasFloorNumber: /طبقه|floor/.test(cleaned),
    hasUnitNumber: /واحد|unit/.test(cleaned),
    hasUsefulKeywords: USEFUL_KEYWORDS_REGEX.test(cleaned),
    wordCount: cleaned.split(/\s+/).length
  };
}
