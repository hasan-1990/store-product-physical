import { connectDB } from '@/lib/mongodb';
import type { TaskResult } from './types';

/**
 * Handle user cleanup
 */
export async function handleUserCleanup(config: {
  deleteUnverifiedAfterDays?: number;
  deactivateInactiveAfterMonths?: number;
}): Promise<TaskResult> {
  try {
    const db = await connectDB();
    const deleteUnverifiedAfterDays = config.deleteUnverifiedAfterDays || 7;
    const deactivateInactiveAfterMonths = config.deactivateInactiveAfterMonths || 6;

    const unverifiedCutoff = new Date(Date.now() - deleteUnverifiedAfterDays * 24 * 60 * 60 * 1000);
    const inactiveCutoff = new Date(Date.now() - deactivateInactiveAfterMonths * 30 * 24 * 60 * 60 * 1000);

    // Delete unverified users
    const deleteResult = await db.users.deleteMany({
      verified: false,
      createdAt: { $lt: unverifiedCutoff }
    });

    // Deactivate inactive users
    const deactivateResult = await db.users.updateMany(
      {
        lastLoginAt: { $lt: inactiveCutoff },
        active: true
      },
      {
        $set: {
          active: false,
          deactivatedAt: new Date().toISOString(),
          deactivationReason: 'عدم فعالیت - غیرفعال شدن خودکار'
        }
      }
    );

    console.log(`👤 Deleted ${deleteResult.deletedCount} unverified users, deactivated ${deactivateResult.modifiedCount} inactive users`);

    return {
      success: true,
      message: `${deleteResult.deletedCount} کاربر تایید نشده حذف و ${deactivateResult.modifiedCount} کاربر غیرفعال شد`,
      details: {
        deleted: deleteResult.deletedCount,
        deactivated: deactivateResult.modifiedCount
      }
    };
  } catch (error: any) {
    console.error('User cleanup task error:', error);
    return {
      success: false,
      message: `خطا در پاکسازی کاربران: ${error.message}`,
      details: { error: error.message }
    };
  }
}
