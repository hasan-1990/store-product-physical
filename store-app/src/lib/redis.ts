// Redis Cache Manager with Memory Fallback
let redis: any = null;
let runtimeRedisEnabled = process.env.REDIS_ENABLED === 'true';

class MemoryCache {
  private cache = new Map<string, { value: string; expiry: number }>();
  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
  async set(key: string, value: string, ttl: number): Promise<void> {
    const expiry = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiry });
  }
  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }
  async clear(): Promise<void> {
    this.cache.clear();
  }
  async ping(): Promise<string> {
    return 'PONG';
  }
}

const memoryCache = new MemoryCache();
function initializeRedis() {
  if (!runtimeRedisEnabled) {
    console.log('⚠️ Redis disabled by REDIS_ENABLED=false, using in-memory cache');
    return memoryCache;
  }
  try {
    console.log('🔌 Initializing Redis connection...');
    const Redis = require('ioredis');
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redisPassword = process.env.REDIS_PASSWORD;
    
    console.log(`🔧 Redis config: ${redisHost}:${redisPort}, Password: ${redisPassword ? '✓' : '✗'}`);
    
    redis = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      connectTimeout: 10000, // 10 seconds
      commandTimeout: 5000,  // 5 seconds per command
      enableOfflineQueue: true,
      retryStrategy(times: number) {
        console.log(`🔄 Redis retry attempt ${times}/3`);
        if (times > 3) {
          console.error('❌ Redis max retries reached, falling back to memory cache');
          return null;
        }
        return Math.min(times * 100, 2000);
      }
    });
    
    redis.on('connect', () => console.log('✅ Redis connected successfully'));
    redis.on('ready', () => console.log('✅ Redis ready to accept commands'));
    redis.on('error', (err: any) => {
      console.error('❌ Redis connection error:', err.message);
      // Don't throw, let it fall back to memory cache
    });
    redis.on('close', () => console.log('⚠️ Redis connection closed'));
    redis.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));
    
    return redis;
  } catch (error: any) {
    console.error('❌ Redis initialization failed:', error.message);
    return memoryCache;
  }
}

function getRedisInstance() {
  if (!redis) {
    redis = initializeRedis();
  }
  return redis;
}

// Initialize Redis immediately on module load
console.log('📦 Redis module loading...');
redis = initializeRedis();

export const cache = {
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await getRedisInstance().get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error: any) {
      console.error('Cache get error:', key, error.message);
      return null;
    }
  },
  async set(key: string, data: any, ttl: number = 300): Promise<void> {
    try {
      const value = typeof data === 'string' ? data : JSON.stringify(data);
      await getRedisInstance().set(key, value, 'EX', ttl);
    } catch (error: any) {
      console.error('Cache set error:', key, error.message);
    }
  },
  async del(key: string): Promise<void> {
    try {
      await getRedisInstance().del(key);
    } catch (error: any) {
      console.error('Cache del error:', key, error.message);
    }
  },
  async keys(pattern: string = '*'): Promise<string[]> {
    try {
      return await getRedisInstance().keys(pattern) || [];
    } catch (error: any) {
      return [];
    }
  },
  async clear(pattern?: string): Promise<number> {
    try {
      const instance = getRedisInstance();
      if (pattern) {
        const keys = await instance.keys(pattern);
        if (keys.length > 0) {
          await instance.del(...keys);
          return keys.length;
        }
        return 0;
      }
      await instance.flushall();
      return 1;
    } catch (error: any) {
      return 0;
    }
  },
  async ping(): Promise<string> {
    try {
      return await getRedisInstance().ping();
    } catch (error: any) {
      return 'ERROR';
    }
  }
};

export function setRedisEnabled(enabled: boolean): void {
  runtimeRedisEnabled = enabled;
}

export function isRedisEnabled(): boolean {
  return runtimeRedisEnabled;
}

export function getRedisConnectionConfig() {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  };
}

export interface RedisProbeResult {
  connected: boolean;
  host: string;
  port: number;
  keys: string[];
  error?: string;
}

/** Quick Redis health check with timeout — avoids hanging admin APIs */
export async function probeRedisConnection(timeoutMs = 2500): Promise<RedisProbeResult> {
  const { host, port, password } = getRedisConnectionConfig();

  if (process.env.REDIS_ENABLED !== 'true') {
    return {
      connected: false,
      host,
      port,
      keys: [],
      error: 'REDIS_ENABLED=false',
    };
  }

  let client: { connect: () => Promise<void>; ping: () => Promise<string>; keys: (pattern: string) => Promise<string[]>; disconnect: () => void } | null = null;

  try {
    const Redis = require('ioredis');
    const redisInstance = new Redis({
      host,
      port,
      password,
      lazyConnect: true,
      connectTimeout: timeoutMs,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    client = redisInstance;

    await Promise.race([
      redisInstance.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`اتصال Redis پس از ${timeoutMs}ms timeout شد`)), timeoutMs)
      ),
    ]);

    const pong = await Promise.race([
      redisInstance.ping(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PING timeout')), timeoutMs)
      ),
    ]);

    if (pong !== 'PONG') {
      return { connected: false, host, port, keys: [], error: `پاسخ غیرمنتظره: ${pong}` };
    }

    const keys = await redisInstance.keys('*');
    return { connected: true, host, port, keys };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'اتصال Redis ناموفق بود';
    return { connected: false, host, port, keys: [], error: message };
  } finally {
    try {
      client?.disconnect();
    } catch {
      // ignore disconnect errors
    }
  }
}

export { redis };
export default cache;
