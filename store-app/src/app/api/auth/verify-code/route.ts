import { NextRequest, NextResponse } from 'next/server'
import { getVerificationCodes } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const { phone, email, code } = await request.json()

    // Validate input - حداقل یکی از phone یا email باید وجود داشته باشه
    if ((!phone && !email) || !code) {
      return NextResponse.json(
        { success: false, error: 'شماره موبایل یا ایمیل و کد تأیید الزامی است' },
        { status: 400 }
      )
    }

    // Get verification codes collection
    const verificationCodes = await getVerificationCodes()

    // Build query based on phone or email
    const query: any = {
      code,
      used: false,
      expiresAt: { $gt: new Date() }
    }

    if (phone) {
      query.phone = phone
    } else if (email) {
      query.email = email.toLowerCase()
    }

    // Find valid verification code
    const verificationRecord = await verificationCodes.findOne(query)

    if (!verificationRecord) {
      return NextResponse.json(
        { success: false, error: 'کد تأیید نامعتبر یا منقضی شده است' },
        { status: 400 }
      )
    }

    // Code is valid - don't mark as used yet, just confirm it's valid
    return NextResponse.json({
      success: true,
      message: 'کد تأیید معتبر است'
    })

  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در سرور' },
      { status: 500 }
    )
  }
}