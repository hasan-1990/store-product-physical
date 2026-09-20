import { connectDB } from '@/lib/mongodb';
import type { TaskResult } from './types';

/**
 * Handle automatic order management
 * - Cancel unpaid orders after X hours
 * - Complete delivered orders after X days
 */
export async function handleOrderManagement(config: {
  cancelAfterHours?: number;
  completeAfterDays?: number;
}): Promise<TaskResult> {
  try {
    const db = await connectDB();
    const cancelAfterHours = config.cancelAfterHours || 24;
    const completeAfterDays = config.completeAfterDays || 7;

    const cancelCutoff = new Date(Date.now() - cancelAfterHours * 60 * 60 * 1000);
    const completeCutoff = new Date(Date.now() - completeAfterDays * 24 * 60 * 60 * 1000);

    // Cancel unpaid orders
    const cancelResult = await db.orders.updateMany(
      {
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: { $lt: cancelCutoff }
      },
      {
        $set: {
          status: 'cancelled',
          cancelReason: 'پرداخت نشده - کنسل خودکار',
          cancelledAt: new Date().toISOString()
        }
      }
    );

    // Complete delivered orders
    const completeResult = await db.orders.updateMany(
      {
        status: 'delivered',
        deliveredAt: { $lt: completeCutoff }
      },
      {
        $set: {
          status: 'completed',
          completedAt: new Date().toISOString()
        }
      }
    );

    console.log(`🔄 Cancelled ${cancelResult.modifiedCount} orders, completed ${completeResult.modifiedCount} orders`);

    return {
      success: true,
      message: `${cancelResult.modifiedCount} سفارش کنسل و ${completeResult.modifiedCount} سفارش تکمیل شد`,
      details: {
        cancelled: cancelResult.modifiedCount,
        completed: completeResult.modifiedCount
      }
    };
  } catch (error: any) {
    console.error('Order management task error:', error);
    return {
      success: false,
      message: `خطا در مدیریت سفارشات: ${error.message}`,
      details: { error: error.message }
    };
  }
}
