import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await connectDB();
    
    const settings = await db.settings.findOne({ key: 'discount_products' });
    
    const defaultSettings = {
      active: true,
      title: 'محصولات تخفیفی',
      subtitle: 'بهترین پیشنهادات ویژه برای شما',
      maxProducts: 6,
      showDiscountBadge: true
    };

    return NextResponse.json({
      success: true,
      data: settings?.value || defaultSettings
    });

  } catch (error) {
    console.error('Error fetching discount products settings:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await connectDB();
    
    await db.settings.updateOne(
      { key: 'discount_products' },
      { $set: { key: 'discount_products', value: body } },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شد'
    });

  } catch (error) {
    console.error('Error saving discount products settings:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره تنظیمات' },
      { status: 500 }
    );
  }
}