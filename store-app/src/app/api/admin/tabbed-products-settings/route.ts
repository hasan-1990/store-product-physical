import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

interface TabbedProductsSettings {
  type: string;
  title: string;
  subtitle: string;
  active: boolean;
  featuredSection: {
    title: string;
    subtitle: string;
    active: boolean;
    count: number;
  };
  latestSection: {
    title: string;
    subtitle: string;
    active: boolean;
    count: number;
  };
}

// GET - دریافت تنظیمات
export async function GET() {
  try {
    const db = await connectDB();
    
    let settings = await db.tabbedProducts2Settings.findOne({});
    
    // اگر تنظیمات وجود نداشت، تنظیمات پیش‌فرض ایجاد کن
    if (!settings) {
      const defaultSettings: TabbedProductsSettings = {
        type: 'tabbed-products',
        title: 'محصولات ویژه و جدیدترین',
        subtitle: 'بهترین محصولات را اینجا بیابید',
        active: true,
        featuredSection: {
          title: 'محصولات ویژه',
          subtitle: 'انتخاب شده توسط ما',
          active: true,
          count: 8
        },
        latestSection: {
          title: 'جدیدترین محصولات',
          subtitle: 'آخرین محصولات اضافه شده',
          active: true,
          count: 8
        }
      };
      
      const insertResult = await db.tabbedProducts2Settings.insertOne(defaultSettings);
      settings = { ...defaultSettings, _id: insertResult.insertedId };
    }

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('خطا در دریافت تنظیمات tabbed products:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    );
  }
}

// POST - ذخیره تنظیمات
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const db = await connectDB();

    // آماده‌سازی داده‌ها برای ذخیره
    const settingsData = {
      type: 'tabbed-products',
      title: String(data.title || 'محصولات ویژه و جدیدترین'),
      subtitle: String(data.subtitle || ''),
      active: Boolean(data.active ?? true),
      featuredSection: {
        title: String(data.featuredSection?.title || 'محصولات ویژه'),
        subtitle: String(data.featuredSection?.subtitle || ''),
        active: Boolean(data.featuredSection?.active ?? true),
        count: Math.max(4, Math.min(16, Number(data.featuredSection?.count) || 8))
      },
      latestSection: {
        title: String(data.latestSection?.title || 'جدیدترین محصولات'),
        subtitle: String(data.latestSection?.subtitle || ''),
        active: Boolean(data.latestSection?.active ?? true),
        count: Math.max(4, Math.min(16, Number(data.latestSection?.count) || 8))
      },
      updatedAt: new Date()
    };

    // به‌روزرسانی یا ایجاد تنظیمات
    const result = await db.tabbedProducts2Settings.findOneAndUpdate(
      {},
      {
        $set: settingsData,
        $setOnInsert: { createdAt: new Date() }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );

    return NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شد',
      data: result
    });

  } catch (error) {
    console.error('خطا در ذخیره تنظیمات tabbed products:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره تنظیمات' },
      { status: 500 }
    );
  }
}