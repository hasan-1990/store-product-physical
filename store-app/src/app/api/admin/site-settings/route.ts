import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const settingsFilePath = path.join(process.cwd(), 'data', 'site-settings.json');

// دریافت تنظیمات سایت
export async function GET() {
  try {
    const fileContent = await fs.readFile(settingsFilePath, 'utf-8');
    const settings = JSON.parse(fileContent);
    
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('خطا در خواندن تنظیمات:', error);
    
    // تنظیمات پیش‌فرض
    const defaultSettings = {
      site_name: "فروشگاه هاب",
      site_description: "تامین کننده قالب های وردپرس و افزونه های وب",
      seo_description: "محصولات با کیفیت را با قیمت‌های شکست ناپذیر کشف کنید. الکترونیک، مد، لوازم خانگی و موارد دیگر را با ارسال سریع و خدمات عالی مشتریان خریداری کنید.",
      seo_keywords: "تجارت الکترونیک, خرید, الکترونیک, مد و پوشاک, لوازم خانگی"
    };
    
    return NextResponse.json({ success: true, settings: defaultSettings });
  }
}

// بروزرسانی تنظیمات سایت
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { site_name, site_description, seo_description, seo_keywords } = body;
    
    // اعتبارسنجی
    if (!site_name || !site_description) {
      return NextResponse.json(
        { success: false, error: 'نام و توضیحات سایت الزامی است' },
        { status: 400 }
      );
    }
    
    // ساخت شی تنظیمات جدید
    const newSettings = {
      site_name,
      site_description,
      seo_description: seo_description || '',
      seo_keywords: seo_keywords || ''
    };
    
    // ذخیره در فایل
    await fs.writeFile(settingsFilePath, JSON.stringify(newSettings, null, 2), 'utf-8');
    
    return NextResponse.json({ 
      success: true, 
      message: 'تنظیمات با موفقیت بروزرسانی شد',
      settings: newSettings
    });
  } catch (error) {
    console.error('خطا در بروزرسانی تنظیمات:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی تنظیمات' },
      { status: 500 }
    );
  }
}
