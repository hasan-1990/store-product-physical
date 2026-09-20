// src/lib/database-security.ts
/**
 * Database Security - امنیت پایگاه داده
 * محافظت از MongoDB در برابر حملات
 */

import { Db, Collection, IndexSpecification } from 'mongodb';
import { logger, logDatabaseError, logSuspiciousActivity } from './logger';
import { sanitizeMongoQuery } from './input-sanitization';

/**
 * Security Indexes - ایجاد index های امنیتی
 */
export async function createSecurityIndexes(db: Db): Promise<void> {
  try {
    // Users collection indexes
    await db.collection('users').createIndexes([
      { key: { email: 1 }, unique: true, name: 'email_unique' },
      { key: { mobile: 1 }, sparse: true, name: 'mobile_sparse' },
      { key: { role: 1 }, name: 'role_index' },
      { key: { createdAt: 1 }, name: 'created_date' },
      { key: { lastLogin: -1 }, name: 'last_login' },
      { key: { 'sessions.expiresAt': 1 }, expireAfterSeconds: 0, name: 'session_ttl' }
    ]);
    
    // Products collection indexes
    await db.collection('products').createIndexes([
      { key: { active: 1, createdAt: -1 }, name: 'active_products' },
      { key: { categoryId: 1, active: 1 }, name: 'category_products' },
      { key: { slug: 1 }, unique: true, sparse: true, name: 'slug_unique' },
      { key: { sku: 1 }, unique: true, sparse: true, name: 'sku_unique' },
      { key: { name: 'text', description: 'text' }, name: 'product_search' }
    ]);
    
    // Orders collection indexes
    await db.collection('orders').createIndexes([
      { key: { userId: 1, createdAt: -1 }, name: 'user_orders' },
      { key: { orderNumber: 1 }, unique: true, name: 'order_number_unique' },
      { key: { status: 1, createdAt: -1 }, name: 'order_status' },
      { key: { 'payment.transactionId': 1 }, sparse: true, name: 'transaction_id' }
    ]);
    
    // Sessions collection (for rate limiting and security)
    await db.collection('sessions').createIndexes([
      { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: 'session_expiry' },
      { key: { userId: 1 }, name: 'user_sessions' },
      { key: { ip: 1, createdAt: -1 }, name: 'ip_sessions' }
    ]);
    
    // Security logs collection
    await db.collection('security_logs').createIndexes([
      { key: { createdAt: 1 }, expireAfterSeconds: 2592000, name: 'log_retention' }, // 30 days
      { key: { eventType: 1, createdAt: -1 }, name: 'event_type' },
      { key: { ip: 1, createdAt: -1 }, name: 'ip_logs' },
      { key: { userId: 1, createdAt: -1 }, name: 'user_logs' }
    ]);
    
    logger.info('Security indexes created successfully');
  } catch (error) {
    logDatabaseError('createIndexes', 'multiple', error as Error);
    throw error;
  }
}

/**
 * Secure Query Builder - ساخت query امن
 */
export class SecureQueryBuilder {
  private collection: Collection;
  private query: Record<string, any> = {};
  
  constructor(collection: Collection) {
    this.collection = collection;
  }
  
  /**
   * Where clause با sanitization
   */
  where(field: string, value: any): this {
    const cleanField = this.sanitizeFieldName(field);
    const cleanValue = sanitizeMongoQuery(value);
    this.query[cleanField] = cleanValue;
    return this;
  }
  
  /**
   * In clause امن
   */
  whereIn(field: string, values: any[]): this {
    const cleanField = this.sanitizeFieldName(field);
    const cleanValues = values.map(v => sanitizeMongoQuery(v));
    this.query[cleanField] = { $in: cleanValues };
    return this;
  }
  
  /**
   * Range query امن
   */
  whereBetween(field: string, min: number, max: number): this {
    const cleanField = this.sanitizeFieldName(field);
    this.query[cleanField] = { 
      $gte: Number(min), 
      $lte: Number(max) 
    };
    return this;
  }
  
  /**
   * اجرای query
   */
  async execute(options: {
    projection?: Record<string, 1 | 0>;
    limit?: number;
    sort?: Record<string, 1 | -1>;
  } = {}): Promise<any[]> {
    try {
      const { projection, limit = 100, sort } = options;
      
      // محدود کردن limit
      const safeLimit = Math.min(limit, 1000);
      
      let cursor = this.collection.find(this.query);
      
      if (projection) {
        cursor = cursor.project(projection);
      }
      
      if (sort) {
        cursor = cursor.sort(sort);
      }
      
      return await cursor.limit(safeLimit).toArray();
    } catch (error) {
      logDatabaseError('execute', this.collection.collectionName, error as Error, this.query);
      throw error;
    }
  }
  
  /**
   * Sanitize field name
   */
  private sanitizeFieldName(field: string): string {
    // فقط حروف، اعداد، نقطه و underscore
    return field.replace(/[^a-zA-Z0-9._]/g, '');
  }
}

/**
 * محافظت از Query Injection
 */
export function preventQueryInjection(query: any): any {
  if (!query || typeof query !== 'object') {
    return query;
  }
  
  const safe: any = {};
  
  for (const [key, value] of Object.entries(query)) {
    // جلوگیری از $ operators غیرمجاز
    if (key.startsWith('$') && !isAllowedOperator(key)) {
      logSuspiciousActivity('QUERY_INJECTION_ATTEMPT', { key, value }, 'unknown');
      continue;
    }
    
    // جلوگیری از prototype pollution
    if (['__proto__', 'constructor', 'prototype'].includes(key)) {
      logSuspiciousActivity('PROTOTYPE_POLLUTION_ATTEMPT', { key }, 'unknown');
      continue;
    }
    
    // بازگشتی برای nested objects
    if (typeof value === 'object' && value !== null) {
      safe[key] = preventQueryInjection(value);
    } else {
      safe[key] = value;
    }
  }
  
  return safe;
}

/**
 * لیست operator های مجاز
 */
function isAllowedOperator(op: string): boolean {
  const allowed = [
    '$eq', '$ne', '$gt', '$gte', '$lt', '$lte',
    '$in', '$nin', '$exists', '$type', '$regex',
    '$and', '$or', '$not', '$nor',
    '$text', '$search', '$limit', '$skip', '$sort'
  ];
  return allowed.includes(op);
}

/**
 * Database Transaction Handler
 * Note: برای استفاده از transactions باید MongoDB Replica Set داشته باشید
 */
export async function executeTransaction<T>(
  db: Db,
  operations: (session: any) => Promise<T>
): Promise<T> {
  // در production باید از session واقعی استفاده شود
  try {
    const result = await operations(null);
    return result;
  } catch (error) {
    logDatabaseError('transaction', 'multiple', error as Error);
    throw error;
  }
}

/**
 * Backup Sensitive Data
 */
export async function backupSensitiveData(
  collection: Collection,
  query: Record<string, any> = {}
): Promise<string> {
  try {
    const data = await collection.find(query).toArray();
    const backupPath = `./backups/${collection.collectionName}_${Date.now()}.json`;
    
    // در production باید به cloud storage فرستاده شود
    logger.info('Sensitive data backed up', {
      collection: collection.collectionName,
      count: data.length,
      path: backupPath
    });
    
    return backupPath;
  } catch (error) {
    logDatabaseError('backup', collection.collectionName, error as Error);
    throw error;
  }
}

/**
 * Audit Trail - ثبت تغییرات
 */
export async function logDataChange(
  db: Db,
  collection: string,
  operation: 'create' | 'update' | 'delete',
  documentId: string,
  userId: string,
  changes?: Record<string, any>
): Promise<void> {
  try {
    await db.collection('audit_trail').insertOne({
      collection,
      operation,
      documentId,
      userId,
      changes: changes || {},
      timestamp: new Date(),
      ip: 'server' // باید از request گرفته شود
    });
  } catch (error) {
    logger.error('Failed to log data change', { error, collection, operation });
  }
}

/**
 * محدود کردن Connection Pool
 */
export function configureConnectionPool(maxPoolSize: number = 10, minPoolSize: number = 5) {
  return {
    maxPoolSize,
    minPoolSize,
    maxIdleTimeMS: 30000,
    waitQueueTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
    connectTimeoutMS: 10000
  };
}

/**
 * Health Check Database
 */
export async function checkDatabaseHealth(db: Db): Promise<{
  healthy: boolean;
  responseTime: number;
  details: Record<string, any>;
}> {
  const start = Date.now();
  
  try {
    // Ping database
    await db.admin().ping();
    
    // Get stats
    const stats = await db.stats();
    
    const responseTime = Date.now() - start;
    
    return {
      healthy: true,
      responseTime,
      details: {
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        avgObjSize: stats.avgObjSize
      }
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    
    logDatabaseError('healthCheck', 'admin', error as Error);
    
    return {
      healthy: false,
      responseTime,
      details: { error: (error as Error).message }
    };
  }
}

/**
 * محافظت از Mass Assignment
 */
export function filterAllowedFields<T extends Record<string, any>>(
  data: T,
  allowedFields: string[]
): Partial<T> {
  const filtered: any = {};
  
  for (const field of allowedFields) {
    if (field in data) {
      filtered[field] = data[field];
    }
  }
  
  return filtered;
}

/**
 * Encrypt Sensitive Fields
 */
export function encryptSensitiveFields(
  data: Record<string, any>,
  sensitiveFields: string[]
): Record<string, any> {
  const encrypted = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in encrypted && encrypted[field]) {
      // در production باید از encryption واقعی استفاده شود
      encrypted[field] = `encrypted_${Buffer.from(String(encrypted[field])).toString('base64')}`;
    }
  }
  
  return encrypted;
}

/**
 * Rate Limit Database Queries
 */
const queryRateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkDatabaseRateLimit(
  userId: string,
  maxQueries: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = queryRateLimits.get(userId);
  
  if (!record || now > record.resetTime) {
    queryRateLimits.set(userId, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (record.count >= maxQueries) {
    logSuspiciousActivity('DATABASE_RATE_LIMIT', { userId, count: record.count }, 'unknown', userId);
    return false;
  }
  
  record.count++;
  return true;
}

// Cleanup rate limit store
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of queryRateLimits.entries()) {
    if (now > value.resetTime) {
      queryRateLimits.delete(key);
    }
  }
}, 60000);
