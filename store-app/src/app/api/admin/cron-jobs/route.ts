import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import type { CronJob } from '@/types/cron';
import { ObjectId } from 'mongodb';

/**
 * GET /api/admin/cron-jobs
 * Get all cron jobs
 */
export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    
    const jobs = await db.cronJobs
      .find({})
      .sort({ createdAt: -1 })
      .toArray() as unknown as CronJob[];

    return NextResponse.json({
      success: true,
      jobs
    });
  } catch (error: any) {
    console.error('Get cron jobs error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cron-jobs
 * Create a new cron job
 */
export async function POST(request: NextRequest) {
  try {
    const db = await connectDB();
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.taskType || !body.schedule) {
      return NextResponse.json(
        { success: false, error: 'فیلدهای name، taskType و schedule الزامی هستند' },
        { status: 400 }
      );
    }

    // Validate cron expression
    const { isValidCronExpression } = await import('@/lib/cron/scheduler');
    if (!isValidCronExpression(body.schedule)) {
      return NextResponse.json(
        { success: false, error: 'فرمت schedule نامعتبر است' },
        { status: 400 }
      );
    }

    const newJob: Partial<CronJob> = {
      name: body.name,
      description: body.description || '',
      taskType: body.taskType,
      schedule: body.schedule,
      enabled: body.enabled !== undefined ? body.enabled : true,
      status: 'active',
      priority: body.priority || 'medium',
      config: body.config || {},
      runCount: 0,
      successCount: 0,
      failCount: 0,
      logs: [],
      maxLogs: body.maxLogs || 100,
      createdBy: body.createdBy || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await db.cronJobs.insertOne(newJob as any);
    const jobId = result.insertedId.toString();

    // Start the cron job if enabled
    if (newJob.enabled) {
      const { startCronJob } = await import('@/lib/cron/scheduler');
      await startCronJob(jobId, newJob.schedule!);
    }

    return NextResponse.json({
      success: true,
      jobId,
      job: { ...newJob, _id: jobId }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create cron job error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
