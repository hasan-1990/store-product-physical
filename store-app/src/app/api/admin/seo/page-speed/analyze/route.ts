import { NextRequest, NextResponse } from 'next/server';

// تحلیل سرعت صفحه برای URL مشخص
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL الزامی است' },
        { status: 400 }
      );
    }
    
    const analysis = await analyzePageSpeed(url);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('خطا در تحلیل سرعت صفحه:', error);
    return NextResponse.json(
      { error: 'خطا در تحلیل سرعت صفحه' },
      { status: 500 }
    );
  }
}

async function analyzePageSpeed(url: string) {
  try {
    // در حالت واقعی، می‌توانید از Google PageSpeed Insights API استفاده کنید
    // const API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY;
    // const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${API_KEY}&category=performance`;
    
    // شبیه‌سازی تحلیل
    await new Promise(resolve => setTimeout(resolve, 2000)); // شبیه‌سازی تأخیر
    
    const metrics = {
      lcp: Math.random() * 3 + 1, // 1-4 seconds
      fid: Math.random() * 200 + 50, // 50-250ms
      cls: Math.random() * 0.3, // 0-0.3
      fcp: Math.random() * 2 + 1, // 1-3 seconds
      ttfb: Math.random() * 1 + 0.3, // 0.3-1.3 seconds
      score: Math.floor(Math.random() * 40) + 60 // 60-100
    };
    
    const suggestions = generateSuggestions(metrics, url);
    
    return {
      url,
      metrics,
      suggestions,
      analyzedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('خطا در تحلیل:', error);
    throw error;
  }
}

function generateSuggestions(metrics: any, url: string) {
  const suggestions = [];
  
  // بررسی LCP (Largest Contentful Paint)
  if (metrics.lcp > 2.5) {
    if (metrics.lcp > 4) {
      suggestions.push({
        type: 'critical',
        title: 'Largest Contentful Paint بسیار کند',
        description: `LCP در ${metrics.lcp.toFixed(1)} ثانیه بسیار بالاتر از حد مطلوب (2.5s) است`,
        impact: 'تأثیر بسیار زیاد بر تجربه کاربری و رنکینگ Google',
        action: 'بهینه‌سازی تصاویر بزرگ، حذف منابع مسدودکننده، بهبود سرور'
      });
    } else {
      suggestions.push({
        type: 'important',
        title: 'بهبود Largest Contentful Paint',
        description: `LCP در ${metrics.lcp.toFixed(1)} ثانیه نیاز به بهینه‌سازی دارد`,
        impact: 'بهبود تجربه کاربری و امتیاز Core Web Vitals',
        action: 'فشرده‌سازی تصاویر، استفاده از CDN، preload کردن منابع مهم'
      });
    }
  }
  
  // بررسی FID (First Input Delay)
  if (metrics.fid > 100) {
    if (metrics.fid > 300) {
      suggestions.push({
        type: 'critical',
        title: 'First Input Delay بسیار بالا',
        description: `FID در ${metrics.fid.toFixed(0)}ms بسیار بالاتر از حد مطلوب (100ms) است`,
        impact: 'کاربران نمی‌توانند به سرعت با صفحه تعامل کنند',
        action: 'کاهش JavaScript، استفاده از Web Workers، بهینه‌سازی کد'
      });
    } else {
      suggestions.push({
        type: 'important',
        title: 'کاهش First Input Delay',
        description: `FID در ${metrics.fid.toFixed(0)}ms نیاز به بهینه‌سازی دارد`,
        impact: 'بهبود واکنش‌پذیری صفحه',
        action: 'کاهش اسکریپت‌های سنگین، تأخیر در اجرای کدهای غیرضروری'
      });
    }
  }
  
  // بررسی CLS (Cumulative Layout Shift)
  if (metrics.cls > 0.1) {
    if (metrics.cls > 0.25) {
      suggestions.push({
        type: 'critical',
        title: 'جابجایی لایه بسیار زیاد',
        description: `CLS در ${metrics.cls.toFixed(3)} بسیار بالاتر از حد مطلوب (0.1) است`,
        impact: 'تجربه کاربری نامطلوب و امکان کلیک اشتباه',
        action: 'تعیین ابعاد تصاویر، جلوگیری از درج محتوای دینامیک بالای محتوای موجود'
      });
    } else {
      suggestions.push({
        type: 'important',
        title: 'کاهش جابجایی لایه',
        description: `CLS در ${metrics.cls.toFixed(3)} نیاز به بهینه‌سازی دارد`,
        impact: 'بهبود ثبات بصری صفحه',
        action: 'تنظیم ابعاد عناصر، استفاده از placeholder برای محتوای دینامیک'
      });
    }
  }
  
  // بررسی FCP (First Contentful Paint)
  if (metrics.fcp > 1.8) {
    suggestions.push({
      type: metrics.fcp > 3 ? 'critical' : 'important',
      title: 'بهبود First Contentful Paint',
      description: `FCP در ${metrics.fcp.toFixed(1)} ثانیه کندتر از حد مطلوب است`,
      impact: 'کاربران دیرتر محتوا را می‌بینند',
      action: 'بهینه‌سازی CSS critical path، کاهش اندازه HTML اولیه'
    });
  }
  
  // بررسی TTFB (Time to First Byte)
  if (metrics.ttfb > 0.8) {
    suggestions.push({
      type: metrics.ttfb > 1.8 ? 'critical' : 'important',
      title: 'بهبود زمان پاسخ سرور',
      description: `TTFB در ${metrics.ttfb.toFixed(1)} ثانیه بالاتر از حد مطلوب است`,
      impact: 'تأخیر در شروع بارگیری صفحه',
      action: 'بهینه‌سازی سرور، استفاده از CDN، کش سرور'
    });
  }
  
  // پیشنهادات عمومی
  suggestions.push({
    type: 'minor',
    title: 'بهینه‌سازی تصاویر',
    description: 'استفاده از فرمت‌های مدرن تصویر',
    impact: 'کاهش حجم صفحه و بهبود سرعت',
    action: 'تبدیل تصاویر به WebP/AVIF، فعال‌سازی Lazy Loading'
  });
  
  suggestions.push({
    type: 'minor',
    title: 'مینیفای کردن منابع',
    description: 'فشرده‌سازی CSS، JavaScript و HTML',
    impact: 'کاهش اندازه فایل‌ها',
    action: 'استفاده از ابزارهای build برای مینیفای کردن'
  });
  
  return suggestions;
}