import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

/**
 * Health Check API
 * Checks if application, database, and cache are working
 */
export async function GET() {
  const startTime = Date.now();
  
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    services: {
      app: 'ok',
      database: 'checking',
      redis: 'not_configured'
    },
    system: {
      memory: {},
      cpu: {}
    }
  };

  try {
    // Check MongoDB
    const db = await connectDB();
    const dbStartTime = Date.now();
    // Simple connection test
    await db.products.findOne({}).catch(() => null);
    const dbResponseTime = Date.now() - dbStartTime;
    
    health.services.database = {
      status: 'ok',
      responseTime: `${dbResponseTime}ms`
    };
  } catch (error) {
    health.services.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    health.status = 'unhealthy';
  }

  try {
    // Check Redis
    const redisRequired =
      process.env.NODE_ENV === 'production' && process.env.REDIS_ENABLED === 'true';

    const { cache, isRedisEnabled } = await import('@/lib/redis');
    if (isRedisEnabled()) {
      const redisStartTime = Date.now();
      const result = await cache.ping();
      const redisResponseTime = Date.now() - redisStartTime;

      if (result === 'PONG') {
        health.services.redis = {
          status: 'ok',
          responseTime: `${redisResponseTime}ms`,
        };
      } else {
        health.services.redis = {
          status: 'error',
          message: 'Unexpected response: ' + result,
        };
        if (redisRequired) health.status = 'unhealthy';
      }
    } else if (process.env.NODE_ENV === 'production') {
      health.services.redis = {
        status: 'error',
        message: 'REDIS_ENABLED باید true باشد در production',
      };
      health.status = 'unhealthy';
    } else {
      health.services.redis = 'not_configured';
    }
  } catch (error: any) {
    health.services.redis = {
      status: 'error',
      message: error?.message || 'unknown error'
    };
    console.error('Redis health check error:', error);
    if (process.env.NODE_ENV === 'production') {
      health.status = 'unhealthy';
    }
  }

  // Memory usage
  const memoryUsage = process.memoryUsage();
  health.system.memory = {
    used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
    percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
  };

  // Response time
  health.responseTime = `${Date.now() - startTime}ms`;

  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
