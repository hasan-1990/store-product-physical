import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

interface SMSSettings {
  apiKey: string;
  lineNumber: string;
  templateIds: {
    orderConfirmation: number;
    shipping: number;
    verificationCode: number;
  };
  isActive: boolean;
}

export async function GET() {
  try {
    const mongodb = await connectDB();
    
    const settings = await mongodb.smsSettings.findOne({});
    
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          apiKey: '',
          lineNumber: '',
          templateIds: {
            orderConfirmation: 0,
            shipping: 0,
            verificationCode: 0,
          },
          isActive: false
        }
      });
    }

    // برای صفحه تنظیمات، API Key واقعی را برگردان
    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('SMS Settings GET Error:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت تنظیمات پیامک'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SMSSettings = await request.json();
    
    const mongodb = await connectDB();
    
    // ذخیره تنظیمات جدید
    const settings = {
      apiKey: body.apiKey,
      lineNumber: body.lineNumber,
      templateIds: body.templateIds,
      isActive: body.isActive,
      updatedAt: new Date()
    };

    await mongodb.smsSettings.replaceOne(
      {},
      settings,
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'تنظیمات پیامک با موفقیت ذخیره شد'
    });

  } catch (error) {
    console.error('SMS Settings POST Error:', error);
    return NextResponse.json({
      success: false,
      message: 'خطا در ذخیره تنظیمات پیامک'
    }, { status: 500 });
  }
}
