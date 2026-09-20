import { NextRequest, NextResponse } from 'next/server';
import { SEOSettings } from '@/types/seo';
import fs from 'fs';
import path from 'path';

const SEO_DATA_PATH = path.join(process.cwd(), 'data', 'seo-settings.json');

// اطمینان از وجود فولدر data
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// خواندن تنظیمات SEO
const readSEOSettings = (): SEOSettings[] => {
  ensureDataDir();
  try {
    if (fs.existsSync(SEO_DATA_PATH)) {
      const data = fs.readFileSync(SEO_DATA_PATH, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('خطا در خواندن تنظیمات SEO:', error);
    return [];
  }
};

// نوشتن تنظیمات SEO
const writeSEOSettings = (settings: SEOSettings[]): boolean => {
  ensureDataDir();
  try {
    fs.writeFileSync(SEO_DATA_PATH, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('خطا در نوشتن تنظیمات SEO:', error);
    return false;
  }
};

// GET - دریافت تنظیمات SEO
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const isGlobal = searchParams.get('global') === 'true';
    
    const allSettings = readSEOSettings();
    
    if (isGlobal) {
      // تنظیمات کلی
      const globalSettings = allSettings.find(s => s.id === 'global') || {
        id: 'global',
        title: 'فروشگاه آنلاین',
        description: 'بهترین محصولات با کیفیت عالی',
        keywords: ['فروشگاه', 'آنلاین', 'خرید'],
        siteName: 'فروشگاه من',
        siteUrl: 'https://mystore.com',
        locale: 'fa-IR',
        pageType: 'home' as any
      };
      
      return NextResponse.json(globalSettings);
    }
    
    if (url) {
      // تنظیمات خاص صفحه
      const pageSettings = allSettings.find(s => s.canonicalUrl === url || s.slug === url);
      if (pageSettings) {
        return NextResponse.json(pageSettings);
      }
    }
    
    // بازگشت همه تنظیمات
    return NextResponse.json(allSettings);
    
  } catch (error) {
    console.error('خطا در دریافت تنظیمات SEO:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تنظیمات SEO' },
      { status: 500 }
    );
  }
}

// POST - ذخیره تنظیمات SEO
export async function POST(request: NextRequest) {
  try {
    const newSettings: SEOSettings = await request.json();
    
    // اعتبارسنجی ورودی
    if (!newSettings.title || !newSettings.description) {
      return NextResponse.json(
        { error: 'عنوان و توضیحات الزامی است' },
        { status: 400 }
      );
    }
    
    const allSettings = readSEOSettings();
    
    // تولید ID و timestamps
    const now = new Date().toISOString();
    newSettings.id = newSettings.id || `seo_${Date.now()}`;
    newSettings.updatedAt = now;
    if (!newSettings.createdAt) {
      newSettings.createdAt = now;
    }
    
    // محاسبه طول عنوان و توضیحات
    newSettings.titleLength = newSettings.title.length;
    newSettings.descriptionLength = newSettings.description.length;
    
    // پیدا کردن و به‌روزرسانی یا اضافه کردن
    const existingIndex = allSettings.findIndex(s => 
      s.id === newSettings.id || 
      (s.canonicalUrl && s.canonicalUrl === newSettings.canonicalUrl) ||
      (s.slug && s.slug === newSettings.slug)
    );
    
    if (existingIndex >= 0) {
      allSettings[existingIndex] = { ...allSettings[existingIndex], ...newSettings };
    } else {
      allSettings.push(newSettings);
    }
    
    // ذخیره در فایل
    const success = writeSEOSettings(allSettings);
    
    if (success) {
      return NextResponse.json(newSettings);
    } else {
      return NextResponse.json(
        { error: 'خطا در ذخیره تنظیمات' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('خطا در ذخیره تنظیمات SEO:', error);
    return NextResponse.json(
      { error: 'خطا در ذخیره تنظیمات SEO' },
      { status: 500 }
    );
  }
}

// DELETE - حذف تنظیمات SEO
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'شناسه الزامی است' },
        { status: 400 }
      );
    }
    
    const allSettings = readSEOSettings();
    const filteredSettings = allSettings.filter(s => s.id !== id);
    
    const success = writeSEOSettings(filteredSettings);
    
    if (success) {
      return NextResponse.json({ message: 'تنظیمات با موفقیت حذف شد' });
    } else {
      return NextResponse.json(
        { error: 'خطا در حذف تنظیمات' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('خطا در حذف تنظیمات SEO:', error);
    return NextResponse.json(
      { error: 'خطا در حذف تنظیمات SEO' },
      { status: 500 }
    );
  }
}