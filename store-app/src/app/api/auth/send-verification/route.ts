import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SMSService } from '@/lib/sms-service';
import { z } from 'zod';

const sendVerificationSchema = z.object({
  phone: z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل باید با 09 شروع شود و 11 رقم باشد'),
});

// POST /api/auth/send-verification - Send OTP for registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = sendVerificationSchema.parse(body);

    const mongodb = await connectDB();

    // Check if phone number already exists
    const existingUser = await mongodb.users.findOne({
      phone: validatedData.phone
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'این شماره موبایل قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    // Generate 4-digit verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Store verification code in database with 5 minutes expiration
    const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await mongodb.verificationCodes.updateOne(
      { mobile: validatedData.phone },
      {
        $set: {
          mobile: validatedData.phone,
          code: verificationCode,
          expiresAt: expirationTime,
          type: 'registration',
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    // Send SMS
    const message = `کد تایید ثبت‌نام شما: ${verificationCode}`;
    
    try {
      await SMSService.sendVerificationCode(validatedData.phone, verificationCode);
      console.log(`📱 Registration OTP sent to ${validatedData.phone}: ${verificationCode}`);
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      // Continue with success response even if SMS fails for development
      console.log(`📱 [DEV] Registration OTP for ${validatedData.phone}: ${verificationCode}`);
    }

    return NextResponse.json({
      success: true,
      message: 'کد تایید ارسال شد',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'داده‌های ورودی نامعتبر',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Send verification error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ارسال کد تایید' },
      { status: 500 }
    );
  }
}