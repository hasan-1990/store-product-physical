import { NextRequest, NextResponse } from 'next/server';
import smsService from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const { mobile } = await request.json();

    if (!mobile) {
      return NextResponse.json({
        success: false,
        message: 'شماره موبایل الزامی است'
      }, { status: 400 });
    }

    console.log('🧪 Testing SMS with mobile:', mobile);

    // تست اعتبارسنجی شماره
    const isValidMobile = smsService.isValidIranianMobile(mobile);
    console.log('📱 Mobile validation:', isValidMobile);

    if (!isValidMobile) {
      return NextResponse.json({
        success: false,
        message: 'شماره موبایل نامعتبر است'
      }, { status: 400 });
    }

    // فرمت کردن شماره
    const formattedMobile = smsService.formatMobileNumber(mobile);
    console.log('🔄 Formatted mobile:', formattedMobile);

    // تست ارسال
    const result = await smsService.sendVerificationCode({
      mobile: formattedMobile,
      code: '12345'
    });

    console.log('📤 SMS Result:', result);

    return NextResponse.json({
      success: true,
      data: {
        originalMobile: mobile,
        formattedMobile,
        isValidMobile,
        smsResult: result
      }
    });

  } catch (error: any) {
    console.error('🚨 SMS Test Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'خطای نامشخص',
      error: error.toString()
    }, { status: 500 });
  }
}
