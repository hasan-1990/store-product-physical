import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { SMSService } from '@/lib/sms-service'
import { generateOTP, storeOTP, getOTP } from '@/lib/otp-manager'

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    // Validate phone number
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, error: 'شماره موبایل الزامی است' },
        { status: 400 }
      )
    }

    // Validate phone format (Iranian mobile number)
    const phoneRegex = /^09\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'شماره موبایل معتبر نیست (09xxxxxxxxx)' },
        { status: 400 }
      )
    }

    // Check rate limiting - max 3 attempts per phone per hour
    const existingOtp = await getOTP(phone)
    if (existingOtp && existingOtp.attempts >= 3) {
      const timeLeft = Math.ceil((existingOtp.expiry - Date.now()) / (1000 * 60))
      return NextResponse.json(
        { success: false, error: `حداکثر تعداد درخواست. ${timeLeft} دقیقه صبر کنید` },
        { status: 429 }
      )
    }

    // Connect to database
    const db = await connectDB()

    // Check if user exists with this phone number
    const user = await db.users.findOne({ phone })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'کاربری با این شماره موبایل یافت نشد. لطفا ابتدا ثبت‌نام کنید.' },
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

    // Generate OTP
    const otpCode = generateOTP()

    // Store OTP
    await storeOTP(phone, otpCode, 'login', existingOtp?.attempts || 0)

    // Send SMS
    try {
      const smsResult = await SMSService.sendVerificationCode(phone, otpCode)
      
      console.log('Login OTP sent:', {
        phone,
        code: otpCode,
        smsResult: smsResult ? 'موفق' : 'ناموفق'
      })

      return NextResponse.json({
        success: true,
        message: 'کد تایید ارسال شد',
        data: {
          phone,
          expiresIn: 600, // 10 minutes in seconds
          // In development, include the code for testing
          ...(process.env.NODE_ENV === 'development' && { code: otpCode })
        }
      })

    } catch (smsError) {
      console.error('SMS sending failed:', smsError)
      
      // Even if SMS fails, we still return success for development
      return NextResponse.json({
        success: true,
        message: 'کد تایید ارسال شد (شبیه‌ساز)',
        data: {
          phone,
          expiresIn: 600,
          // In development, include the code
          ...(process.env.NODE_ENV === 'development' && { code: otpCode })
        }
      })
    }

  } catch (error) {
    console.error('Send login OTP error:', error)
    
    return NextResponse.json(
      { success: false, error: 'خطای داخلی سرور' },
      { status: 500 }
    )
  }
}