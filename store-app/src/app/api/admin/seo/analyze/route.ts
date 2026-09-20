import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL مورد نیاز است' },
        { status: 400 }
      );
    }

    // اعتبارسنجی URL
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'فرمت URL نامعتبر است' },
        { status: 400 }
      );
    }

    const analysis = await analyzeURL(url);
    return NextResponse.json(analysis);

  } catch (error) {
    console.error('خطا در آنالیز URL:', error);
    return NextResponse.json(
      { error: 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
}

async function analyzeURL(url: string) {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Analyzer-Bot/1.0)'
      }
    });

    clearTimeout(timeoutId);
    const loadTime = (Date.now() - startTime) / 1000;

    if (!response.ok) {
      return {
        success: false,
        url,
        status: response.status,
        statusText: response.statusText,
        loadTime: Math.round(loadTime * 100) / 100,
        error: `HTTP Error: ${response.status}`,
        title: 'خطا در دسترسی',
        description: 'امکان دسترسی به این URL وجود ندارد',
        issues: [`کد خطا: ${response.status}`]
      };
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const analysis = await analyzePage(document, url, response.status, response.statusText, loadTime);

    return {
      success: true,
      ...analysis
    };

  } catch (error: any) {
    const loadTime = (Date.now() - startTime) / 1000;
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        url,
        status: 0,
        statusText: 'Timeout',
        loadTime: Math.round(loadTime * 100) / 100,
        error: 'درخواست منقضی شد (بیش از 15 ثانیه)',
        title: 'خطا در دسترسی',
        description: 'زمان انتظار به پایان رسید',
        issues: ['زمان بارگیری بیش از حد مجاز']
      };
    }

    return {
      success: false,
      url,
      status: 0,
      statusText: 'Connection Error',
      loadTime: Math.round(loadTime * 100) / 100,
      error: error.message || 'خطا در اتصال',
      title: 'خطا در اتصال',
      description: 'امکان برقراری ارتباط با سرور وجود ندارد',
      issues: ['عدم دسترسی به شبکه', 'ممکن است سایت در دسترس نباشد']
    };
  }
}

async function analyzePage(document: Document, url: string, status: number, statusText: string, loadTime: number) {
  const analysis: any = {
    url,
    status,
    statusText,
    loadTime: Math.round(loadTime * 100) / 100,
    issues: [],
    recommendations: [],
    seoScore: 0
  };

  // آنالیز title
  const titleElement = document.querySelector('title');
  analysis.title = titleElement?.textContent?.trim() || '';
  
  if (!analysis.title) {
    analysis.issues.push('صفحه فاقد عنوان است');
    analysis.recommendations.push('عنوان مناسب برای صفحه تعریف کنید');
  } else if (analysis.title.length > 60) {
    analysis.issues.push('عنوان صفحه خیلی طولانی است (بیش از 60 کاراکتر)');
    analysis.recommendations.push('عنوان را کوتاه‌تر کنید');
  } else if (analysis.title.length < 30) {
    analysis.issues.push('عنوان صفحه کوتاه است (کمتر از 30 کاراکتر)');
    analysis.recommendations.push('عنوان توصیفی‌تری انتخاب کنید');
  }

  // آنالیز Meta description
  const descriptionElement = document.querySelector('meta[name="description"]');
  analysis.description = descriptionElement?.getAttribute('content')?.trim() || '';
  
  if (!analysis.description) {
    analysis.issues.push('صفحه فاقد توضیحات meta است');
    analysis.recommendations.push('توضیحات meta مناسب اضافه کنید');
  } else if (analysis.description.length > 160) {
    analysis.issues.push('توضیحات meta خیلی طولانی است (بیش از 160 کاراکتر)');
    analysis.recommendations.push('توضیحات را کوتاه‌تر کنید');
  } else if (analysis.description.length < 120) {
    analysis.issues.push('توضیحات meta کوتاه است (کمتر از 120 کاراکتر)');
    analysis.recommendations.push('توضیحات کامل‌تری ارائه دهید');
  }

  // آنالیز Keywords
  const keywordsElement = document.querySelector('meta[name="keywords"]');
  analysis.keywords = keywordsElement?.getAttribute('content')?.trim() || '';

  // آنالیز Headings
  const h1Elements = document.querySelectorAll('h1');
  analysis.h1Count = h1Elements.length;
  analysis.h1Text = Array.from(h1Elements).map(h1 => h1.textContent?.trim()).filter(Boolean);

  if (analysis.h1Count === 0) {
    analysis.issues.push('صفحه فاقد تگ H1 است');
    analysis.recommendations.push('حداقل یک تگ H1 اضافه کنید');
  } else if (analysis.h1Count > 1) {
    analysis.issues.push('صفحه بیش از یک تگ H1 دارد');
    analysis.recommendations.push('تنها یک تگ H1 استفاده کنید');
  }

  const h2Elements = document.querySelectorAll('h2');
  analysis.h2Count = h2Elements.length;

  const h3Elements = document.querySelectorAll('h3');
  analysis.h3Count = h3Elements.length;

  // آنالیز Images
  const images = document.querySelectorAll('img');
  analysis.imageCount = images.length;
  analysis.imagesWithoutAlt = Array.from(images).filter(img => !img.getAttribute('alt')).length;

  if (analysis.imagesWithoutAlt > 0) {
    analysis.issues.push(`${analysis.imagesWithoutAlt} تصویر فاقد متن alt هستند`);
    analysis.recommendations.push('برای همه تصاویر متن alt مناسب تعریف کنید');
  }

  // آنالیز Links
  const hostname = new URL(url).hostname;
  const internalLinks = document.querySelectorAll(`a[href^="/"], a[href*="${hostname}"]`);
  const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="' + hostname + '"])');
  
  analysis.internalLinksCount = internalLinks.length;
  analysis.externalLinksCount = externalLinks.length;

  // آنالیز Content
  const bodyText = document.body?.textContent || '';
  const words = bodyText.trim().split(/\s+/).filter(word => word.length > 0);
  analysis.wordCount = words.length;

  if (analysis.wordCount < 150) {
    analysis.issues.push('محتوای صفحه کم است (کمتر از 150 کلمه)');
    analysis.recommendations.push('محتوای بیشتری به صفحه اضافه کنید');
  }

  // آنالیز Open Graph
  analysis.openGraph = {
    title: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
    description: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
    image: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
    url: document.querySelector('meta[property="og:url"]')?.getAttribute('content') || ''
  };

  // آنالیز Twitter Cards
  analysis.twitterCard = {
    card: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '',
    title: document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || '',
    description: document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') || '',
    image: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || ''
  };

  // Canonical URL
  analysis.canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';

  // Schema markup
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  analysis.schemaMarkup = jsonLdScripts.length > 0;
  analysis.schemaCount = jsonLdScripts.length;

  // Performance indicators
  if (loadTime > 3) {
    analysis.issues.push('زمان بارگیری صفحه بالا است (بیش از 3 ثانیه)');
    analysis.recommendations.push('سرعت بارگیری صفحه را بهبود دهید');
  }

  // محاسبه امتیاز SEO
  let score = 0;
  
  // Title (25 points)
  if (analysis.title && analysis.title.length >= 30 && analysis.title.length <= 60) {
    score += 25;
  } else if (analysis.title) {
    score += 15;
  }

  // Description (25 points)
  if (analysis.description && analysis.description.length >= 120 && analysis.description.length <= 160) {
    score += 25;
  } else if (analysis.description) {
    score += 15;
  }

  // H1 (15 points)
  if (analysis.h1Count === 1) {
    score += 15;
  } else if (analysis.h1Count > 0) {
    score += 8;
  }

  // Images with alt (10 points)
  if (analysis.imageCount > 0 && analysis.imagesWithoutAlt === 0) {
    score += 10;
  } else if (analysis.imagesWithoutAlt < analysis.imageCount / 2) {
    score += 5;
  }

  // Content length (10 points)
  if (analysis.wordCount >= 150) {
    score += 10;
  } else if (analysis.wordCount >= 100) {
    score += 5;
  }

  // Open Graph (10 points)
  if (analysis.openGraph.title && analysis.openGraph.description) {
    score += 10;
  } else if (analysis.openGraph.title || analysis.openGraph.description) {
    score += 5;
  }

  // Performance (5 points)
  if (loadTime <= 2) {
    score += 5;
  } else if (loadTime <= 3) {
    score += 3;
  }

  analysis.seoScore = Math.min(score, 100);

  return analysis;
}