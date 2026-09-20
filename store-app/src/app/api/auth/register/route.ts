import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CacheManager } from '@/lib/cache-manager';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getJwtSecret } from '@/lib/secrets';

const registerSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر نیست'),
  password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
  phone: z.string().min(11, 'شماره موبایل اجباری است و باید حداقل 11 رقم باشد').regex(/^09[0-9]{9}$/, 'شماره موبایل باید با 09 شروع شود و 11 رقم باشد'),
});

function generateToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, getJwtSecret(), { expiresIn: '7d' });
}

// POST /api/auth/register - User registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const mongodb = await connectDB();

    // Check if email already exists
    const existingUser = await mongodb.users.findOne({
      email: validatedData.email
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'این ایمیل قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const userData = {
      ...validatedData,
      _id: new ObjectId(),
      password: hashedPassword,
      role: 'USER',
      active: true, // Set user as active by default
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await mongodb.users.insertOne(userData);

    // Invalidate users cache so admin panel shows new user immediately
    await CacheManager.invalidateUsers();
    console.log('🧹 Users cache invalidated after new registration');

    // Generate token
    const token = generateToken(userData._id.toString(), userData.role);

    // Return user data without password
    const userResponse = {
      id: userData._id.toString(),
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      avatar: userData.avatar,
    };

    return NextResponse.json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
      message: 'ثبت‌نام با موفقیت انجام شد',
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

    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت‌نام' },
      { status: 500 }
    );
  }
}
