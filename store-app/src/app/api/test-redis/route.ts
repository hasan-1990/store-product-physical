import { NextResponse } from 'next/server';
import { getRedisConnectionConfig, probeRedisConnection } from '@/lib/redis';

export async function GET() {
  try {
    const config = getRedisConnectionConfig();
    const probe = await probeRedisConnection(2500);

    if (!probe.connected) {
      return NextResponse.json(
        {
          success: false,
          error: probe.error || 'Redis unavailable',
          environment: {
            REDIS_ENABLED: process.env.REDIS_ENABLED,
            REDIS_HOST: config.host,
            REDIS_PORT: config.port,
            hasPassword: !!config.password,
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Redis is working perfectly!',
      totalKeys: probe.keys.length,
      environment: {
        REDIS_ENABLED: process.env.REDIS_ENABLED,
        REDIS_HOST: config.host,
        REDIS_PORT: config.port,
        hasPassword: !!config.password,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Redis test failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
