import { NextResponse } from 'next/server';
import { runFullDeployChecks } from '@/lib/deploy-checks';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/deploy — چک‌لیست آمادگی production (بدون افشای secret)
 */
export async function GET() {
  const checks = await runFullDeployChecks();
  const ready = checks.every((check) => check.ok);

  return NextResponse.json(
    {
      ready,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      checks,
    },
    {
      status: ready ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
