import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import type { CronJob } from '@/types/cron';
import { ObjectId } from 'mongodb';

/**
 * GET /api/admin/cron-jobs/[id]
 * Get a specific cron job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectDB();
    const { id } = await params;

    const job = await db.cronJobs.findOne({
      _id: new ObjectId(id)
    }) as unknown as CronJob;

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Cron job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job
    });
  } catch (error: any) {
    console.error('Get cron job error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/cron-jobs/[id]
 * Update a cron job
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectDB();
    const { id } = await params;
    const body = await request.json();

    // Validate schedule if provided
    if (body.schedule) {
      const { isValidCronExpression } = await import('@/lib/cron/scheduler');
      if (!isValidCronExpression(body.schedule)) {
        return NextResponse.json(
          { success: false, error: 'فرمت schedule نامعتبر است' },
          { status: 400 }
        );
      }
    }

    // Get current job
    const currentJob = await db.cronJobs.findOne({
      _id: new ObjectId(id)
    }) as unknown as CronJob;

    if (!currentJob) {
      return NextResponse.json(
        { success: false, error: 'Cron job not found' },
        { status: 404 }
      );
    }

    // Update fields
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.schedule !== undefined) updateData.schedule = body.schedule;
    if (body.enabled !== undefined) updateData.enabled = body.enabled;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.config !== undefined) updateData.config = body.config;
    if (body.maxLogs !== undefined) updateData.maxLogs = body.maxLogs;

    await db.cronJobs.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Handle cron job start/stop
    const { startCronJob, stopCronJob } = await import('@/lib/cron/scheduler');
    
    // If schedule changed or job was disabled
    if (body.schedule !== undefined || body.enabled === false) {
      stopCronJob(id);
    }

    // If enabled and schedule exists, start the job
    if (updateData.enabled !== false && (body.schedule || currentJob.schedule)) {
      const schedule = body.schedule || currentJob.schedule;
      await startCronJob(id, schedule);
    }

    return NextResponse.json({
      success: true,
      message: 'Cron job updated successfully'
    });
  } catch (error: any) {
    console.error('Update cron job error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cron-jobs/[id]
 * Delete a cron job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectDB();
    const { id } = await params;

    // Stop the job first
    const { stopCronJob } = await import('@/lib/cron/scheduler');
    stopCronJob(id);

    // Delete from database
    const result = await db.cronJobs.deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Cron job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cron job deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete cron job error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
