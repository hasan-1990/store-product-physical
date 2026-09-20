// src/lib/file-upload-security.ts
/**
 * File Upload Security - اعتبارسنجی کامل فایل‌های آپلود شده
 * جلوگیری از آپلود فایل‌های مخرب و shell scripts
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

export interface FileValidationOptions {
  maxSize?: number; // به بایت
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  checkMagicNumbers?: boolean;
}

/**
 * Magic Numbers (File Signatures) برای انواع فایل
 */
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF, 0xE0], // JPEG JFIF
    [0xFF, 0xD8, 0xFF, 0xE1], // JPEG Exif
    [0xFF, 0xD8, 0xFF, 0xE2], // JPEG
    [0xFF, 0xD8, 0xFF, 0xE3], // JPEG
    [0xFF, 0xD8, 0xFF, 0xE8], // JPEG
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] // PNG
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46] // RIFF (WebP starts with RIFF)
  ],
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46] // %PDF
  ]
};

/**
 * بررسی Magic Numbers فایل
 */
function checkMagicNumbers(buffer: ArrayBuffer, mimeType: string): boolean {
  const uint8Array = new Uint8Array(buffer);
  const signatures = FILE_SIGNATURES[mimeType];
  
  if (!signatures) {
    console.warn(`⚠️ No magic number signature found for MIME type: ${mimeType}`);
    return true; // اگر signature نداریم، فقط MIME type رو قبول می‌کنیم
  }
  
  // چک کردن هر signature
  for (const signature of signatures) {
    let matches = true;
    for (let i = 0; i < signature.length; i++) {
      if (uint8Array[i] !== signature[i]) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }
  
  return false;
}

/**
 * Sanitize نام فایل
 */
export function sanitizeFileName(filename: string): string {
  // حذف کاراکترهای خطرناک
  let sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // فقط حروف، اعداد، نقطه، خط تیره و underscore
    .replace(/\.{2,}/g, '.') // حذف دو نقطه متوالی (..)
    .replace(/^\.+/, '') // حذف نقطه از ابتدا
    .replace(/\.+$/, ''); // حذف نقطه از انتها
  
  // محدود کردن طول نام
  if (sanitized.length > 100) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, 100 - (ext?.length || 0) - 1);
    sanitized = ext ? `${name}.${ext}` : name;
  }
  
  // اضافه کردن timestamp برای unique بودن
  const timestamp = Date.now();
  const parts = sanitized.split('.');
  const extension = parts.pop();
  const baseName = parts.join('.');
  
  return `${baseName}_${timestamp}.${extension}`;
}

/**
 * بررسی extension خطرناک
 */
function isDangerousExtension(extension: string): boolean {
  const dangerous = [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
    'sh', 'bash', 'csh', 'fish', 'ksh', 'tcsh', 'zsh',
    'app', 'deb', 'pkg', 'rpm',
    'dll', 'so', 'dylib',
    'php', 'php3', 'php4', 'php5', 'phtml',
    'asp', 'aspx', 'jsp', 'jspx',
    'py', 'rb', 'pl', 'cgi'
  ];
  
  return dangerous.includes(extension.toLowerCase());
}

/**
 * اعتبارسنجی کامل فایل
 */
export async function validateFile(
  file: File,
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    checkMagicNumbers: shouldCheckMagic = true
  } = options;
  
  // 1. بررسی وجود فایل
  if (!file) {
    return { valid: false, error: 'فایلی انتخاب نشده است' };
  }
  
  // 2. بررسی نام فایل
  if (!file.name || file.name.length === 0) {
    return { valid: false, error: 'نام فایل نامعتبر است' };
  }
  
  // 3. بررسی حجم فایل
  if (file.size === 0) {
    return { valid: false, error: 'فایل خالی است' };
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `حجم فایل نباید بیشتر از ${maxSizeMB}MB باشد`
    };
  }
  
  // 4. بررسی extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (!extension) {
    return { valid: false, error: 'فایل باید پسوند داشته باشد' };
  }
  
  if (isDangerousExtension(extension)) {
    return {
      valid: false,
      error: 'این نوع فایل به دلایل امنیتی مجاز نیست'
    };
  }
  
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `فقط فایل‌های با فرمت ${allowedExtensions.join(', ')} مجاز هستند`
    };
  }
  
  // 5. بررسی MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'نوع فایل مجاز نیست'
    };
  }
  
  // 6. بررسی Magic Numbers (File Signature)
  if (shouldCheckMagic) {
    try {
      // خواندن اولین 16 بایت فایل
      const buffer = await file.slice(0, 16).arrayBuffer();
      
      if (!checkMagicNumbers(buffer, file.type)) {
        return {
          valid: false,
          error: 'فایل واقعی با نوع اعلام شده مطابقت ندارد'
        };
      }
    } catch (error) {
      console.error('❌ Error checking magic numbers:', error);
      return {
        valid: false,
        error: 'خطا در بررسی فایل'
      };
    }
  }
  
  // 7. Sanitize نام فایل
  const sanitizedName = sanitizeFileName(file.name);
  
  // ✅ فایل معتبر است
  return {
    valid: true,
    sanitizedName
  };
}

/**
 * اعتبارسنجی چندین فایل
 */
export async function validateFiles(
  files: File[],
  options: FileValidationOptions = {}
): Promise<{ valid: boolean; results: FileValidationResult[]; errors: string[] }> {
  const results: FileValidationResult[] = [];
  const errors: string[] = [];
  
  for (const file of files) {
    const result = await validateFile(file, options);
    results.push(result);
    
    if (!result.valid && result.error) {
      errors.push(`${file.name}: ${result.error}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    results,
    errors
  };
}

/**
 * بررسی اینکه آیا فایل image واقعی است
 */
export async function isValidImage(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      // بررسی ابعاد معقول
      if (img.width > 0 && img.height > 0 && img.width <= 10000 && img.height <= 10000) {
        resolve(true);
      } else {
        resolve(false);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    
    img.src = url;
    
    // Timeout بعد از 5 ثانیه
    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve(false);
    }, 5000);
  });
}

/**
 * گزینه‌های پیش‌فرض برای انواع مختلف فایل
 */
export const FILE_VALIDATION_PRESETS = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    checkMagicNumbers: true
  },
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    checkMagicNumbers: true
  },
  productImage: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    checkMagicNumbers: true
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['application/pdf'],
    allowedExtensions: ['pdf'],
    checkMagicNumbers: true
  }
};

/**
 * لاگ کردن تلاش‌های آپلود مشکوک
 */
export function logSuspiciousUpload(
  filename: string,
  reason: string,
  ip?: string,
  userId?: string
): void {
  const log = {
    timestamp: new Date().toISOString(),
    filename,
    reason,
    ip: ip || 'unknown',
    userId: userId || 'anonymous',
    severity: 'warning'
  };
  
  console.warn('🚨 Suspicious file upload attempt:', log);
  
  // در production باید این رو به یک logging service بفرستید
  // مثلاً: logToSentry(log) یا logToCloudWatch(log)
}
