import { connectDB } from '@/lib/mongodb';
import { emailService } from '@/lib/email';
import type { TaskResult } from './types';

/**
 * Handle email queue processing
 */
export async function handleEmailQueue(config: any): Promise<TaskResult> {
  try {
    const db = await connectDB();

    const pendingEmails = await db.emailQueue
      ?.find({
        status: 'pending',
        scheduledFor: { $lte: new Date() },
      })
      .limit(50)
      .toArray();

    if (!pendingEmails || pendingEmails.length === 0) {
      return {
        success: true,
        message: 'هیچ ایمیل در صف نیست',
        details: { processed: 0 },
      };
    }

    console.log(`📧 Processing ${pendingEmails.length} emails from queue`);

    let sent = 0;
    let failed = 0;

    for (const email of pendingEmails) {
      try {
        const result = await emailService.send({
          to: email.to,
          subject: email.subject,
          html: email.html || email.body || `<p>${email.text || ''}</p>`,
          text: email.text,
        });

        if (!result.success) {
          throw new Error(result.error || 'ارسال ایمیل ناموفق بود');
        }

        await db.emailQueue?.updateOne(
          { _id: email._id },
          {
            $set: {
              status: 'sent',
              sentAt: new Date().toISOString(),
              messageId: result.messageId,
            },
          }
        );

        sent++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'خطای ناشناخته';
        console.error(`Failed to send email ${email._id}:`, error);

        await db.emailQueue?.updateOne(
          { _id: email._id },
          {
            $set: {
              status: 'failed',
              error: message,
              failedAt: new Date().toISOString(),
            },
            $inc: { retryCount: 1 },
          }
        );

        failed++;
      }
    }

    return {
      success: true,
      message: `${sent} ایمیل ارسال شد، ${failed} ایمیل خطا داشت`,
      details: {
        total: pendingEmails.length,
        sent,
        failed,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای ناشناخته';
    console.error('Email queue task error:', error);
    return {
      success: false,
      message: `خطا در پردازش صف ایمیل: ${message}`,
      details: { error: message },
    };
  }
}
