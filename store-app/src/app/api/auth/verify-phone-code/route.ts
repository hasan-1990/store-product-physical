import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    console.log('📱 Verify Phone Code Request:', { phone, code });

    if (!phone || !code) {
      console.log('❌ Missing phone or code');
      return NextResponse.json(
        { error: 'شماره موبایل و کد تایید الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Find verification code
    const verificationRecord = await db.verificationCodes.findOne({
      phone,
      code,
      type: 'password_reset',
      used: false,
      expiresAt: { $gt: new Date() }
    });

    console.log('🔍 Verification record found:', verificationRecord ? 'Yes' : 'No');
    
    if (!verificationRecord) {
      // Check if code exists but is expired or used
      const anyRecord = await db.verificationCodes.findOne({
        phone,
        code,
        type: 'password_reset'
      });
      
      console.log('🔍 Any record with this code:', anyRecord);
      
      if (anyRecord) {
        if (anyRecord.used) {
          return NextResponse.json(
            { error: 'این کد قبلاً استفاده شده است' },
            { status: 400 }
          );
        }
        if (anyRecord.expiresAt < new Date()) {
          return NextResponse.json(
            { error: 'کد تایید منقضی شده است' },
            { status: 400 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'کد تایید نامعتبر است' },
        { status: 400 }
      );
    }

    // Code is valid - don't mark as used yet (will be used in password reset)
    return NextResponse.json({
      success: true,
      message: 'کد تایید صحیح است'
    });

  } catch (error) {
    console.error('❌ Error in verify-phone-code API:', error);
    return NextResponse.json(
      { error: 'خطا در تایید کد' },
      { status: 500 }
    );
  }
}
