import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getGlobalSEOSettings } from '@/lib/seo-helpers';
import { getDynamicContent } from '@/lib/dynamicContent';

// GET /api/public-settings - Get public settings for frontend (no auth required)
export async function GET() {
  try {
    const db = await connectDB();
    
    // ✅ دریافت محتوای داینامیک (اولویت اول)
    const dynamicContent = await getDynamicContent();
    
    // دریافت تنظیمات SEO (fallback)
    const seoSettings = await getGlobalSEOSettings();
    
    // استخراج تنظیمات از SEO با type safety
    const aboutPage = (seoSettings as any)?.aboutPage || {};
    const contact = (seoSettings as any)?.contact || {};
    const socialMedia = (seoSettings as any)?.socialMedia || {};
    
    // ترکیب محتوای داینامیک و SEO - محتوای داینامیک اولویت دارد
    const defaultSettings = {
      site_name: dynamicContent.site_name || dynamicContent.logo_text || (seoSettings as any)?.siteName || (seoSettings as any)?.siteTitle || "فروشگاه",
      site_description: dynamicContent.site_description || (seoSettings as any)?.siteDescription || "مقصد نهایی تجارت الکترونیک شما",
      seo_description: dynamicContent.seo_description || (seoSettings as any)?.siteDescription || "محصولات با کیفیت را با قیمت‌های شکست ناپذیر کشف کنید",
      seo_keywords: dynamicContent.seo_keywords || (seoSettings as any)?.seoKeywords || "تجارت الکترونیک, خرید آنلاین",
      
      // اطلاعات تماس از SEO
      contact_email: contact.email || "info@shop.com",
      contact_phone: contact.phone || "021-12345678",
      contact_address: contact.address || "تهران، خیابان آزادی",
      
      // شبکه‌های اجتماعی از SEO
      facebook_url: socialMedia.facebook || "",
      instagram_url: socialMedia.instagram || "",
      twitter_url: socialMedia.twitter || "",
      telegram_url: socialMedia.telegram || "",
      
      // صفحه درباره ما از SEO
      hero_title: aboutPage.heroTitle || 'درباره ما',
      hero_subtitle: aboutPage.heroSubtitle || 'مقصد نهایی تجارت الکترونیک شما',
      hero_badge_text: aboutPage.heroBadgeText || 'به وب‌سایت ما خوش آمدید',
      story_title: aboutPage.storyTitle || 'داستان ما',
      story_subtitle: aboutPage.storySubtitle || 'داستان موفقیت ما',
      story_paragraph_1: aboutPage.storyParagraph1 || 'ما با هدف ارائه بهترین تجربه خرید آنلاین تأسیس شدیم.',
      story_paragraph_2: aboutPage.storyParagraph2 || 'تمرکز ما بر کیفیت محصولات و خدمات عالی است.',
      story_paragraph_3: aboutPage.storyParagraph3 || 'امروز به هزاران مشتری راضی خدمات ارائه می‌دهیم.',
      mission_title: aboutPage.missionTitle || 'ماموریت ما',
      mission_description: aboutPage.missionDescription || 'ارائه بهترین محصولات با بالاترین کیفیت',
      values_title: aboutPage.valuesTitle || 'ارزش‌های ما',
      values_subtitle: aboutPage.valuesSubtitle || 'اصولی که ما را راهنمایی می‌کند',
      value_1_title: aboutPage.value1Title || 'رضایت مشتری',
      value_1_description: aboutPage.value1Description || 'رضایت شما بالاترین اولویت ماست',
      value_2_title: aboutPage.value2Title || 'کیفیت بی‌نظیر',
      value_2_description: aboutPage.value2Description || 'محصولات با دقت کنترل می‌شوند',
      value_3_title: aboutPage.value3Title || 'نوآوری مداوم',
      value_3_description: aboutPage.value3Description || 'همیشه در حال بهبود هستیم',
      contact_title: aboutPage.contactTitle || 'با ما در تماس باشید',
      contact_subtitle: aboutPage.contactSubtitle || 'آماده پاسخگویی به سوالات شما هستیم',
      social_title: aboutPage.socialTitle || 'ما را دنبال کنید',
      social_subtitle: aboutPage.socialSubtitle || 'آخرین اخبار و محصولات جدید را دنبال کنید'
    };

    try {
      // خواندن تنظیمات از دیتابیس
      const settings = await db.settings.find({}).toArray();
      
      // تبدیل آرایه تنظیمات به آبجکت
      const settingsObj = settings.reduce((acc, setting) => {
        let value: any = setting.value;
        
        // پارس بر اساس نوع
        if (setting.type === 'boolean') {
          value = setting.value === 'true';
        } else if (setting.type === 'number') {
          value = parseFloat(setting.value);
        } else if (setting.type === 'json') {
          try {
            value = JSON.parse(setting.value);
          } catch {
            value = setting.value;
          }
        }
        
        acc[setting.key] = value;
        return acc;
      }, {} as Record<string, any>);

      // ترکیب مقادیر پیش‌فرض با تنظیمات دیتابیس و SEO
      const finalSettings = { 
        ...defaultSettings, 
        ...settingsObj,
        // اولویت با تنظیمات SEO
        site_name: settingsObj.site_name || seoSettings?.siteName || seoSettings?.siteTitle || defaultSettings.site_name,
        site_description: settingsObj.site_description || seoSettings?.siteDescription || defaultSettings.site_description,
        seo_description: settingsObj.seo_description || seoSettings?.siteDescription || defaultSettings.seo_description,
        // نرخ مالیات از تنظیمات عمومی سایت (از ?? برای پشتیبانی از 0 استفاده می‌کنیم)
        taxRate: settingsObj.taxRate ?? 9,
        shippingCost: settingsObj.shippingCost ?? 50000,
        freeShippingThreshold: settingsObj.freeShippingThreshold ?? 1000000
      };

      return NextResponse.json({
        success: true,
        data: finalSettings
      });
    } catch (dbError) {
      console.error('Error reading from database:', dbError);
      // در صورت خطا، تنظیمات پیش‌فرض را برگردان
      return NextResponse.json({
        success: true,
        data: defaultSettings
      });
    }
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    );
  }
}
