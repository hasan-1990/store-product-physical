import { NextRequest, NextResponse } from 'next/server';
import { contentOptimizer, ContentAnalysisResult, ContentQualityMetrics } from '@/lib/content-optimizer';
import { getGlobalSEOSettings } from '@/lib/seo-helpers';

export async function POST(request: NextRequest) {
  try {
    const { url, html, targetKeywords = [] } = await request.json();
    
    if (!html) {
      return NextResponse.json({ 
        success: false,
        error: 'محتوای HTML ارائه نشده است' 
      }, { status: 400 });
    }

    // تحلیل محتوا
    const analysis: ContentAnalysisResult = await contentOptimizer.analyzePageContent(
      html, 
      url || 'unknown', 
      targetKeywords
    );

    // محاسبه امتیاز کیفیت
    const qualityMetrics: ContentQualityMetrics = contentOptimizer.calculateContentQuality(analysis);

    // تولید گزارش جامع
    const report = {
      analysis,
      qualityMetrics,
      recommendations: {
        critical: analysis.issues.filter(issue => 
          issue.includes('تکراری') || 
          issue.includes('کوتاه است') || 
          issue.includes('H1')
        ),
        important: analysis.issues.filter(issue => 
          issue.includes('Alt Text') || 
          issue.includes('کلمات کلیدی') ||
          issue.includes('ساختار')
        ),
        minor: analysis.issues.filter(issue => 
          !issue.includes('تکراری') && 
          !issue.includes('کوتاه است') && 
          !issue.includes('H1') &&
          !issue.includes('Alt Text') && 
          !issue.includes('کلمات کلیدی') &&
          !issue.includes('ساختار')
        )
      },
      actionItems: generateActionItems(analysis),
      contentOptimizationTips: generateOptimizationTips(analysis, qualityMetrics)
    };

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('خطا در تحلیل محتوا:', error);
    return NextResponse.json({ 
      success: false,
      error: 'خطا در تحلیل محتوا',
      details: error instanceof Error ? error.message : 'خطای نامشخص'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ 
        success: false,
        error: 'URL ارائه نشده است' 
      }, { status: 400 });
    }

    // دریافت HTML صفحه
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Content-Optimizer/1.0'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ 
        success: false,
        error: 'دسترسی به صفحه امکان‌پذیر نیست' 
      }, { status: 404 });
    }

    const html = await response.text();
    
    // دریافت تنظیمات SEO برای کلمات کلیدی
    const globalSettings = await getGlobalSEOSettings();
    const defaultKeywords = globalSettings?.siteDescription?.split(' ').slice(0, 5) || [];

    // تحلیل محتوا
    const analysis = await contentOptimizer.analyzePageContent(html, url, defaultKeywords);
    const qualityMetrics = contentOptimizer.calculateContentQuality(analysis);

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        qualityMetrics,
        recommendations: generateRecommendations(analysis)
      }
    });

  } catch (error) {
    console.error('خطا در دریافت و تحلیل صفحه:', error);
    return NextResponse.json({ 
      success: false,
      error: 'خطا در تحلیل صفحه',
      details: error instanceof Error ? error.message : 'خطای نامشخص'
    }, { status: 500 });
  }
}

function generateActionItems(analysis: ContentAnalysisResult) {
  const actionItems = [];

  // اقدامات فوری
  if (analysis.duplicateContent) {
    actionItems.push({
      priority: 'high',
      action: 'حذف یا بازنویسی محتوای تکراری',
      description: `محتوا در ${analysis.duplicatePages.length} صفحه دیگر تکرار شده است`,
      impact: 'بالا'
    });
  }

  if (analysis.wordCount < 30) {
    actionItems.push({
      priority: 'high',
      action: 'افزایش طول محتوا',
      description: `محتوا ${analysis.wordCount} کلمه دارد، حداقل 30 کلمه نیاز است`,
      impact: 'بالا'
    });
  }

  if (analysis.headingStructure.h1Count === 0) {
    actionItems.push({
      priority: 'high',
      action: 'اضافه کردن H1',
      description: 'صفحه فاقد عنوان اصلی (H1) است',
      impact: 'بالا'
    });
  }

  // اقدامات متوسط
  if (analysis.imageAnalysis.imagesWithoutAlt > 0) {
    actionItems.push({
      priority: 'medium',
      action: 'اضافه کردن Alt Text به تصاویر',
      description: `${analysis.imageAnalysis.imagesWithoutAlt} تصویر فاقد Alt Text هستند`,
      impact: 'متوسط'
    });
  }

  if (analysis.keywordOveruse.length > 0) {
    actionItems.push({
      priority: 'medium',
      action: 'کاهش تراکم کلمات کلیدی',
      description: `کلمات ${analysis.keywordOveruse.join(', ')} بیش از حد استفاده شده‌اند`,
      impact: 'متوسط'
    });
  }

  // اقدامات کم اولویت
  if (analysis.fleschReadingEase < 30) {
    actionItems.push({
      priority: 'low',
      action: 'بهبود خوانایی محتوا',
      description: 'استفاده از جملات کوتاه‌تر و ساده‌تر',
      impact: 'پایین'
    });
  }

  return actionItems;
}

function generateOptimizationTips(analysis: ContentAnalysisResult, qualityMetrics: ContentQualityMetrics) {
  const tips = [];

  // بر اساس امتیاز اصالت
  if (qualityMetrics.originalityScore < 80) {
    tips.push({
      category: 'اصالت محتوا',
      tip: 'محتوای منحصر به فرد و ارزشمند ایجاد کنید',
      details: 'از کپی کردن محتوا خودداری کنید و تجربیات شخصی و دیدگاه‌های منحصر به فرد اضافه کنید'
    });
  }

  // بر اساس امتیاز مرتبط بودن
  if (qualityMetrics.relevanceScore < 70) {
    tips.push({
      category: 'مرتبط بودن',
      tip: 'محتوا را با کلمات کلیدی هدف تنظیم کنید',
      details: 'اطمینان حاصل کنید که محتوا با موضوع اصلی و کلمات کلیدی هدف مرتبط است'
    });
  }

  // بر اساس امتیاز جذابیت
  if (qualityMetrics.engagementScore < 60) {
    tips.push({
      category: 'جذابیت',
      tip: 'ساختار محتوا را بهبود دهید',
      details: 'از headings، bullet points، تصاویر و فهرست‌ها برای جذاب‌تر کردن محتوا استفاده کنید'
    });
  }

  // بر اساس تحلیل کلمات کلیدی
  if (Object.values(analysis.keywordDensity).some(density => density < 1)) {
    tips.push({
      category: 'SEO',
      tip: 'کلمات کلیدی را بیشتر استفاده کنید',
      details: 'کلمات کلیدی را به صورت طبیعی در عناوین، متن و Alt texts استفاده کنید'
    });
  }

  // بر اساس ساختار
  if (!analysis.headingStructure.hasProperHierarchy) {
    tips.push({
      category: 'ساختار',
      tip: 'سلسله مراتب صحیح headings را رعایت کنید',
      details: 'از H1 برای عنوان اصلی، H2 برای بخش‌ها و H3 برای زیربخش‌ها استفاده کنید'
    });
  }

  return tips;
}

function generateRecommendations(analysis: ContentAnalysisResult) {
  return {
    immediate: analysis.issues.slice(0, 3),
    shortTerm: analysis.suggestions.slice(0, 5),
    longTerm: [
      'ایجاد تقویم محتوا برای انتشار منظم',
      'تحلیل رفتار کاربران برای بهبود محتوا',
      'ایجاد محتوای چندرسانه‌ای (ویدیو، اینفوگرافیک)',
      'بهینه‌سازی محتوا برای جستجوی صوتی',
      'ایجاد محتوای تعاملی و مشارکتی'
    ]
  };
}