import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { phone, code, password } = await request.json();

    console.log('🔐 Reset Password Phone Request:', { phone, code: code?.substring(0, 2) + '**', passwordLength: password?.length });

    if (!phone || !code || !password) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'تمام فیلدها الزامی هستند' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'رمز عبور باید حداقل ۸ کاراکتر باشد' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Verify code again
    const verificationRecord = await db.verificationCodes.findOne({
      phone,
      code,
      type: 'password_reset',
      used: false,
      expiresAt: { $gt: new Date() }
    });

    console.log('🔍 Verification record:', verificationRecord ? 'Found' : 'Not found');

    if (!verificationRecord) {
      return NextResponse.json(
        { error: 'کد تایید نامعتبر یا منقضی شده است' },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.users.findOne({ phone });

    console.log('👤 User found:', user ? `Yes (${user.email})` : 'No');

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await db.users.updateOne(
      { phone },
      {
        $set: {
          password: hashedPassword,
        },
      }
    );

    // Mark code as used
    await db.verificationCodes.updateOne(
      { _id: verificationRecord._id },
      {
        $set: {
          used: true,
        },
      }
    );

    console.log('✅ Password reset successful via phone for:', phone);

    return NextResponse.json({
      success: true,
      message: 'رمز عبور با موفقیت تغییر کرد',
    });

  } catch (error) {
    console.error('❌ Error in reset-password-phone API:', error);
    return NextResponse.json(
      { error: 'خطا در تغییر رمز عبور' },
      { status: 500 }
    );
  }
}
