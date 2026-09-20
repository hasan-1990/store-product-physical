import { NextRequest, NextResponse } from 'next/server';
import { triggerCronJob } from '@/lib/cron/scheduler';

/**
 * POST /api/admin/cron-jobs/[id]/trigger
 * Manually trigger a cron job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await triggerCronJob(id);

    return NextResponse.json({
      success: true,
      message: 'Cron job triggered successfully'
    });
  } catch (error: any) {
    console.error('Trigger cron job error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
