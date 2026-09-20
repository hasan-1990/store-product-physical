/**
 * Next Rocket API - Cache Management
 * API مدیریت کش
 */

import { NextRequest, NextResponse } from 'next/server';
import CacheManager from '@/modules/next-rocket/core/cache-manager';
import { ClearCacheResponse } from '@/modules/next-rocket/types';

/**
 * GET - دریافت آمار کش
 */
export async function GET(request: NextRequest) {
  try {
    const cache = CacheManager;
    const stats = await cache.getStats();

    return NextResponse.json({
      success: true,
      stats: {
        totalEntries: stats.totalEntries,
        totalSize: `${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`,
        hitRate: `${stats.hitRate.toFixed(1)}%`,
        missRate: `${stats.missRate.toFixed(1)}%`,
        memory: `${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`,
        redis: `${(stats.redisUsage / 1024 / 1024).toFixed(2)} MB`,
        disk: `${(stats.diskUsage / 1024 / 1024).toFixed(2)} MB`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - پاک کردن کش
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'all', 'tag', 'key'
    const value = searchParams.get('value');

    const cache = CacheManager;
    let clearedEntries = 0;
    let clearedSize = 0;

    // گرفتن آمار قبل از پاک کردن
    const statsBefore = await cache.getStats();

    switch (type) {
      case 'all':
        await cache.clear();
        clearedEntries = statsBefore.totalEntries;
        clearedSize = statsBefore.totalSize;
        break;

      case 'tag':
        if (!value) {
          return NextResponse.json(
            { success: false, error: 'tag نامعتبر' },
            { status: 400 }
          );
        }
        clearedEntries = await cache.deleteByTag(value);
        break;

      case 'key':
        if (!value) {
          return NextResponse.json(
            { success: false, error: 'key نامعتبر' },
            { status: 400 }
          );
        }
        await cache.delete(value);
        clearedEntries = 1;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'نوع نامعتبر' },
          { status: 400 }
        );
    }

    const response: ClearCacheResponse = {
      success: true,
      clearedEntries,
      clearedSize,
      message: `✅ ${clearedEntries} آیتم از کش پاک شد (${(clearedSize / 1024 / 1024).toFixed(2)} MB)`,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - پاکسازی کش منقضی شده
 */
export async function POST(request: NextRequest) {
  try {
    const cache = CacheManager;
    const cleaned = await cache.cleanup();

    return NextResponse.json({
      success: true,
      cleaned,
      message: `✅ ${cleaned} آیتم منقضی شده پاک شد`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
