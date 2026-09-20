import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// GET - دریافت تنظیمات بخش ویژگی‌ها
export async function GET() {
  try {
    const db = await connectDB();
    const collection = db.featuresSettings;
    
    let settings = await collection.findOne({});
    
    // اگر تنظیمات پیش‌فرض وجود نداشت، ایجاد کن
    if (!settings) {
      const defaultSettings = {
        sectionTitle: 'چرا ما را انتخاب کنید؟',
        sectionSubtitle: 'مزایای خرید از فروشگاه ما',
        showSection: true,
        layout: 'grid',
        columns: 4,
        backgroundColor: '#f8f9fa',
        features: [
          {
            id: '1',
            title: 'ارسال سریع',
            description: 'ارسال به سراسر کشور در کمترین زمان ممکن',
            icon: '🚚',
            iconType: 'emoji',
            iconColor: '#3b82f6',
            active: true,
            order: 1
          },
          {
            id: '2',
            title: 'پشتیبانی ۲۴/۷',
            description: 'پاسخگویی به سوالات شما در تمام ساعات شبانه‌روز',
            icon: '💬',
            iconType: 'emoji',
            iconColor: '#10b981',
            active: true,
            order: 2
          },
          {
            id: '3',
            title: 'قیمت مناسب',
            description: 'بهترین قیمت‌ها با کیفیت تضمین شده',
            icon: '💰',
            iconType: 'emoji',
            iconColor: '#f59e0b',
            active: true,
            order: 3
          },
          {
            id: '4',
            title: 'کیفیت برتر',
            description: 'فقط بهترین محصولات از برندهای معتبر',
            icon: '⭐',
            iconType: 'emoji',
            iconColor: '#ef4444',
            active: true,
            order: 4
          },
          {
            id: '5',
            title: 'پرداخت امن',
            description: 'پرداخت از طریق درگاه‌های معتبر بانکی',
            icon: '🔒',
            iconType: 'emoji',
            iconColor: '#8b5cf6',
            active: true,
            order: 5
          },
          {
            id: '6',
            title: 'ضمانت بازگشت',
            description: 'امکان بازگشت کالا تا ۷ روز پس از خرید',
            icon: '🔄',
            iconType: 'emoji',
            iconColor: '#ec4899',
            active: true,
            order: 6
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
    console.error('Error fetching features settings:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در دریافت تنظیمات ویژگی‌ها'
    }, { status: 500 });
  }
}

// PUT - بروزرسانی تنظیمات بخش ویژگی‌ها
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const db = await connectDB();
    const collection = db.featuresSettings;
    
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
      message: 'تنظیمات ویژگی‌ها با موفقیت بروزرسانی شد',
      data: result
    });
  } catch (error) {
    console.error('Error updating features settings:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در بروزرسانی تنظیمات ویژگی‌ها'
    }, { status: 500 });
  }
}
