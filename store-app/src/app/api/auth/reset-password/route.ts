import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !token.trim()) {
      return NextResponse.json(
        { error: 'توکن بازیابی الزامی است' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'رمز عبور باید حداقل ۸ کاراکتر باشد' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const usersCollection = db.users;

    // Hash the provided token to compare with stored hash
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid reset token
    const user = await usersCollection.findOne({
      resetToken: resetTokenHash,
      resetTokenExpiry: { $gt: new Date() }, // Token not expired
      role: { $regex: /^admin$/i } // Support both 'admin' and 'ADMIN'
    });

    if (!user) {
      return NextResponse.json(
        { error: 'توکن بازیابی نامعتبر یا منقضی شده است' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
        },
        $unset: {
          resetToken: '',
          resetTokenExpiry: '',
        },
      }
    );

    console.log('✅ Password reset successful for:', user.email);

    return NextResponse.json({
      success: true,
      message: 'رمز عبور با موفقیت تغییر کرد',
    });

  } catch (error) {
    console.error('❌ Error in reset-password API:', error);
    return NextResponse.json(
      { error: 'خطا در تغییر رمز عبور' },
      { status: 500 }
    );
  }
}
