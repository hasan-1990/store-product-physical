/**
 * اعتبارسنجی کد پستی ایران
 * 
 * کد پستی ایران: 10 رقمی
 * فرمت: XXXXX-XXXXX یا XXXXXXXXXX
 */

// ============================================
// Regex های پیشرفته برای کد پستی
// ============================================

// Regex برای کد پستی 10 رقمی (بدون خط تیره)
const IRAN_POSTAL_CODE_REGEX = /^[0-9]{10}$/;

// Regex برای کد پستی با خط تیره
const IRAN_POSTAL_CODE_WITH_DASH_REGEX = /^[0-9]{5}-[0-9]{5}$/;

// Regex بررسی ارقام یکسان (مثل 1111111111)
const ALL_SAME_DIGITS_REGEX = /^(\d)\1{9}$/;

// Regex بررسی ارقام متوالی (مثل 1234567890)
const SEQUENTIAL_DIGITS_REGEX = /^(0123456789|1234567890|9876543210)$/;

// کدهای استانی معتبر (رقم اول)
const VALID_PROVINCE_CODES = ['1', '3', '4', '5', '6', '7', '8', '9'];

// محدوده‌های معتبر برای 2 رقم اول
const VALID_TWO_DIGIT_RANGES = [
  { min: 11, max: 19 }, // تهران
  { min: 31, max: 39 }, // اصفهان
  { min: 41, max: 49 }, // کرمان
  { min: 51, max: 59 }, // گلستان
  { min: 61, max: 69 }, // لرستان
  { min: 71, max: 79 }, // بوشهر
  { min: 81, max: 89 }, // اردبیل
  { min: 91, max: 99 }  // فارس
];

export interface PostalCodeValidationResult {
  isValid: boolean;
  formatted?: string;
  error?: string;
  city?: string;
}

/**
 * اعتبارسنجی کد پستی ایرانی
 */
export function validateIranianPostalCode(postalCode: string): PostalCodeValidationResult {
  // پاکسازی: حذف فاصله‌ها و خط تیره‌ها
  const cleaned = postalCode.trim().replace(/[\s-]/g, '');
  
  // بررسی خالی بودن
  if (!cleaned) {
    return { 
      isValid: false, 
      error: 'کد پستی الزامی است' 
    };
  }
  
  // بررسی طول
  if (cleaned.length !== 10) {
    return { 
      isValid: false, 
      error: `کد پستی باید 10 رقم باشد (${cleaned.length} رقم وارد شده)` 
    };
  }
  
  // بررسی فقط عدد بودن
  if (!IRAN_POSTAL_CODE_REGEX.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'کد پستی فقط باید شامل اعداد باشد' 
    };
  }
  
  // بررسی همه ارقام یکسان
  if (ALL_SAME_DIGITS_REGEX.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'کد پستی نامعتبر است (ارقام تکراری)' 
    };
  }
  
  // بررسی ارقام متوالی
  if (SEQUENTIAL_DIGITS_REGEX.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'کد پستی نامعتبر است (ارقام متوالی)' 
    };
  }
  
  // بررسی رقم اول (باید از کدهای معتبر باشد)
  const firstDigit = cleaned.charAt(0);
  if (!VALID_PROVINCE_CODES.includes(firstDigit)) {
    return { 
      isValid: false, 
      error: 'کد استان نامعتبر است' 
    };
  }
  
  // بررسی 2 رقم اول (باید در محدوده معتبر باشد)
  const twoDigitCode = parseInt(cleaned.substring(0, 2));
  const isValidRange = VALID_TWO_DIGIT_RANGES.some(
    range => twoDigitCode >= range.min && twoDigitCode <= range.max
  );
  
  if (!isValidRange) {
    return { 
      isValid: false, 
      error: 'کد منطقه نامعتبر است' 
    };
  }
  
  // فرمت کردن با خط تیره
  const formatted = `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
  
  // تشخیص شهر بر اساس 2 رقم اول (اختیاری)
  const cityCode = cleaned.substring(0, 2);
  let city: string | undefined;
  
  const cityCodes: Record<string, string> = {
    '11': 'تهران',
    '13': 'گیلان',
    '14': 'مازندران',
    '15': 'آذربایجان شرقی',
    '16': 'آذربایجان غربی',
    '17': 'کرمانشاه',
    '18': 'خوزستان',
    '19': 'فارس',
    '31': 'اصفهان',
    '35': 'یزد',
    '38': 'چهارمحال و بختیاری',
    '41': 'کرمان',
    '44': 'سیستان و بلوچستان',
    '45': 'خراسان رضوی',
    '46': 'خراسان جنوبی',
    '47': 'خراسان شمالی',
    '51': 'گلستان',
    '58': 'سمنان',
    '61': 'قم',
    '63': 'مرکزی',
    '64': 'قزوین',
    '65': 'زنجان',
    '66': 'لرستان',
    '71': 'بوشهر',
    '74': 'کهگیلویه و بویراحمد',
    '75': 'هرمزگان',
    '76': 'همدان',
    '81': 'اردبیل',
    '83': 'ایلام',
    '84': 'کردستان',
    '86': 'البرز'
  };
  
  city = cityCodes[cityCode];
  
  return { 
    isValid: true, 
    formatted,
    city
  };
}

/**
 * فرمت کردن خودکار در حین تایپ
 * برای استفاده در input onChange
 */
export function formatPostalCodeInput(value: string): string {
  // حذف تمام کاراکترهای غیر عددی
  const cleaned = value.replace(/[^\d]/g, '');
  
  // محدود کردن به 10 رقم
  const limited = cleaned.substring(0, 10);
  
  // اگر کمتر از 6 رقم است، خط تیره نمی‌زنیم
  if (limited.length <= 5) {
    return limited;
  }
  
  // اضافه کردن خط تیره بعد از 5 رقم
  return `${limited.substring(0, 5)}-${limited.substring(5)}`;
}

/**
 * پاکسازی کد پستی
 * حذف فاصله‌ها و خط تیره‌ها
 */
export function cleanPostalCode(postalCode: string): string {
  return postalCode.replace(/[\s-]/g, '');
}

/**
 * بررسی سریع فرمت کد پستی
 */
export function isValidPostalCodeFormat(postalCode: string): boolean {
  const cleaned = cleanPostalCode(postalCode);
  return IRAN_POSTAL_CODE_REGEX.test(cleaned);
}
