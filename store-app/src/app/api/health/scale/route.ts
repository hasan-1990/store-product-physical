import { NextResponse } from 'next/server';
import { runScaleChecks } from '@/lib/deploy-checks';
import { getLatestBackupInfo } from '@/lib/mongodb-backup';
import { isCdnEnabled } from '@/lib/cdn';
import { isSentryEnabled } from '@/lib/error-monitoring';
import { isRedisEnabled } from '@/lib/redis';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/scale — آمادگی Scale (Q4)
 */
export async function GET() {
  const [checks, backup] = await Promise.all([
    runScaleChecks(),
    getLatestBackupInfo(),
  ]);

  const criticalIds = new Set([
    'redis_required',
    'redis_ping',
    'jwt_secret',
    'nextauth_secret',
    'allow_dev_routes',
  ]);

  const criticalFailed = checks.filter((c) => !c.ok && criticalIds.has(c.id));
  const ready = criticalFailed.length === 0;

  return NextResponse.json(
    {
      ready,
      timestamp: new Date().toISOString(),
      scale: {
        redis: isRedisEnabled(),
        cdn: isCdnEnabled(),
        sentry: isSentryEnabled(),
        uptimeKuma: 'http://localhost:3001 (docker service uptime-kuma)',
        backup: backup.found
          ? { path: backup.path, ageHours: backup.ageHours, collections: backup.collections }
          : null,
        openapi: '/api/openapi',
      },
      checks,
    },
    {
      status: ready ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
