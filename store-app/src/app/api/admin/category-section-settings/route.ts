import { NextRequest, NextResponse } from 'next/server';
import { connectDB, mongodb } from '@/lib/mongodb';

export async function GET() {
  try {
    await connectDB();
    const collection = mongodb.categorySectionSettings;
    const settings = await collection.findOne({});
    return NextResponse.json({
      success: true,
      data: settings || {
        displayCount: 6,
        layout: 'order',
        showCount: true,
        active: true,
        selectedCategories: []
      }
    });
  } catch {
    return NextResponse.json({ success: false, error: 'خطا در دریافت تنظیمات' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const collection = mongodb.categorySectionSettings;
    await collection.updateOne({}, { $set: body }, { upsert: true });
    const settings = await collection.findOne({});
    return NextResponse.json({
      success: true,
      data: settings,
      message: 'تنظیمات با موفقیت ذخیره شد'
    });
  } catch {
    return NextResponse.json({ success: false, error: 'خطا در ذخیره تنظیمات' }, { status: 500 });
  }
}
