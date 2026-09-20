import { connectDB } from '@/lib/mongodb';
import { emailService } from '@/lib/email';
import type { TaskResult } from './types';

function buildAbandonedCartHtml(
  name: string,
  itemCount: number,
  discountCode?: string
): string {
  const discountBlock = discountCode
    ? `<p style="margin-top:16px">کد تخفیف: <strong>${discountCode}</strong></p>`
    : '';

  return `
    <div dir="rtl" style="font-family:Tahoma,sans-serif;line-height:1.8">
      <h2>سبد خرید شما منتظر شماست</h2>
      <p>سلام ${name || 'کاربر گرامی'}،</p>
      <p>شما ${itemCount} محصول در سبد خرید دارید که هنوز تکمیل نشده است.</p>
      <p>برای ادامه خرید به فروشگاه بازگردید.</p>
      ${discountBlock}
    </div>
  `;
}

/**
 * Handle abandoned cart reminder emails
 */
export async function handleAbandonedCart(config: {
  minMinutes?: number;
  discountCode?: string;
}): Promise<TaskResult> {
  try {
    const db = await connectDB();
    const minMinutes = config.minMinutes || 30;
    const cutoffTime = new Date(Date.now() - minMinutes * 60 * 1000);

    const users = await db.users
      .aggregate([
        {
          $match: {
            email: { $exists: true, $ne: '' },
            cart: { $exists: true, $ne: [] },
            'cart.0': { $exists: true },
            $and: [
              {
                $or: [
                  { lastActivity: { $lt: cutoffTime } },
                  { updatedAt: { $lt: cutoffTime } },
                ],
              },
              {
                $or: [
                  { lastAbandonedCartEmailAt: { $exists: false } },
                  { lastAbandonedCartEmailAt: { $lt: cutoffTime } },
                ],
              },
            ],
          },
        },
        {
          $project: {
            email: 1,
            name: 1,
            cart: 1,
            cartItemCount: { $size: '$cart' },
          },
        },
      ])
      .toArray();

    console.log(`📧 Found ${users.length} abandoned carts to remind`);

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const user of users) {
      if (!user.email) continue;

      const result = await emailService.send({
        to: user.email,
        subject: 'سبد خرید شما منتظر شماست',
        html: buildAbandonedCartHtml(
          user.name,
          user.cartItemCount || user.cart?.length || 0,
          config.discountCode
        ),
      });

      if (result.success) {
        emailsSent++;
        await db.users.updateOne(
          { _id: user._id },
          { $set: { lastAbandonedCartEmailAt: new Date() } }
        );
      } else {
        emailsFailed++;
        console.warn(`Abandoned cart email failed for ${user.email}:`, result.error);
      }
    }

    return {
      success: true,
      message: `یادآوری برای ${emailsSent} سبد خرید ارسال شد`,
      details: {
        totalCarts: users.length,
        emailsSent,
        emailsFailed,
        discountCode: config.discountCode,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای ناشناخته';
    console.error('Abandoned cart task error:', error);
    return {
      success: false,
      message: `خطا در ارسال یادآوری سبد خرید: ${message}`,
      details: { error: message },
    };
  }
}
