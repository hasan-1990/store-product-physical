import { cache } from './redis';

// Performance tracking
let globalStats = {
  cacheHits: 0,
  cacheMisses: 0,
  totalRequests: 0,
  responseTimes: [] as number[],
  lastUpdated: new Date()
};

// Cache key prefixes for different data types
export const CACHE_KEYS = {
  SETTINGS: 'settings:',
  ADMIN_SETTINGS: 'admin:settings:',
  CATEGORIES: 'categories:',
  PRODUCTS: 'products:',
  USERS: 'users:',
  ORDERS: 'orders:',
  REVIEWS: 'reviews:',
  SLIDERS: 'sliders:',
  HOMEPAGE_SECTIONS: 'homepage:sections:',
  SITE_HEADER: 'site:header:',
  WHYUS_SECTION: 'whyus:section:',
  CATEGORY_SECTION: 'category:section:',
  TREND_SETTINGS: 'trend:settings:',
  ANALYTICS: 'analytics:'
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  SETTINGS: 3600, // 1 hour
  ADMIN_DATA: 1800, // 30 minutes
  CATEGORIES: 1800, // 30 minutes
  PRODUCTS: 900, // 15 minutes
  USERS: 600, // 10 minutes
  ORDERS: 300, // 5 minutes
  ANALYTICS: 300, // 5 minutes
  HOMEPAGE: 1800, // 30 minutes
  MENU: 3600 // 1 hour
} as const;

export class CacheManager {
  // Generic cache operations
  static async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    try {
      console.log(`📋 Cache GET: ${key}`);
      globalStats.totalRequests++;
      
      const data = await cache.get<T>(key);
      const responseTime = Date.now() - startTime;
      globalStats.responseTimes.push(responseTime);
      
      if (data) {
        console.log(`✅ Cache HIT: ${key} (${responseTime}ms)`);
        globalStats.cacheHits++;
      } else {
        console.log(`❌ Cache MISS: ${key} (${responseTime}ms)`);
        globalStats.cacheMisses++;
      }
      
      globalStats.lastUpdated = new Date();
      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      globalStats.responseTimes.push(responseTime);
      globalStats.cacheMisses++;
      console.error(`💥 Cache GET error for ${key}:`, error);
      return null;
    }
  }

  static async set<T>(key: string, data: T, ttl: number = CACHE_TTL.ADMIN_DATA): Promise<void> {
    try {
      console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
      await cache.set(key, data, ttl);
      console.log(`✅ Cache SET success: ${key}`);
    } catch (error) {
      console.error(`💥 Cache SET error for ${key}:`, error);
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      console.log(`🗑️ Cache DELETE: ${key}`);
      await cache.del(key);
      console.log(`✅ Cache DELETE success: ${key}`);
    } catch (error) {
      console.error(`💥 Cache DELETE error for ${key}:`, error);
    }
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      console.log(`🧹 Cache CLEAR pattern: ${pattern}`);
      await cache.clear(pattern);
      console.log(`✅ Cache CLEAR success: ${pattern}`);
    } catch (error) {
      console.error(`💥 Cache CLEAR error for ${pattern}:`, error);
    }
  }

  // Specific cache operations for admin settings
  static async getSettings(type: string): Promise<any | null> {
    const key = `${CACHE_KEYS.ADMIN_SETTINGS}${type}`;
    return this.get(key);
  }

  static async setSettings(type: string, data: any): Promise<void> {
    const key = `${CACHE_KEYS.ADMIN_SETTINGS}${type}`;
    await this.set(key, data, CACHE_TTL.SETTINGS);
  }

  static async invalidateSettings(type: string): Promise<void> {
    const key = `${CACHE_KEYS.ADMIN_SETTINGS}${type}`;
    await this.delete(key);
  }

  // Categories cache
  static async getCategories(): Promise<any[] | null> {
    return this.get(`${CACHE_KEYS.CATEGORIES}all`);
  }

  static async setCategories(categories: any[]): Promise<void> {
    await this.set(`${CACHE_KEYS.CATEGORIES}all`, categories, CACHE_TTL.CATEGORIES);
  }

  static async invalidateCategories(): Promise<void> {
    await this.invalidatePattern(`${CACHE_KEYS.CATEGORIES}*`);
  }

  // Sliders cache
  static async getSliders(): Promise<any[] | null> {
    return this.get(`${CACHE_KEYS.SLIDERS}all`);
  }

  static async setSliders(sliders: any[]): Promise<void> {
    await this.set(`${CACHE_KEYS.SLIDERS}all`, sliders, CACHE_TTL.HOMEPAGE);
  }

  static async getSlider(id: string): Promise<any | null> {
    return this.get(`${CACHE_KEYS.SLIDERS}${id}`);
  }

  static async setSlider(id: string, slider: any): Promise<void> {
    await this.set(`${CACHE_KEYS.SLIDERS}${id}`, slider, CACHE_TTL.HOMEPAGE);
  }

  static async invalidateSliders(): Promise<void> {
    await this.invalidatePattern(`${CACHE_KEYS.SLIDERS}*`);
  }

  // Homepage sections cache
  static async getHomepageSections(): Promise<any[] | null> {
    return this.get(`${CACHE_KEYS.HOMEPAGE_SECTIONS}all`);
  }

  static async setHomepageSections(sections: any[]): Promise<void> {
    await this.set(`${CACHE_KEYS.HOMEPAGE_SECTIONS}all`, sections, CACHE_TTL.HOMEPAGE);
  }

  static async invalidateHomepageSections(): Promise<void> {
    await this.invalidatePattern(`${CACHE_KEYS.HOMEPAGE_SECTIONS}*`);
  }

  // Users cache
  static async getUsers(): Promise<any[] | null> {
    return this.get(`${CACHE_KEYS.USERS}all`);
  }

  static async setUsers(users: any[]): Promise<void> {
    await this.set(`${CACHE_KEYS.USERS}all`, users, CACHE_TTL.USERS);
  }

  static async getUser(id: string): Promise<any | null> {
    return this.get(`${CACHE_KEYS.USERS}${id}`);
  }

  static async setUser(id: string, user: any): Promise<void> {
    await this.set(`${CACHE_KEYS.USERS}${id}`, user, CACHE_TTL.USERS);
  }

  static async invalidateUsers(): Promise<void> {
    await this.invalidatePattern(`${CACHE_KEYS.USERS}*`);
  }

  // Orders cache
  static async getOrders(): Promise<any[] | null> {
    return this.get(`${CACHE_KEYS.ORDERS}all`);
  }

  static async setOrders(orders: any[]): Promise<void> {
    await this.set(`${CACHE_KEYS.ORDERS}all`, orders, CACHE_TTL.ORDERS);
  }

  static async invalidateOrders(): Promise<void> {
    await this.invalidatePattern(`${CACHE_KEYS.ORDERS}*`);
  }

  // Reviews cache
  static async invalidateReviews(): Promise<void> {
    await this.invalidatePattern(`${CACHE_KEYS.REVIEWS}*`);
  }

  // Analytics cache
  static async getAnalytics(type: string): Promise<any | null> {
    return this.get(`${CACHE_KEYS.ANALYTICS}${type}`);
  }

  static async setAnalytics(type: string, data: any): Promise<void> {
    await this.set(`${CACHE_KEYS.ANALYTICS}${type}`, data, CACHE_TTL.ANALYTICS);
  }

  static async invalidateAnalytics(): Promise<void> {
    await this.invalidatePattern(`${CACHE_KEYS.ANALYTICS}*`);
  }

  // Cache warming - preload important data
  static async warmCache(): Promise<void> {
    console.log('🔥 Starting cache warming...');
    try {
      const { connectDB } = await import('./mongodb');
      const mongodb = await connectDB();

      let warmedKeys = 0;

      // 1. Warm products cache
      try {
        const products = await mongodb.products
          .find({ active: true })
          .limit(50)
          .sort({ createdAt: -1 })
          .toArray();
        
        if (products.length > 0) {
          const cacheKey = `${CACHE_KEYS.PRODUCTS}list:1:50:::null:null:null:null:createdAt:desc:null`;
          await this.set(cacheKey, { success: true, data: products, total: products.length }, CACHE_TTL.PRODUCTS);
          warmedKeys++;
          console.log('✅ Products cache warmed');
        }
      } catch (error) {
        console.error('❌ Error warming products cache:', error);
      }

      // 2. Warm categories cache
      try {
        const categories = await mongodb.categories
          .find({ active: true })
          .limit(50)
          .toArray();
        
        if (categories.length > 0) {
          const cacheKey = `${CACHE_KEYS.CATEGORIES}list:1:50::null:null`;
          await this.set(cacheKey, { success: true, data: categories, total: categories.length }, CACHE_TTL.CATEGORIES);
          warmedKeys++;
          console.log('✅ Categories cache warmed');
        }
      } catch (error) {
        console.error('❌ Error warming categories cache:', error);
      }

      // 3. Warm sliders cache
      try {
        const sliders = await mongodb.heroSliders
          .find({ active: true })
          .sort({ order: 1 })
          .toArray();
        
        if (sliders.length > 0) {
          await this.setSliders(sliders);
          warmedKeys++;
          console.log('✅ Sliders cache warmed');
        }
      } catch (error) {
        console.error('❌ Error warming sliders cache:', error);
      }

      // 4. Warm blog posts cache
      try {
        const blogPosts = await mongodb.blogPosts
          .find({ published: true })
          .limit(20)
          .sort({ createdAt: -1 })
          .toArray();
        
        if (blogPosts.length > 0) {
          const cacheKey = 'blog:posts:list:1:20::null:null:recent';
          await this.set(cacheKey, { success: true, data: blogPosts, total: blogPosts.length }, CACHE_TTL.HOMEPAGE);
          warmedKeys++;
          console.log('✅ Blog posts cache warmed');
        }
      } catch (error) {
        console.error('❌ Error warming blog posts cache:', error);
      }

      console.log(`🎉 Cache warming completed: ${warmedKeys} caches warmed`);
    } catch (error) {
      console.error('💥 Cache warming failed:', error);
    }
  }

  // Get performance statistics
  static getPerformanceStats() {
    const avgResponseTime = globalStats.responseTimes.length > 0
      ? Math.round(globalStats.responseTimes.reduce((a, b) => a + b, 0) / globalStats.responseTimes.length)
      : 0;
      
    return {
      cacheHits: globalStats.cacheHits,
      cacheMisses: globalStats.cacheMisses,
      totalRequests: globalStats.totalRequests,
      avgResponseTime,
      cacheHitRate: globalStats.totalRequests > 0 
        ? ((globalStats.cacheHits / globalStats.totalRequests) * 100).toFixed(1)
        : '0.0',
      lastUpdated: globalStats.lastUpdated.toISOString()
    };
  }

  // Reset performance statistics
  static resetPerformanceStats() {
    globalStats = {
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      responseTimes: [],
      lastUpdated: new Date()
    };
  }

  // Clear all admin caches
  static async clearAllAdminCache(): Promise<void> {
    console.log('🧹 Clearing all admin caches...');
    await Promise.all([
      this.invalidatePattern(`${CACHE_KEYS.ADMIN_SETTINGS}*`),
      this.invalidatePattern(`${CACHE_KEYS.CATEGORIES}*`),
      this.invalidatePattern(`${CACHE_KEYS.PRODUCTS}*`),
      this.invalidatePattern(`${CACHE_KEYS.SLIDERS}*`),
      this.invalidatePattern(`${CACHE_KEYS.HOMEPAGE_SECTIONS}*`),
      this.invalidatePattern(`${CACHE_KEYS.USERS}*`),
      this.invalidatePattern(`${CACHE_KEYS.ORDERS}*`),
      this.invalidatePattern(`${CACHE_KEYS.REVIEWS}*`),
      this.invalidatePattern(`${CACHE_KEYS.ANALYTICS}*`)
    ]);
    console.log('✅ All admin caches cleared');
  }
}

// Helper function to create cache-enabled API handler
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.ADMIN_DATA
) {
  return async (): Promise<T> => {
    // Try to get from cache first
    let data = await CacheManager.get<T>(key);
    
    if (data === null) {
      // Cache miss - fetch from database
      console.log(`🔄 Fetching fresh data for: ${key}`);
      data = await fetcher();
      
      // Store in cache for next time
      await CacheManager.set(key, data, ttl);
    }
    
    return data;
  };
}
