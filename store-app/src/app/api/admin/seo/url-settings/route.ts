import { NextRequest, NextResponse } from 'next/server';
import { getUrlSettings } from '@/lib/url-settings';
import fs from 'fs';
import path from 'path';

// GET - دریافت تنظیمات URL فعلی
export async function GET() {
  try {
    const settings = getUrlSettings();
    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('خطا در دریافت تنظیمات URL:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    );
  }
}

// POST - ذخیره تنظیمات URL جدید
export async function POST(request: NextRequest) {
  try {
    const newSettings = await request.json();
    
    // اعتبارسنجی ورودی
    const validStructures = ['id-only', 'product-only', 'category-product'];
    if (!validStructures.includes(newSettings.urlStructure)) {
      return NextResponse.json(
        { success: false, error: 'ساختار URL نامعتبر است' },
        { status: 400 }
      );
    }
    
    // تنظیمات پیش‌فرض
    const defaultSettings = {
      urlStructure: 'id-only',
      categoryPrefix: '',
      productPrefix: '',
      removeStopWords: false,
      slugLanguage: 'persian',
      maxSlugLength: 50,
      separatorType: '-',
      includeId: true,
      removeNumbers: false
    };
    
    // ترکیب تنظیمات جدید با پیش‌فرض
    const finalSettings = {
      ...defaultSettings,
      ...newSettings
    };
    
    // ذخیره در فایل
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const settingsPath = path.join(dataDir, 'url-settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(finalSettings, null, 2));
    
    return NextResponse.json({
      success: true,
      data: finalSettings,
      message: 'تنظیمات URL با موفقیت ذخیره شد'
    });
  } catch (error) {
    console.error('خطا در ذخیره تنظیمات URL:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره تنظیمات' },
      { status: 500 }
    );
  }
}