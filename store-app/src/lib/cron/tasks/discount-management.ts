import { connectDB } from '@/lib/mongodb';
import type { TaskResult } from './types';

/**
 * Handle discount code management
 */
export async function handleDiscountManagement(config: any): Promise<TaskResult> {
  try {
    const db = await connectDB();
    const now = new Date();

    // Activate discounts that should start
    const activatedResult = await db.discounts?.updateMany(
      {
        status: 'scheduled',
        startDate: { $lte: now }
      },
      {
        $set: {
          status: 'active',
          activatedAt: new Date().toISOString()
        }
      }
    );

    // Deactivate expired discounts
    const deactivatedResult = await db.discounts?.updateMany(
      {
        status: 'active',
        endDate: { $lte: now }
      },
      {
        $set: {
          status: 'expired',
          expiredAt: new Date().toISOString()
        }
      }
    );

    console.log(`💰 Activated ${activatedResult?.modifiedCount || 0} discounts, expired ${deactivatedResult?.modifiedCount || 0} discounts`);

    return {
      success: true,
      message: `${activatedResult?.modifiedCount || 0} تخفیف فعال و ${deactivatedResult?.modifiedCount || 0} تخفیف منقضی شد`,
      details: {
        activated: activatedResult?.modifiedCount || 0,
        expired: deactivatedResult?.modifiedCount || 0
      }
    };
  } catch (error: any) {
    console.error('Discount management task error:', error);
    return {
      success: false,
      message: `خطا در مدیریت تخفیف‌ها: ${error.message}`,
      details: { error: error.message }
    };
  }
}
