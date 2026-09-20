import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// GET - دریافت تنظیمات بخش جدیدترین محصولات
export async function GET() {
  try {
    const db = await connectDB();
    const collection = db.latestProductsSettings;
    
    let settings = await collection.findOne({});
    
    // اگر تنظیمات وجود نداشت، ایجاد کن
    if (!settings) {
      const defaultSettings = {
        title: 'جدیدترین محصولات',
        subtitle: 'آخرین محصولات اضافه شده به فروشگاه',
        maxProducts: 8,
        active: true,
        selectionMode: 'latest',
        autoUpdateInterval: 24, // هر 24 ساعت
        selectedProducts: [],
        displayStyle: 'grid',
        showDiscount: true,
        showRating: true,
        showQuickView: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await collection.insertOne(defaultSettings);
      settings = await collection.findOne({});
    }
    
    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching latest products settings:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در دریافت تنظیمات'
    }, { status: 500 });
  }
}

// PUT - بروزرسانی تنظیمات بخش جدیدترین محصولات
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const db = await connectDB();
    const collection = db.latestProductsSettings;
    
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    // حذف _id از updateData اگر وجود داشته باشد
    const { _id, ...dataWithoutId } = updateData;
    
    const result = await collection.findOneAndUpdate(
      {},
      { $set: dataWithoutId },
      { 
        upsert: true,
        returnDocument: 'after'
      }
    );
    
    return NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت بروزرسانی شد',
      settings: result || dataWithoutId
    });
  } catch (error) {
    console.error('Error updating latest products settings:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در بروزرسانی تنظیمات'
    }, { status: 500 });
  }
}
