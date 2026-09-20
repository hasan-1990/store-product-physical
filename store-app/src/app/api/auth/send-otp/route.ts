import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SMSService } from '@/lib/sms-service';
import { validateMobileWithMessage } from '@/utils/mobile-validation';
import { z } from 'zod';

// اعتبارسنجی بهبود یافته با پیام خطای فارسی
const sendOTPSchema = z.object({
  phone: z.string()
    .min(10, 'شماره موبایل کوتاه است')
    .max(15, 'شماره موبایل بلند است')
    .refine((phone) => {
      const validation = validateMobileWithMessage(phone);
      return validation.isValid;
    }, {
      message: 'شماره موبایل ایرانی معتبر وارد کنید (مثال: 09123456789)'
    }),
});

function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// استفاده از همان روش SMS فراموشی رمز
async function sendSMS(phone: string, code: string): Promise<boolean> {
  return await SMSService.sendVerificationCode(phone, code);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = sendOTPSchema.parse(body);

    const db = await connectDB();

    // Check if user already exists with this phone number
    const existingUser = await db.users.findOne({ phone });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'کاربری با این شماره موبایل قبلاً ثبت‌نام کرده است' },
        { status: 400 }
      );
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code in database
    await db.verificationCodes.deleteMany({ phone }); // Remove old codes
    await db.verificationCodes.insertOne({
      phone,
      code: verificationCode,
      type: 'registration',
      expiresAt,
      createdAt: new Date(),
      used: false
    });

    // Send SMS (using same method as forgot password)
    const smsSent = await sendSMS(phone, verificationCode);

    if (!smsSent) {
      return NextResponse.json(
        { success: false, error: 'خطا در ارسال پیامک' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'کد تأیید به شماره موبایل شما ارسال شد',
      phone: phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3') // Mask phone number
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'شماره موبایل معتبر نیست',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ارسال کد تأیید' },
      { status: 500 }
    );
  }
}