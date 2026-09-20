import * as cheerio from 'cheerio';

/**
 * تحلیل پیشرفته SEO یک صفحه
 */
export async function analyzePageSEOAdvanced(url: string) {
  try {
    // استفاده از window.location.origin در سمت client یا environment variable
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    
    const startTime = Date.now();
    
    // شبیه‌سازی fetch (در محیط واقعی باید fetch کنید)
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'SEO-Analyzer/1.0'
      }
    }).catch(() => null);
    
    const loadTime = Date.now() - startTime;
    
    if (!response || !response.ok) {
      return {
        url,
        status: 'error',
        error: 'صفحه در دسترس نیست',
        title: null,
        description: null,
        keywords: null,
        h1Count: 0,
        h2Count: 0,
        h3Count: 0,
        imageCount: 0,
        imagesWithoutAlt: 0,
        imagesWithAlt: 0,
        linkCount: 0,
        internalLinks: 0,
        externalLinks: 0,
        wordCount: 0,
        hasViewport: false,
        hasCharset: false,
        hasCanonical: false,
        hasRobots: false,
        hasOpenGraph: false,
        hasTwitterCard: false,
        hasStructuredData: false,
        issues: ['صفحه در دسترس نیست'],
        suggestions: ['اطمینان حاصل کنید که صفحه در دسترس است'],
        score: 0,
        scoreBreakdown: {},
        loadTime,
        titleLength: 0,
        descriptionLength: 0
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // استخراج اطلاعات SEO
    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
    const description = $('meta[name="description"]').attr('content') || 
                      $('meta[property="og:description"]').attr('content') || '';
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    
    // تعداد عناصر
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    const imageCount = $('img').length;
    const linkCount = $('a').length;
    const internalLinks = $('a[href^="/"], a[href*="localhost"]').length;
    const externalLinks = linkCount - internalLinks;
    
    // تعداد کلمات محتوا
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(' ').filter((word: string) => word.length > 0).length;
    
    // بررسی meta tags
    const hasViewport = $('meta[name="viewport"]').length > 0;
    const hasCharset = $('meta[charset]').length > 0;
    const hasCanonical = $('link[rel="canonical"]').length > 0;
    const hasRobots = $('meta[name="robots"]').length > 0;
    const hasOpenGraph = $('meta[property^="og:"]').length > 0;
    const hasTwitterCard = $('meta[name^="twitter:"]').length > 0;
    
    // بررسی تصاویر
    const imagesWithoutAlt = $('img:not([alt]), img[alt=""]').length;
    const imagesWithAlt = imageCount - imagesWithoutAlt;
    
    // بررسی structured data
    const hasStructuredData = $('script[type="application/ld+json"]').length > 0;
    
    // محاسبه امتیاز و مشکلات
    const analysis = calculateSEOScore({
      title,
      description,
      keywords,
      h1Count,
      h2Count,
      h3Count,
      imageCount,
      imagesWithoutAlt,
      imagesWithAlt,
      linkCount,
      internalLinks,
      externalLinks,
      wordCount,
      hasViewport,
      hasCharset,
      hasCanonical,
      hasRobots,
      hasOpenGraph,
      hasTwitterCard,
      hasStructuredData,
      loadTime
    });
    
    return {
      url,
      status: 'success',
      title,
      description,
      keywords,
      h1Count,
      h2Count,
      h3Count,
      imageCount,
      imagesWithoutAlt,
      imagesWithAlt,
      linkCount,
      internalLinks,
      externalLinks,
      wordCount,
      hasViewport,
      hasCharset,
      hasCanonical,
      hasRobots,
      hasOpenGraph,
      hasTwitterCard,
      hasStructuredData,
      issues: analysis.issues,
      suggestions: analysis.suggestions,
      score: analysis.score,
      scoreBreakdown: analysis.breakdown,
      loadTime,
      titleLength: title.length,
      descriptionLength: description.length
    };
    
  } catch (error) {
    console.error(`خطا در تحلیل SEO برای ${url}:`, error);
    return {
      url,
      status: 'error',
      error: 'خطا در تحلیل',
      title: null,
      description: null,
      keywords: null,
      h1Count: 0,
      h2Count: 0,
      h3Count: 0,
      imageCount: 0,
      imagesWithoutAlt: 0,
      imagesWithAlt: 0,
      linkCount: 0,
      internalLinks: 0,
      externalLinks: 0,
      wordCount: 0,
      hasViewport: false,
      hasCharset: false,
      hasCanonical: false,
      hasRobots: false,
      hasOpenGraph: false,
      hasTwitterCard: false,
      hasStructuredData: false,
      issues: ['خطا در تحلیل صفحه'],
      suggestions: ['لطفاً دوباره تلاش کنید'],
      score: 0,
      scoreBreakdown: {},
      loadTime: 0,
      titleLength: 0,
      descriptionLength: 0
    };
  }
}

/**
 * محاسبه امتیاز SEO بر اساس فاکتورهای مختلف
 */
function calculateSEOScore(data: any) {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const breakdown: Record<string, { score: number; max: number; description: string }> = {};
  
  let totalScore = 0;
  
  // عنوان (Title) - 20 امتیاز
  let titleScore = 0;
  if (!data.title) {
    issues.push('🚫 فاقد عنوان (Title Tag)');
    suggestions.push('💡 عنوان مناسب برای صفحه اضافه کنید');
  } else if (data.title.length < 30) {
    issues.push('⚠️ عنوان کوتاه است (کمتر از 30 کاراکتر)');
    suggestions.push('📏 عنوان را به 30-60 کاراکتر افزایش دهید');
    titleScore = 10;
  } else if (data.title.length > 60) {
    issues.push('📏 عنوان بلند است (بیشتر از 60 کاراکتر)');
    suggestions.push('✂️ عنوان را به 30-60 کاراکتر کوتاه کنید');
    titleScore = 15;
  } else {
    titleScore = 20;
  }
  breakdown.title = { score: titleScore, max: 20, description: 'عنوان صفحه' };
  totalScore += titleScore;
  
  // توضیحات (Description) - 20 امتیاز
  let descScore = 0;
  if (!data.description) {
    issues.push('🚫 فاقد توضیحات (Meta Description)');
    suggestions.push('💡 توضیحات مناسب برای صفحه اضافه کنید');
  } else if (data.description.length < 120) {
    issues.push('⚠️ توضیحات کوتاه است (کمتر از 120 کاراکتر)');
    suggestions.push('📏 توضیحات را به 120-160 کاراکتر افزایش دهید');
    descScore = 10;
  } else if (data.description.length > 160) {
    issues.push('📏 توضیحات بلند است (بیشتر از 160 کاراکتر)');
    suggestions.push('✂️ توضیحات را به 120-160 کاراکتر کوتاه کنید');
    descScore = 15;
  } else {
    descScore = 20;
  }
  breakdown.description = { score: descScore, max: 20, description: 'توضیحات صفحه' };
  totalScore += descScore;
  
  // ساختار هدرها (Headers) - 15 امتیاز
  let headerScore = 0;
  if (data.h1Count === 0) {
    issues.push('🚫 فاقد تگ H1');
    suggestions.push('💡 یک تگ H1 مناسب اضافه کنید');
  } else if (data.h1Count > 1) {
    issues.push('⚠️ بیش از یک تگ H1 وجود دارد');
    suggestions.push('🎯 فقط یک تگ H1 استفاده کنید');
    headerScore = 8;
  } else {
    headerScore = 10;
  }
  
  if (data.h2Count > 0) {
    headerScore += 5;
  } else {
    suggestions.push('📋 تگ‌های H2 برای بهتر سازماندهی محتوا اضافه کنید');
  }
  
  breakdown.headers = { score: headerScore, max: 15, description: 'ساختار هدرها' };
  totalScore += headerScore;
  
  // تصاویر (Images) - 10 امتیاز
  let imageScore = 0;
  if (data.imageCount > 0) {
    if (data.imagesWithoutAlt > 0) {
      issues.push(`🖼️ ${data.imagesWithoutAlt} تصویر فاقد متن جایگزین (Alt Text)`);
      suggestions.push('💡 متن جایگزین مناسب برای تمام تصاویر اضافه کنید');
      imageScore = Math.max(0, 10 - (data.imagesWithoutAlt * 2));
    } else {
      imageScore = 10;
    }
  } else {
    imageScore = 8; // نداشتن تصویر لزوماً بد نیست
  }
  breakdown.images = { score: imageScore, max: 10, description: 'بهینه‌سازی تصاویر' };
  totalScore += imageScore;
  
  // لینک‌ها (Links) - 10 امتیاز
  let linkScore = 0;
  if (data.linkCount > 0) {
    linkScore = 5;
    if (data.internalLinks > 0) {
      linkScore += 5;
    } else {
      suggestions.push('🔗 لینک‌های داخلی برای بهبود ناوبری اضافه کنید');
    }
  } else {
    suggestions.push('🔗 لینک‌های مفید برای کاربران اضافه کنید');
  }
  breakdown.links = { score: linkScore, max: 10, description: 'ساختار لینک‌ها' };
  totalScore += linkScore;
  
  // محتوا (Content) - 10 امتیاز
  let contentScore = 0;
  if (data.wordCount < 30) {
    issues.push('📝 محتوای کم (کمتر از 30 کلمه)');
    suggestions.push('📚 محتوای بیشتر و مفیدتر اضافه کنید');
    contentScore = 5;
  } else if (data.wordCount >= 30) {
    contentScore = 10;
  }
  breakdown.content = { score: contentScore, max: 10, description: 'کیفیت محتوا' };
  totalScore += contentScore;
  
  // تگ‌های فنی (Technical) - 10 امتیاز
  let techScore = 0;
  if (data.hasCharset) techScore += 2;
  else suggestions.push('⚙️ تگ charset اضافه کنید');
  
  if (data.hasViewport) techScore += 2;
  else suggestions.push('📱 تگ viewport برای موبایل اضافه کنید');
  
  if (data.hasCanonical) techScore += 2;
  else suggestions.push('🔗 لینک canonical اضافه کنید');
  
  if (data.hasRobots) techScore += 2;
  else suggestions.push('🤖 تگ robots اضافه کنید');
  
  if (data.loadTime < 3000) techScore += 2;
  else {
    issues.push('🐌 سرعت بارگذاری کند (بیشتر از 3 ثانیه)');
    suggestions.push('⚡ سرعت بارگذاری صفحه را بهبود دهید');
  }
  
  breakdown.technical = { score: techScore, max: 10, description: 'جنبه‌های فنی' };
  totalScore += techScore;
  
  // شبکه‌های اجتماعی (Social) - 5 امتیاز
  let socialScore = 0;
  if (data.hasOpenGraph) socialScore += 3;
  else suggestions.push('📱 تگ‌های Open Graph اضافه کنید');
  
  if (data.hasTwitterCard) socialScore += 2;
  else suggestions.push('🐦 تگ‌های Twitter Card اضافه کنید');
  
  breakdown.social = { score: socialScore, max: 5, description: 'شبکه‌های اجتماعی' };
  totalScore += socialScore;
  
  return {
    score: Math.round(totalScore),
    issues,
    suggestions,
    breakdown
  };
}