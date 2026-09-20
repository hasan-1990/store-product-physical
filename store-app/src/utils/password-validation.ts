/**
 * اعتبارسنجی رمز عبور
 * 
 * بررسی:
 * - طول
 * - حروف بزرگ و کوچک
 * - اعداد
 * - کاراکترهای خاص
 * - رمزهای رایج
 */

export interface PasswordStrength {
  score: number; // 0-100
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
  color: string;
  percentage: number;
}

export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  checkCommonPasswords?: boolean;
  allowPersian?: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  strength?: PasswordStrength;
  error?: string;
}

// رمزهای عبور رایج (TOP 100)
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey',
  '1234567', 'letmein', 'trustno1', 'dragon', 'baseball', '111111',
  'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
  'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael',
  'football', 'welcome', 'jesus', 'ninja', 'mustang', 'password1',
  '123456789', 'adobe123', 'admin', 'test', '1234', 'qwerty123',
  '123qwe', '1q2w3e4r', 'welcome123', 'aa123456', 'abc123456',
  'admin123', 'root', 'toor', '000000', '666666', '696969'
];

/**
 * اعتبارسنجی رمز عبور
 */
export function validatePassword(
  password: string,
  options: PasswordValidationOptions = {}
): PasswordValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    checkCommonPasswords = true,
    allowPersian = false
  } = options;
  
  // بررسی خالی بودن
  if (!password) {
    return { 
      isValid: false, 
      error: 'رمز عبور الزامی است' 
    };
  }
  
  const feedback: string[] = [];
  let score = 0;
  
  // بررسی طول
  if (password.length < minLength) {
    return { 
      isValid: false, 
      error: `رمز عبور باید حداقل ${minLength} کاراکتر باشد` 
    };
  }
  
  // امتیاز برای طول (حداکثر 30 امتیاز)
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // بررسی حروف بزرگ انگلیسی
  const hasUppercase = /[A-Z]/.test(password);
  if (requireUppercase && !hasUppercase) {
    feedback.push('حداقل یک حرف بزرگ انگلیسی (A-Z)');
  }
  if (hasUppercase) score += 15;
  
  // بررسی حروف کوچک انگلیسی
  const hasLowercase = /[a-z]/.test(password);
  if (requireLowercase && !hasLowercase) {
    feedback.push('حداقل یک حرف کوچک انگلیسی (a-z)');
  }
  if (hasLowercase) score += 15;
  
  // بررسی اعداد
  const hasNumbers = /[0-9]/.test(password);
  if (requireNumbers && !hasNumbers) {
    feedback.push('حداقل یک عدد (0-9)');
  }
  if (hasNumbers) score += 15;
  
  // بررسی کاراکترهای خاص
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (requireSpecialChars && !hasSpecialChars) {
    feedback.push('حداقل یک کاراکتر خاص (!@#$%^&*)');
  }
  if (hasSpecialChars) score += 20;
  
  // بررسی حروف فارسی
  const hasPersian = /[\u0600-\u06FF]/.test(password);
  if (!allowPersian && hasPersian) {
    return {
      isValid: false,
      error: 'رمز عبور نباید شامل حروف فارسی باشد'
    };
  }
  
  // بررسی رمزهای رایج
  if (checkCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
      return { 
        isValid: false, 
        error: 'این رمز عبور خیلی ساده و رایج است. لطفاً رمز دیگری انتخاب کنید' 
      };
    }
  }
  
  // بررسی الگوهای ساده
  if (/^[a-z]+$/i.test(password)) {
    feedback.push('رمز عبور فقط از حروف تشکیل شده (ضعیف است)');
    score -= 10;
  }
  
  if (/^[0-9]+$/.test(password)) {
    return {
      isValid: false,
      error: 'رمز عبور نمی‌تواند فقط عدد باشد'
    };
  }
  
  // بررسی تکرار کاراکترها
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('از تکرار کاراکترها خودداری کنید');
    score -= 10;
  }
  
  // بررسی ترتیب متوالی
  if (/(abc|bcd|cde|def|123|234|345|456|567|678|789)/i.test(password)) {
    feedback.push('از دنباله‌های متوالی خودداری کنید');
    score -= 10;
  }
  
  // بررسی کیبورد پترن
  if (/(qwerty|asdfgh|zxcvbn|qazwsx)/i.test(password)) {
    feedback.push('از الگوهای کیبوردی خودداری کنید');
    score -= 10;
  }
  
  // امتیاز اضافی برای تنوع کاراکترها
  const charTypes = [hasUppercase, hasLowercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
  score += charTypes * 5;
  
  // محدود کردن امتیاز به 100
  score = Math.max(0, Math.min(100, score));
  
  // تعیین سطح قدرت
  let level: PasswordStrength['level'];
  let color: string;
  
  if (score < 20) {
    level = 'very-weak';
    color = '#f56565'; // قرمز
  } else if (score < 40) {
    level = 'weak';
    color = '#ed8936'; // نارنجی
  } else if (score < 60) {
    level = 'fair';
    color = '#ecc94b'; // زرد
  } else if (score < 80) {
    level = 'good';
    color = '#48bb78'; // سبز
  } else if (score < 95) {
    level = 'strong';
    color = '#38a169'; // سبز تیره
  } else {
    level = 'very-strong';
    color = '#2f855a'; // سبز خیلی تیره
  }
  
  const strength: PasswordStrength = {
    score,
    level,
    feedback,
    color,
    percentage: score
  };
  
  // اگر نیازمندی‌های اجباری برآورده نشده
  if (feedback.length > 0) {
    return { 
      isValid: false, 
      strength,
      error: `رمز عبور باید شامل موارد زیر باشد: ${feedback.join(', ')}` 
    };
  }
  
  return { 
    isValid: true, 
    strength 
  };
}

/**
 * دریافت متن فارسی سطح قدرت
 */
export function getStrengthLabel(level: PasswordStrength['level']): string {
  const labels: Record<PasswordStrength['level'], string> = {
    'very-weak': 'خیلی ضعیف',
    'weak': 'ضعیف',
    'fair': 'متوسط',
    'good': 'خوب',
    'strong': 'قوی',
    'very-strong': 'خیلی قوی'
  };
  
  return labels[level];
}

/**
 * بررسی سریع قدرت رمز عبور
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const result = validatePassword(password, {
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false,
    checkCommonPasswords: true
  });
  
  return result.strength || {
    score: 0,
    level: 'very-weak',
    feedback: ['رمز عبور خالی است'],
    color: '#f56565',
    percentage: 0
  };
}

/**
 * تولید رمز عبور قوی
 */
export function generateStrongPassword(length = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const all = uppercase + lowercase + numbers + special;
  let password = '';
  
  // حداقل یکی از هر نوع
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // بقیه تصادفی
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // شافل کردن
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
