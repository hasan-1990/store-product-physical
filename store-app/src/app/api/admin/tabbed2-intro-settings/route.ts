import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await connectDB();
    
    const settings = await db.tabbedProducts2IntroSettings.findOne({});
    
    if (!settings) {
      // Default settings
      const defaultSettings = {
        title: 'پیشنهادات ویژه ما',
        subtitle: 'بهترین تخفیف‌ها را از دست ندهید'
      };
      
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Tabbed Products 2 Intro Settings GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB();
    const body = await request.json();

    const result = await db.tabbedProducts2IntroSettings.replaceOne(
      {},
      { ...body, updatedAt: new Date() },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شد',
      data: result
    });
  } catch (error) {
    console.error('Tabbed Products 2 Intro Settings POST error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره تنظیمات' },
      { status: 500 }
    );
  }
}
