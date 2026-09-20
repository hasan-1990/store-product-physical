import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CacheManager } from '@/lib/cache-manager';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getJwtSecret } from '@/lib/secrets';

const verifyRegistrationSchema = z.object({
  phone: z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل باید با 09 شروع شود و 11 رقم باشد'),
  verificationCode: z.string().length(4, 'کد تایید باید 4 رقم باشد'),
});

function generateToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, getJwtSecret(), { expiresIn: '7d' });
}

// POST /api/auth/verify-registration - Verify OTP and create temporary user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verifyRegistrationSchema.parse(body);

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

    // Verify the OTP code
    const verificationRecord = await mongodb.verificationCodes.findOne({
      mobile: validatedData.phone,
      code: validatedData.verificationCode,
      type: 'registration',
      expiresAt: { $gt: new Date() }
    });

    if (!verificationRecord) {
      return NextResponse.json(
        { success: false, error: 'کد تایید نامعتبر یا منقضی شده است' },
        { status: 400 }
      );
    }

    // Create temporary user account (incomplete profile)
    const tempUserId = new ObjectId();
    const userData = {
      _id: tempUserId,
      phone: validatedData.phone,
      name: null, // Will be filled later
      email: null, // Will be filled later 
      password: null, // Will be filled later
      role: 'USER',
      active: true,
      avatar: null,
      profileComplete: false, // Flag to indicate incomplete profile
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await mongodb.users.insertOne(userData);

    // Remove the used verification code
    await mongodb.verificationCodes.deleteOne({
      mobile: validatedData.phone,
      code: validatedData.verificationCode,
      type: 'registration'
    });

    // Invalidate users cache
    await CacheManager.invalidateUsers();
    console.log('🧹 Users cache invalidated after new registration');

    // Generate token
    const token = generateToken(tempUserId.toString(), userData.role);

    // Return user data
    const userResponse = {
      id: tempUserId.toString(),
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      avatar: userData.avatar,
      profileComplete: userData.profileComplete,
    };

    console.log(`✅ Temporary user created for phone: ${validatedData.phone}`);

    return NextResponse.json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
      message: 'شماره موبایل تایید شد. لطفاً اطلاعات خود را تکمیل کنید.',
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

    console.error('Verify registration error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در تایید کد' },
      { status: 500 }
    );
  }
}