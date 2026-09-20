import { NextRequest, NextResponse } from 'next/server';
import { SEOSettings } from '@/types/seo';
import fs from 'fs';
import path from 'path';

const SEO_DATA_PATH = path.join(process.cwd(), 'data', 'seo-settings.json');

const readSEOSettings = (): SEOSettings[] => {
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

export async function GET() {
  try {
    const allSettings = readSEOSettings();
    const globalSettings = allSettings.find(s => s.id === 'global') || {
      id: 'global',
      title: 'فروشگاه آنلاین',
      description: 'بهترین محصولات با کیفیت عالی',
      keywords: ['فروشگاه', 'آنلاین', 'خرید'],
      siteName: 'فروشگاه من',
      siteUrl: 'https://mystore.com',
      locale: 'fa-IR',
      pageType: 'home'
    };
    
    return NextResponse.json(globalSettings);
  } catch (error) {
    console.error('خطا در دریافت تنظیمات کلی SEO:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تنظیمات کلی SEO' },
      { status: 500 }
    );
  }
}