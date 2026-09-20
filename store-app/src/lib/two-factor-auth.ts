/**
 * Two-Factor Authentication (2FA) Implementation
 * برای امنیت بیشتر پنل ادمین
 */

import { randomBytes, createHash } from 'crypto';

export interface TwoFactorAuth {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * تولید secret برای Google Authenticator
 */
export function generateTwoFactorSecret(email: string): TwoFactorAuth {
  // تولید secret 32 کاراکتری
  const secret = randomBytes(20).toString('base64')
    .replace(/\+/g, '0')
    .replace(/\//g, '1')
    .substring(0, 32);

  // تولید QR code URL برای Google Authenticator
  const appName = 'StoreApp';
  const qrCode = `otpauth://totp/${appName}:${email}?secret=${secret}&issuer=${appName}`;

  // تولید backup codes (10 عدد)
  const backupCodes = Array.from({ length: 10 }, () => 
    randomBytes(4).toString('hex').toUpperCase()
  );

  return {
    secret,
    qrCode,
    backupCodes
  };
}

/**
 * تولید TOTP code (Time-based One-Time Password)
 */
export function generateTOTP(secret: string, timestamp?: number): string {
  const time = Math.floor((timestamp || Date.now()) / 30000);
  const timeHex = time.toString(16).padStart(16, '0');
  const timeBuffer = Buffer.from(timeHex, 'hex');
  
  // HMAC-SHA1
  const hmac = createHash('sha1')
    .update(Buffer.concat([Buffer.from(secret), timeBuffer]))
    .digest();
  
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
}

/**
 * تایید TOTP code
 */
export function verifyTOTP(secret: string, token: string): boolean {
  const now = Date.now();
  
  // بررسی 3 بازه زمانی (قبل، الان، بعد) برای جبران تاخیر
  for (let i = -1; i <= 1; i++) {
    const time = now + (i * 30000);
    const validToken = generateTOTP(secret, time);
    
    if (token === validToken) {
      return true;
    }
  }
  
  return false;
}

/**
 * تایید backup code
 */
export function verifyBackupCode(
  userBackupCodes: string[],
  inputCode: string
): { valid: boolean; remainingCodes: string[] } {
  const codeIndex = userBackupCodes.indexOf(inputCode.toUpperCase());
  
  if (codeIndex === -1) {
    return { valid: false, remainingCodes: userBackupCodes };
  }
  
  // حذف backup code استفاده شده
  const remainingCodes = [
    ...userBackupCodes.slice(0, codeIndex),
    ...userBackupCodes.slice(codeIndex + 1)
  ];
  
  return { valid: true, remainingCodes };
}

/**
 * Hash کردن backup codes برای ذخیره امن
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(code => 
    createHash('sha256').update(code).digest('hex')
  );
}
