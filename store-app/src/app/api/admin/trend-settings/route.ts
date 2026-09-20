import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// GET /api/admin/trend-settings - دریافت تنظیمات بخش محصولات ترند
export async function GET() {
  try {
    const mongodb = await connectDB();
    
    const settings = await mongodb.trendSettings.findOne({});
    
    // Default settings اگر هیچ تنظیماتی وجود نداشت
    const defaultSettings = {
      displayCount: 8,
      sortBy: 'newest',
      active: true,
      title: 'محصولات ترند',
      subtitle: 'محبوب‌ترین محصولات',
    };

    return NextResponse.json({
      success: true,
      data: settings || defaultSettings,
      message: 'تنظیمات بخش ترند با موفقیت دریافت شد'
    });

  } catch (error) {
    console.error('Trend settings GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    );
  }
}

// POST /api/admin/trend-settings - بروزرسانی تنظیمات
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mongodb = await connectDB();

    const settingsData = {
      displayCount: body.displayCount || 8,
      sortBy: body.sortBy || 'newest',
      active: body.active !== undefined ? body.active : true,
      title: body.title || 'محصولات ترند',
      subtitle: body.subtitle || 'محبوب‌ترین محصولات',
      updatedAt: new Date()
    };

    await mongodb.trendSettings.replaceOne(
      {},
      { ...settingsData, createdAt: new Date() },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      data: settingsData,
      message: 'تنظیمات با موفقیت بروزرسانی شد'
    });

  } catch (error) {
    console.error('Trend settings POST error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی تنظیمات' },
      { status: 500 }
    );
  }
}