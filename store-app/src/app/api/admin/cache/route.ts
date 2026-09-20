import { NextRequest, NextResponse } from 'next/server';
import {
  cache,
  setRedisEnabled,
  isRedisEnabled,
  probeRedisConnection,
  getRedisConnectionConfig,
} from '@/lib/redis';
import { CacheManager } from '@/lib/cache-manager';

// GET /api/admin/cache - Get cache status and statistics
export async function GET() {
  try {
    const redisConfig = getRedisConnectionConfig();
    const probe = await probeRedisConnection(2500);

    const isRedisConnected = probe.connected;
    const cacheType = isRedisConnected ? 'redis' : 'memory';
    const connectionInfo = isRedisConnected
      ? 'Redis Server Connected'
      : probe.error
        ? `In-Memory Cache (Fallback) — ${probe.error}`
        : 'In-Memory Cache (Fallback)';

    let keys = probe.keys;
    if (!isRedisConnected) {
      try {
        keys = await cache.keys('*');
      } catch {
        keys = [];
      }
    }

    // آمار واقعی از CacheManager (اگر موجود بود)
    let performanceStats;
    try {
      performanceStats = CacheManager.getPerformanceStats();
    } catch (error) {
      console.error('Error getting performance stats:', error);
      performanceStats = {
        cacheHits: 0,
        cacheMisses: 0,
        totalRequests: 0,
        cacheHitRate: '0.0',
        avgResponseTime: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    // دسته‌بندی کلیدها بر اساس پیشوند
    const categorizedKeys = {
      products: keys.filter(k => k.startsWith('products:')).length,
      categories: keys.filter(k => k.startsWith('categories:')).length,
      orders: keys.filter(k => k.startsWith('orders:')).length,
      reviews: keys.filter(k => k.startsWith('reviews:')).length,
      blog: keys.filter(k => k.startsWith('blog:')).length,
      sliders: keys.filter(k => k.startsWith('sliders:')).length,
      settings: keys.filter(k => k.startsWith('settings:') || k.startsWith('admin:settings:')).length,
      other: keys.filter(k => 
        !k.startsWith('products:') && 
        !k.startsWith('categories:') && 
        !k.startsWith('orders:') &&
        !k.startsWith('reviews:') &&
        !k.startsWith('blog:') &&
        !k.startsWith('sliders:') &&
        !k.startsWith('settings:') &&
        !k.startsWith('admin:settings:')
      ).length
    };
    
    return NextResponse.json({
      success: true,
      data: {
        status: 'active',
        system: isRedisConnected ? 'Redis Cache' : 'In-Memory Cache',
        connection: {
          isRedisConnected,
          type: cacheType,
          info: connectionInfo,
          host: redisConfig.host,
          port: String(redisConfig.port),
          enabled: isRedisEnabled()
        },
        stats: {
          totalKeys: keys.length,
          memoryUsage: isRedisConnected 
            ? 'Redis Memory Info Available' 
            : 'Estimated: ~' + Math.round(keys.length * 1024 / 1024 * 100) / 100 + 'MB',
          cacheType,
          categorizedKeys
        },
        performance: {
          cacheHits: performanceStats.cacheHits,
          cacheMisses: performanceStats.cacheMisses,
          totalRequests: performanceStats.totalRequests,
          cacheHitRate: parseFloat(performanceStats.cacheHitRate),
          avgResponseTime: performanceStats.avgResponseTime,
          lastUpdated: performanceStats.lastUpdated
        },
        keys: keys.slice(0, 20), // Show first 20 keys
        allKeys: keys, // تمام کلیدها برای دیباگ
        message: isRedisConnected 
          ? 'Redis cache system is operational' 
          : 'Cache system is operational (In-Memory fallback)',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error getting cache status:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت وضعیت کش: ' + error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/cache/toggle - Toggle Redis on/off
export async function POST(request: NextRequest) {
  try {
    console.log('📨 POST request received to /api/admin/cache');
    const body = await request.json();
    console.log('📦 Request body:', body);
    const { action } = body;
    
    if (action === 'toggle-redis') {
      const currentStatus = isRedisEnabled();
      const newStatus = !currentStatus;
      
      // Toggle Redis runtime state
      setRedisEnabled(newStatus);
      
      return NextResponse.json({
        success: true,
        message: `Redis ${newStatus ? 'فعال' : 'غیرفعال'} شد. تغییرات بلافاصله اعمال شد.`,
        currentStatus: newStatus,
        note: 'تغییرات فوراً اعمال شده است.'
      });
    }
    
    if (action === 'warm-cache') {
      // Redirect to dedicated warm endpoint
      return NextResponse.json({
        success: true,
        message: 'لطفاً از endpoint مخصوص استفاده کنید',
        endpoint: '/api/admin/cache/warm',
        note: 'برای گرم کردن کش از POST /api/admin/cache/warm استفاده کنید'
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'عمل نامعتبر' },
      { status: 400 }
    );
    
  } catch (error: any) {
    console.error('Error in cache action:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در انجام عمل: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/cache - Clear cache
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pattern = url.searchParams.get('pattern') || '*';
    
    const clearedCount = await cache.clear(pattern);
    
    return NextResponse.json({
      success: true,
      message: `تمام کش‌های ادمین پاک شدند (${clearedCount} آیتم)`,
      clearedKeys: clearedCount,
      pattern
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در پاک کردن کش' },
      { status: 500 }
    );
  }
}
