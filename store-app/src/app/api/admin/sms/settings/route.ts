import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const mongodb = await connectDB();
    const dbSettings = await mongodb.smsSettings.findOne({});
    
    let settings;
    if (!dbSettings) {
      // اگر تنظیمات وجود نداشت، از environment variables استفاده کن
      settings = {
        provider: 'smsir',
        apiKey: process.env.SMSIR_API_KEY || '',
        lineNumber: process.env.SMSIR_LINE_NUMBER || '',
        isActive: true
      };
    } else {
      settings = {
        provider: dbSettings.provider || 'smsir',
        apiKey: dbSettings.apiKey || '',
        lineNumber: dbSettings.lineNumber || '',
        isActive: dbSettings.isActive !== undefined ? dbSettings.isActive : true
      };
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey, lineNumber, isActive } = await request.json();

    const mongodb = await connectDB();
    
    const settings = {
      provider: provider || 'smsir',
      apiKey: apiKey || '',
      lineNumber: lineNumber || '',
      isActive: isActive !== undefined ? isActive : true,
      templateIds: {
        orderConfirmation: 123456,
        shipping: 123457,
        verificationCode: 123458
      },
      updatedAt: new Date()
    };

    await mongodb.smsSettings.replaceOne({}, settings, { upsert: true });

    console.log('SMS Settings saved:', {
      provider: settings.provider,
      apiKey: apiKey ? '***' : '',
      lineNumber: settings.lineNumber,
      isActive: settings.isActive
    });

    return NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شد'
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در ذخیره تنظیمات' },
      { status: 500 }
    );
  }
}
