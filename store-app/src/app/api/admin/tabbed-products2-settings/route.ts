import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await connectDB();
    
    const settings = await db.tabbedProducts2Settings.findOne({});
    
    if (!settings) {
      // Default settings
      const defaultSettings = {
        discountedTab: {
          title: 'محصولات تخفیف‌دار',
          subtitle: 'بهترین تخفیف‌ها را از دست ندهید',
          displayCount: 8,
          selectedProducts: [],
          sortOrder: 'latest'
        },
        active: true
      };
      
      return NextResponse.json({
        success: true,
        settings: defaultSettings
      });
    }

    return NextResponse.json({
      success: true,
      settings: settings
    });
  } catch (error) {
    console.error('Tabbed Products 2 Settings GET error:', error);
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

    const result = await db.tabbedProducts2Settings.replaceOne(
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
    console.error('Tabbed Products 2 Settings POST error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره تنظیمات' },
      { status: 500 }
    );
  }
}
