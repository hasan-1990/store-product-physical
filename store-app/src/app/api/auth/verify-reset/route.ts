import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { validatePassword, validateMobileWithMessage } from '@/utils';

const verifyResetSchema = z.object({
  phone: z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل معتبر نیست').optional(),
  email: z.string().email('ایمیل معتبر نیست').optional(),
  code: z.string().length(4, 'کد تأیید باید 4 رقم باشد'),
  newPassword: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, email, code, newPassword } = verifyResetSchema.parse(body);

    // حداقل یکی از phone یا email باید وجود داشته باشه
    if (!phone && !email) {
      return NextResponse.json(
        { success: false, error: 'شماره موبایل یا ایمیل الزامی است' },
        { status: 400 }
      );
    }

    // ✅ Mobile Validation پیشرفته (فقط اگر phone داشته باشیم)
    if (phone) {
      const phoneResult = validateMobileWithMessage(phone);
      if (!phoneResult.isValid) {
        return NextResponse.json(
          { success: false, error: phoneResult.message },
          { status: 400 }
        );
      }
    }

    // ✅ Password Validation پیشرفته
    const passResult = validatePassword(newPassword);
    if (!passResult.isValid) {
      return NextResponse.json(
        { success: false, error: passResult.error || 'رمز عبور نامعتبر است' },
        { status: 400 }
      );
    }

    // بررسی قدرت رمز عبور
    if (passResult.strength && passResult.strength.percentage < 50) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'رمز عبور خیلی ضعیف است',
          hint: passResult.strength.feedback.join(', ')
        },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Find and verify the code (با استفاده از phone یا email)
    const verificationQuery: any = {
      code,
      type: 'password_reset',
      used: false,
      expiresAt: { $gt: new Date() }
    };

    if (phone) {
      verificationQuery.phone = phone;
    } else if (email) {
      verificationQuery.email = email.toLowerCase();
    }

    const verificationRecord = await db.verificationCodes.findOne(verificationQuery);

    if (!verificationRecord) {
      return NextResponse.json(
        { success: false, error: 'کد تأیید نامعتبر یا منقضی است' },
        { status: 400 }
      );
    }

    // Find user (با استفاده از phone یا email)
    const userQuery: any = phone ? { phone } : { email: email?.toLowerCase() };
    const user = await db.users.findOne(userQuery);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await db.users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    );

    // Mark verification code as used
    await db.verificationCodes.updateOne(
      { _id: verificationRecord._id },
      { $set: { used: true, usedAt: new Date() } }
    );

    console.log(`🔐 Password reset successful for user: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'رمز عبور شما با موفقیت تغییر یافت'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'اطلاعات وارد شده معتبر نیست',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Verify reset error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بازنشانی رمز عبور' },
      { status: 500 }
    );
  }
}