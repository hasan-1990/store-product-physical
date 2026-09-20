import crypto from 'crypto';

/**
 * تولید License Key منحصر به فرد
 * فرمت: XXXX-XXXX-XXXX-XXXX (16 کاراکتر به صورت 4 بخش 4 کاراکتری)
 */
export function generateLicenseKey(): string {
  const segments = 4;
  const segmentLength = 4;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // بدون حروف مشابه (I, O, 0, 1)
  
  const key: string[] = [];
  
  for (let i = 0; i < segments; i++) {
    let segment = '';
    for (let j = 0; j < segmentLength; j++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      segment += chars[randomIndex];
    }
    key.push(segment);
  }
  
  return key.join('-');
}

/**
 * اعتبارسنجی فرمت License Key
 */
export function validateLicenseKeyFormat(key: string): boolean {
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(key);
}

/**
 * نرمال‌سازی دامنه (حذف www, http, https, /)
 */
export function normalizeDomain(domain: string): string {
  let normalized = domain.toLowerCase().trim();
  
  // حذف پروتکل
  normalized = normalized.replace(/^https?:\/\//, '');
  
  // حذف www
  normalized = normalized.replace(/^www\./, '');
  
  // حذف / در انتها
  normalized = normalized.replace(/\/$/, '');
  
  // حذف پورت (اختیاری)
  normalized = normalized.replace(/:\d+$/, '');
  
  // حذف path
  normalized = normalized.split('/')[0];
  
  return normalized;
}

/**
 * اعتبارسنجی فرمت دامنه
 */
export function validateDomainFormat(domain: string): boolean {
  const normalized = normalizeDomain(domain);
  
  // Pattern برای دامنه معتبر
  const pattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
  
  // یا localhost برای تست
  if (normalized === 'localhost' || normalized === '127.0.0.1') {
    return true;
  }
  
  return pattern.test(normalized);
}

/**
 * هش کردن دامنه + License Key برای امنیت بیشتر
 */
export function generateDomainHash(domain: string, licenseKey: string): string {
  const normalized = normalizeDomain(domain);
  const data = `${normalized}:${licenseKey}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * رمزنگاری داده با AES-256
 */
export function encryptData(data: string, secret: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(secret, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * رمزگشایی داده
 */
export function decryptData(encryptedData: string, secret: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(secret, 'salt', 32);
    
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('رمزگشایی ناموفق بود');
  }
}

/**
 * بررسی انقضای لایسنس
 */
export function isLicenseExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false; // بدون محدودیت زمانی
  
  const expireDate = new Date(expiresAt);
  const now = new Date();
  
  return now > expireDate;
}

/**
 * محاسبه روزهای باقی‌مانده تا انقضا
 */
export function getDaysUntilExpiry(expiresAt?: string | null): number | null {
  if (!expiresAt) return null;
  
  const expireDate = new Date(expiresAt);
  const now = new Date();
  
  const diffTime = expireDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * تولید توکن یکبار مصرف برای دانلود
 */
export function generateDownloadToken(licenseKey: string, productId: string): string {
  const timestamp = Date.now();
  const data = `${licenseKey}:${productId}:${timestamp}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  
  return `${hash}:${timestamp}`;
}

/**
 * اعتبارسنجی توکن دانلود (معتبر برای 1 ساعت)
 */
export function validateDownloadToken(
  token: string,
  licenseKey: string,
  productId: string
): boolean {
  try {
    const [hash, timestampStr] = token.split(':');
    const timestamp = parseInt(timestampStr);
    
    // چک زمان (1 ساعت)
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    if (now - timestamp > oneHour) {
      return false;
    }
    
    // چک هش
    const data = `${licenseKey}:${productId}:${timestamp}`;
    const expectedHash = crypto.createHash('sha256').update(data).digest('hex');
    
    return hash === expectedHash;
  } catch (error) {
    return false;
  }
}
