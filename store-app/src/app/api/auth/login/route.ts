import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { generateToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('ایمیل معتبر نیست'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر نیست'),
  password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
  phone: z.string().optional(),
});

// POST /api/auth/login - User login
export async function POST(request: NextRequest) {
  try {
    const db = await connectDB();
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Find user by email
    const user = await db.users.findOne({ email: validatedData.email });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ایمیل یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    if (user.active === false || user.isActive === false) {
      return NextResponse.json(
        { success: false, error: 'حساب کاربری شما غیرفعال است' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'ایمیل یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    // به‌روزرسانی تاریخ آخرین ورود
    await db.users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          lastLogin: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    // Generate token
    const token = generateToken(user._id.toString(), user.role, user.email);

    // Return user data without password
    const userData = {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
      lastLogin: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        token,
      },
      message: 'ورود موفقیت‌آمیز بود',
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

    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ورود' },
      { status: 500 }
    );
  }
}
