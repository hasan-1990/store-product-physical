import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import jwt from 'jsonwebtoken'
import { getOTP, deleteOTP, isOTPExpired } from '@/lib/otp-manager'
import { getJwtSecret } from '@/lib/secrets'

function generateToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, getJwtSecret(), { expiresIn: '7d' })
}

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json()

    // Validate input
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, error: 'شماره موبایل الزامی است' },
        { status: 400 }
      )
    }

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json(
        { success: false, error: 'کد تایید الزامی است' },
        { status: 400 }
      )
    }

    // Validate phone format
    const phoneRegex = /^09\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'شماره موبایل معتبر نیست' },
        { status: 400 }
      )
    }

    // Get stored OTP
    const storedOtp = await getOTP(phone)
    if (!storedOtp) {
      return NextResponse.json(
        { success: false, error: 'کد تایید یافت نشد یا منقضی شده است' },
        { status: 404 }
      )
    }

    // Check if OTP is expired
    if (await isOTPExpired(phone)) {
      return NextResponse.json(
        { success: false, error: 'کد تایید منقضی شده است' },
        { status: 410 }
      )
    }

    // Verify OTP
    if (storedOtp.code !== otp) {
      return NextResponse.json(
        { success: false, error: 'کد تایید اشتباه است' },
        { status: 400 }
      )
    }

    // Connect to database
    const db = await connectDB()

    // Find user by phone
    const user = await db.users.findOne({ phone })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'کاربری با این شماره موبایل یافت نشد' },
        { status: 404 }
      )
    }

    // Check if user is active
    if (!user.isActive && !user.active) {
      return NextResponse.json(
        { success: false, error: 'حساب کاربری شما غیرفعال است' },
        { status: 403 }
      )
    }

    // Clear OTP from storage
    await deleteOTP(phone)

    // Generate token
    const token = generateToken(user._id.toString(), user.role || 'USER')

    // Return user data without password
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role || 'USER',
      avatar: user.avatar,
    }

    console.log('User logged in with OTP:', {
      phone,
      userId: user._id.toString(),
      role: user.role || 'USER'
    })

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        token,
      },
      message: 'ورود موفقیت‌آمیز بود',
    })

  } catch (error) {
    console.error('Verify login OTP error:', error)
    
    return NextResponse.json(
      { success: false, error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}