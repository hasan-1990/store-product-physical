import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CacheManager } from '@/lib/cache-manager';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { validateFirstName, validateEmail, validatePassword } from '@/utils';
import { getJwtSecret } from '@/lib/secrets';

const completeProfileSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر نیست'),
  password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
});

function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string; role: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// POST /api/auth/complete-profile - Complete user profile
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'توکن احراز هویت یافت نشد' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const tokenData = verifyToken(token);
    
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Server-side validation با utilities
    const nameResult = validateFirstName(body.name);
    if (!nameResult.isValid) {
      return NextResponse.json(
        { success: false, error: nameResult.error || 'نام نامعتبر است' },
        { status: 400 }
      );
    }
    
    const emailResult = validateEmail(body.email, { allowTempEmails: false, strictMode: true });
    if (!emailResult.isValid) {
      return NextResponse.json(
        { success: false, error: emailResult.error || 'ایمیل نامعتبر است' },
        { status: 400 }
      );
    }
    
    const passwordResult = validatePassword(body.password);
    if (!passwordResult.isValid) {
      return NextResponse.json(
        { success: false, error: passwordResult.error || 'رمز عبور نامعتبر است' },
        { status: 400 }
      );
    }
    
    // استفاده از مقادیر پاکسازی شده
    const validatedData = {
      name: nameResult.cleaned || body.name,
      email: body.email.trim().toLowerCase(),
      password: body.password
    };

    const mongodb = await connectDB();

    // Get current user
    const currentUser = await mongodb.users.findOne({
      _id: new ObjectId(tokenData.userId)
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Check if profile is already complete
    if (currentUser.profileComplete) {
      return NextResponse.json(
        { success: false, error: 'پروفایل قبلاً تکمیل شده است' },
        { status: 400 }
      );
    }

    // Check if email already exists for another user
    const existingEmailUser = await mongodb.users.findOne({
      email: validatedData.email,
      _id: { $ne: currentUser._id }
    });

    if (existingEmailUser) {
      return NextResponse.json(
        { success: false, error: 'این ایمیل قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Update user with complete profile
    const updateResult = await mongodb.users.updateOne(
      { _id: currentUser._id },
      {
        $set: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          profileComplete: true,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'خطا در به‌روزرسانی پروفایل' },
        { status: 500 }
      );
    }

    // Invalidate users cache
    await CacheManager.invalidateUsers();
    console.log('🧹 Users cache invalidated after profile completion');

    // Return updated user data without password
    const userResponse = {
      id: currentUser._id.toString(),
      name: validatedData.name,
      email: validatedData.email,
      phone: currentUser.phone,
      role: currentUser.role,
      avatar: currentUser.avatar,
      profileComplete: true,
    };

    console.log(`✅ Profile completed for user: ${currentUser.phone} (${validatedData.email})`);

    return NextResponse.json({
      success: true,
      data: {
        user: userResponse,
      },
      message: 'پروفایل با موفقیت تکمیل شد',
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

    console.error('Complete profile error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در تکمیل پروفایل' },
      { status: 500 }
    );
  }
}