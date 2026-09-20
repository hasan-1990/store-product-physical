import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { validatePassword } from '@/utils';
import { getJwtSecret } from '@/lib/secrets';

export async function PUT(req: NextRequest) {
  try {
    const db = await connectDB();
    
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'ماژول احراز هویت یافت نشد' }, { status: 401 });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
    
    if (!ObjectId.isValid(decoded.userId)) {
      return NextResponse.json({ error: 'شناسه کاربر نامعتبر است' }, { status: 400 });
    }
    
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'رمز عبور فعلی و جدید الزامی است' }, { status: 400 });
    }

    // ✅ Password Validation پیشرفته
    const passResult = validatePassword(newPassword);
    if (!passResult.isValid) {
      return NextResponse.json(
        { error: passResult.error || 'رمز عبور نامعتبر است' },
        { status: 400 }
      );
    }

    // بررسی قدرت رمز عبور
    if (passResult.strength && passResult.strength.percentage < 60) {
      return NextResponse.json(
        { 
          error: 'رمز عبور ضعیف است',
          hint: passResult.strength.feedback.join(', ')
        },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.users.findOne({
      _id: new ObjectId(decoded.userId)
    });

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'رمز عبور فعلی صحیح نیست' }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    const result = await db.users.updateOne(
      { _id: new ObjectId(decoded.userId) },
      { 
        $set: { 
          password: hashedNewPassword,
          updatedAt: new Date(),
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'خطا در تغییر رمز عبور' }, { status: 500 });
    }

    return NextResponse.json({ message: 'رمز عبور با موفقیت تغییر یافت' });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'خطا در تغییر رمز عبور' }, { status: 500 });
  }
}
