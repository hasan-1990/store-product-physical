import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// GET - دریافت تنظیمات بخش نظرات مشتریان
export async function GET() {
  try {
    const db = await connectDB();
    const collection = db.testimonialSettings;
    
    let settings = await collection.findOne({});
    
    // اگر تنظیمات پیش‌فرض وجود نداشت، ایجاد کن
    if (!settings) {
      const defaultSettings = {
        sectionTitle: 'نظرات مشتریان',
        sectionSubtitle: 'آنچه مشتریان درباره ما می‌گویند',
        showSection: true,
        autoPlay: true,
        autoPlayInterval: 5000,
        backgroundColor: '#ffffff',
        testimonials: [
          {
            id: '1',
            customerName: 'احمد محمدی',
            customerRole: 'مدیر فروش',
            customerAvatar: '',
            rating: 5,
            comment: 'کیفیت محصولات عالی و ارسال سریع. خرید من فوق‌العاده بود و حتماً دوباره خرید می‌کنم.',
            productName: '',
            verified: true,
            featured: true,
            active: true,
            order: 1
          },
          {
            id: '2',
            customerName: 'سارا حسینی',
            customerRole: 'معلم',
            customerAvatar: '',
            rating: 5,
            comment: 'پشتیبانی عالی و محصولات باکیفیت. از خریدم بسیار راضی هستم و به همه پیشنهاد می‌کنم.',
            productName: '',
            verified: true,
            featured: true,
            active: true,
            order: 2
          },
          {
            id: '3',
            customerName: 'رضا کریمی',
            customerRole: 'مهندس',
            customerAvatar: '',
            rating: 4,
            comment: 'قیمت مناسب و کیفیت خوب. تجربه خوبی از خرید اینترنتی داشتم.',
            productName: '',
            verified: true,
            featured: false,
            active: true,
            order: 3
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
    console.error('Error fetching testimonial settings:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در دریافت تنظیمات نظرات'
    }, { status: 500 });
  }
}

// PUT - بروزرسانی تنظیمات بخش نظرات مشتریان
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const db = await connectDB();
    const collection = db.testimonialSettings;
    
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
      message: 'تنظیمات نظرات با موفقیت بروزرسانی شد',
      data: result
    });
  } catch (error) {
    console.error('Error updating testimonial settings:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در بروزرسانی تنظیمات نظرات'
    }, { status: 500 });
  }
}
