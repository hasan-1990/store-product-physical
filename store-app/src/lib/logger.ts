// src/lib/logger.ts
/**
 * Logging System - سیستم لاگ‌گیری پیشرفته
 * استفاده از winston برای لاگ‌گیری حرفه‌ای
 */

import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import path from 'path';
import fs from 'fs';

// مسیر لاگ‌ها
const LOG_DIR = path.join(process.cwd(), 'logs');

// ساخت پوشه logs اگر وجود ندارد
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// فرمت کاستوم برای لاگ‌ها
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json(),
  format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Logger اصلی
export const logger: WinstonLogger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // لاگ خطاها در فایل جداگانه
    new transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // لاگ warning ها
    new transports.File({
      filename: path.join(LOG_DIR, 'warnings.log'),
      level: 'warn',
      maxsize: 5242880,
      maxFiles: 3,
    }),
    
    // تمام لاگ‌ها
    new transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
  
  // جلوگیری از crash در صورت خطا در logging
  exitOnError: false,
});

// در development، لاگ‌ها رو در console هم نمایش بده
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

// ===== Security Event Loggers =====

/**
 * لاگ تلاش‌های ناموفق ورود
 */
export function logFailedLogin(email: string, ip: string, reason?: string): void {
  logger.warn('Failed login attempt', {
    event: 'FAILED_LOGIN',
    email,
    ip,
    reason: reason || 'Invalid credentials',
    timestamp: new Date().toISOString(),
    severity: 'medium'
  });
}

/**
 * لاگ ورود موفق
 */
export function logSuccessfulLogin(userId: string, email: string, ip: string): void {
  logger.info('Successful login', {
    event: 'LOGIN_SUCCESS',
    userId,
    email,
    ip,
    timestamp: new Date().toISOString()
  });
}

/**
 * لاگ خروج
 */
export function logLogout(userId: string, email: string): void {
  logger.info('User logout', {
    event: 'LOGOUT',
    userId,
    email,
    timestamp: new Date().toISOString()
  });
}

/**
 * لاگ تلاش‌های مشکوک
 */
export function logSuspiciousActivity(
  activityType: string,
  details: Record<string, any>,
  ip?: string,
  userId?: string
): void {
  logger.warn('Suspicious activity detected', {
    event: 'SUSPICIOUS_ACTIVITY',
    activityType,
    ip: ip || 'unknown',
    userId: userId || 'anonymous',
    details,
    timestamp: new Date().toISOString(),
    severity: 'high'
  });
}

/**
 * لاگ نقض امنیتی
 */
export function logSecurityViolation(
  violationType: string,
  details: Record<string, any>,
  ip: string,
  userId?: string
): void {
  logger.error('Security violation', {
    event: 'SECURITY_VIOLATION',
    violationType,
    ip,
    userId: userId || 'anonymous',
    details,
    timestamp: new Date().toISOString(),
    severity: 'critical',
    requiresAction: true
  });
}

/**
 * لاگ تغییرات مهم در سیستم
 */
export function logSystemChange(
  changeType: string,
  changedBy: string,
  details: Record<string, any>
): void {
  logger.info('System change', {
    event: 'SYSTEM_CHANGE',
    changeType,
    changedBy,
    details,
    timestamp: new Date().toISOString()
  });
}

/**
 * لاگ دسترسی به داده‌های حساس
 */
export function logSensitiveDataAccess(
  dataType: string,
  userId: string,
  action: 'read' | 'write' | 'delete',
  details?: Record<string, any>
): void {
  logger.info('Sensitive data access', {
    event: 'SENSITIVE_DATA_ACCESS',
    dataType,
    userId,
    action,
    details: details || {},
    timestamp: new Date().toISOString()
  });
}

/**
 * لاگ خطاهای API
 */
export function logAPIError(
  endpoint: string,
  method: string,
  error: Error,
  userId?: string,
  requestBody?: any
): void {
  logger.error('API Error', {
    event: 'API_ERROR',
    endpoint,
    method,
    error: {
      message: error.message,
      stack: error.stack
    },
    userId: userId || 'anonymous',
    requestBody: requestBody ? sanitizeLogData(requestBody) : undefined,
    timestamp: new Date().toISOString()
  });
}

/**
 * لاگ خطاهای دیتابیس
 */
export function logDatabaseError(
  operation: string,
  collection: string,
  error: Error,
  query?: any
): void {
  logger.error('Database Error', {
    event: 'DATABASE_ERROR',
    operation,
    collection,
    error: {
      message: error.message,
      stack: error.stack
    },
    query: query ? sanitizeLogData(query) : undefined,
    timestamp: new Date().toISOString()
  });
}

/**
 * لاگ Rate Limit Exceeded
 */
export function logRateLimitExceeded(
  ip: string,
  endpoint: string,
  attempts: number
): void {
  logger.warn('Rate limit exceeded', {
    event: 'RATE_LIMIT_EXCEEDED',
    ip,
    endpoint,
    attempts,
    timestamp: new Date().toISOString(),
    severity: 'medium'
  });
}

/**
 * لاگ File Upload
 */
export function logFileUpload(
  filename: string,
  size: number,
  mimeType: string,
  userId: string,
  success: boolean,
  error?: string
): void {
  const level = success ? 'info' : 'warn';
  
  logger.log(level, 'File upload', {
    event: 'FILE_UPLOAD',
    filename,
    size,
    mimeType,
    userId,
    success,
    error: error || undefined,
    timestamp: new Date().toISOString()
  });
}

/**
 * لاگ Payment Transaction
 */
export function logPaymentTransaction(
  orderId: string,
  userId: string,
  amount: number,
  status: 'pending' | 'success' | 'failed',
  gateway?: string,
  error?: string
): void {
  logger.info('Payment transaction', {
    event: 'PAYMENT_TRANSACTION',
    orderId,
    userId,
    amount,
    status,
    gateway: gateway || 'unknown',
    error: error || undefined,
    timestamp: new Date().toISOString(),
    sensitive: true
  });
}

/**
 * Sanitize داده‌ها قبل از لاگ کردن
 * حذف اطلاعات حساس مثل password, token, credit card
 */
function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'apiKey', 'api_key',
    'creditCard', 'credit_card', 'cvv', 'ssn',
    'authorization', 'cookie', 'session'
  ];
  
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * خواندن لاگ‌های اخیر
 */
export async function getRecentLogs(
  logType: 'error' | 'warn' | 'combined' = 'combined',
  lines: number = 100
): Promise<string[]> {
  const filename = path.join(LOG_DIR, `${logType}.log`);
  
  try {
    const content = await fs.promises.readFile(filename, 'utf-8');
    const allLines = content.split('\n').filter(line => line.trim());
    return allLines.slice(-lines);
  } catch (error) {
    logger.error('Error reading log file', { error, filename });
    return [];
  }
}

/**
 * آنالیز لاگ‌های امنیتی
 */
export interface SecurityLogStats {
  failedLogins: number;
  suspiciousActivities: number;
  securityViolations: number;
  rateLimitExceeded: number;
  topAttackers: Array<{ ip: string; count: number }>;
}

export async function analyzeSecurityLogs(hours: number = 24): Promise<SecurityLogStats> {
  const logs = await getRecentLogs('combined', 10000);
  const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
  
  const stats: SecurityLogStats = {
    failedLogins: 0,
    suspiciousActivities: 0,
    securityViolations: 0,
    rateLimitExceeded: 0,
    topAttackers: []
  };
  
  const ipCounts = new Map<string, number>();
  
  for (const line of logs) {
    try {
      const log = JSON.parse(line);
      const logTime = new Date(log.timestamp).getTime();
      
      if (logTime < cutoffTime) continue;
      
      if (log.event === 'FAILED_LOGIN') {
        stats.failedLogins++;
        const count = ipCounts.get(log.ip) || 0;
        ipCounts.set(log.ip, count + 1);
      } else if (log.event === 'SUSPICIOUS_ACTIVITY') {
        stats.suspiciousActivities++;
      } else if (log.event === 'SECURITY_VIOLATION') {
        stats.securityViolations++;
      } else if (log.event === 'RATE_LIMIT_EXCEEDED') {
        stats.rateLimitExceeded++;
        const count = ipCounts.get(log.ip) || 0;
        ipCounts.set(log.ip, count + 1);
      }
    } catch (error) {
      // Skip invalid JSON lines
    }
  }
  
  // Top 10 attackers
  stats.topAttackers = Array.from(ipCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));
  
  return stats;
}

/**
 * پاک کردن لاگ‌های قدیمی
 */
export async function cleanOldLogs(daysToKeep: number = 30): Promise<void> {
  const files = await fs.promises.readdir(LOG_DIR);
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  for (const file of files) {
    if (!file.endsWith('.log')) continue;
    
    const filePath = path.join(LOG_DIR, file);
    const stats = await fs.promises.stat(filePath);
    
    if (stats.mtime.getTime() < cutoffTime) {
      await fs.promises.unlink(filePath);
      logger.info('Deleted old log file', { file, age: daysToKeep });
    }
  }
}

// Export default logger
export default logger;
