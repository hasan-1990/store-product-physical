import { NextRequest, NextResponse } from 'next/server';
import { connectDB, mongodb } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await connectDB();
    const collection = db.whyUsSectionSettings;
    console.log('WHYUS GET collection:', collection);
    if (!collection || typeof collection.findOne !== 'function') {
      console.error('WHYUS GET ERROR: collection is invalid', collection);
      return NextResponse.json({ success: false, error: 'collection is invalid', details: String(collection) }, { status: 500 });
    }
    const settings = await collection.findOne({});
    console.log('WHYUS GET settings:', settings);
    return NextResponse.json({
      success: true,
      data: settings || {
        title: 'چرا فروشگاه دیجیتال را انتخاب کنیم؟',
        subtitle: 'ما بهترین تجربه خرید را با این مزایای شگفت‌انگیز فراهم می‌کنیم',
        items: [
          {
            icon: 'fast',
            title: 'ارسال سریع',
            description: 'ارسال رایگان برای سفارش‌های بالای ۵۰ دلار. محصولات خود را سریع با گزینه‌های ارسال فوری دریافت کنید.'
          },
          {
            icon: 'quality',
            title: 'تضمین کیفیت',
            description: '۱۰۰٪ تضمین رضایت. اگر کاملاً راضی نیستید، هر محصولی را ظرف ۳۰ روز بازگردانید.'
          },
          {
            icon: 'support',
            title: 'پشتیبانی ۲۴/۷',
            description: 'تیم پشتیبانی اختصاصی ما در هر زمان و هر مکان آماده کمک به شما است. هر وقت به کمک نیاز داشتید، با ما تماس بگیرید.'
          }
        ]
      }
    });
  } catch (err) {
    console.error('WHYUS GET ERROR:', err);
    return NextResponse.json({ success: false, error: 'خطا در دریافت تنظیمات', details: String(err) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await connectDB();
    const body = await request.json();
    const collection = db.whyUsSectionSettings;
    console.log('WHYUS PUT collection:', collection);
    if (!collection || typeof collection.updateOne !== 'function') {
      console.error('WHYUS PUT ERROR: collection is invalid', collection);
      return NextResponse.json({ success: false, error: 'collection is invalid', details: String(collection) }, { status: 500 });
    }
    await collection.updateOne({}, { $set: body }, { upsert: true });
    const settings = await collection.findOne({});
    return NextResponse.json({
      success: true,
      data: settings,
      message: 'تنظیمات با موفقیت ذخیره شد'
    });
  } catch (err) {
    console.error('WHYUS PUT ERROR:', err);
    return NextResponse.json({ success: false, error: 'خطا در ذخیره تنظیمات', details: String(err) }, { status: 500 });
  }
}
