import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// GET - دریافت تنظیمات بخش گارانتی‌ها
export async function GET() {
  try {
    const db = await connectDB();
    const collection = db.guaranteeSettings;
    
    let settings = await collection.findOne({});
    
    // اگر تنظیمات پیش‌فرض وجود نداشت، ایجاد کن
    if (!settings) {
      const defaultSettings = {
        sectionTitle: 'تضمین خرید امن',
        sectionSubtitle: 'خرید از فروشگاه ما با اطمینان کامل',
        showSection: true,
        backgroundColor: '#f8f9fa',
        guarantees: [
          {
            id: '1',
            title: 'گارانتی اصالت کالا',
            description: 'تمام محصولات اصل و با گارانتی معتبر',
            icon: '✅',
            iconType: 'emoji',
            active: true,
            order: 1
          },
          {
            id: '2',
            title: '۷ روز ضمانت بازگشت',
            description: 'امکان بازگشت کالا تا ۷ روز پس از خرید',
            icon: '🔄',
            iconType: 'emoji',
            active: true,
            order: 2
          },
          {
            id: '3',
            title: 'پشتیبانی ۲۴ساعته',
            description: 'پاسخگویی به سوالات شما در هر زمان',
            icon: '💬',
            iconType: 'emoji',
            active: true,
            order: 3
          },
          {
            id: '4',
            title: 'پرداخت امن',
            description: 'پرداخت با درگاه‌های معتبر بانکی',
            icon: '🔒',
            iconType: 'emoji',
            active: true,
            order: 4
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await collection.insertOne(defaultSettings);
      settings = await collection.findOne({});
    }
    
    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching guarantee settings:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در دریافت تنظیمات گارانتی‌ها'
    }, { status: 500 });
  }
}

// PUT - بروزرسانی تنظیمات بخش گارانتی‌ها
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const db = await connectDB();
    const collection = db.guaranteeSettings;
    
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    delete updateData._id; // حذف _id برای جلوگیری از خطا
    
    const result = await collection.findOneAndUpdate(
      {},
      { $set: updateData },
      { 
        upsert: true,
        returnDocument: 'after'
      }
    );
    
    return NextResponse.json({
      success: true,
      message: 'تنظیمات گارانتی‌ها با موفقیت بروزرسانی شد',
      data: result
    });
  } catch (error) {
    console.error('Error updating guarantee settings:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در بروزرسانی تنظیمات گارانتی‌ها'
    }, { status: 500 });
  }
}
