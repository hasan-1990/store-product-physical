import { connectDB } from '@/lib/mongodb';
import type { TaskResult } from './types';

/**
 * Handle ticket cleanup
 */
export async function handleTicketCleanup(config: {
  closeAfterDays?: number;
}): Promise<TaskResult> {
  try {
    const db = await connectDB();
    const closeAfterDays = config.closeAfterDays || 3;
    const cutoffDate = new Date(Date.now() - closeAfterDays * 24 * 60 * 60 * 1000);

    // Close resolved tickets with no response
    const result = await db.tickets.updateMany(
      {
        status: 'answered',
        lastResponseAt: { $lt: cutoffDate }
      },
      {
        $set: {
          status: 'closed',
          closedAt: new Date().toISOString(),
          closedBy: 'system',
          closeReason: 'بدون پاسخ - بسته شدن خودکار'
        }
      }
    );

    console.log(`🎫 Closed ${result.modifiedCount} inactive tickets`);

    return {
      success: true,
      message: `${result.modifiedCount} تیکت بدون پاسخ بسته شد`,
      details: {
        closedCount: result.modifiedCount,
        closeAfterDays
      }
    };
  } catch (error: any) {
    console.error('Ticket cleanup task error:', error);
    return {
      success: false,
      message: `خطا در پاکسازی تیکت‌ها: ${error.message}`,
      details: { error: error.message }
    };
  }
}
