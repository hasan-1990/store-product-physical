import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { action, url } = await request.json();

    switch (action) {
      case 'check-single':
        const result = await checkSingleLink(url);
        return NextResponse.json(result);
        
      case 'check-all':
        const allResults = await checkAllLinks();
        return NextResponse.json(allResults);
        
      case 'scan-content':
        const scanResults = await scanContentForLinks();
        return NextResponse.json(scanResults);
        
      default:
        return NextResponse.json(
          { error: 'عملیات مشخص نشده' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('خطا در بررسی لینک‌ها:', error);
    return NextResponse.json(
      { error: 'خطا در بررسی لینک‌ها' },
      { status: 500 }
    );
  }
}

async function checkSingleLink(url: string) {
  try {
    // شبیه‌سازی بررسی لینک
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'SEO Link Checker Bot'
      }
    });

    clearTimeout(timeoutId);

    return {
      url,
      status: response.status,
      statusText: response.statusText,
      responseTime: Date.now() % 1000, // شبیه‌سازی زمان پاسخ
      isWorking: response.ok,
      lastChecked: new Date().toISOString()
    };

  } catch (error: any) {
    return {
      url,
      status: 0,
      statusText: 'خطا در اتصال',
      responseTime: 0,
      isWorking: false,
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

async function checkAllLinks() {
  try {
    // خواندن لینک‌های ذخیره شده
    const linksPath = path.join(process.cwd(), 'data', 'tracked-links.json');
    let links = [];

    if (fs.existsSync(linksPath)) {
      links = JSON.parse(fs.readFileSync(linksPath, 'utf8'));
    } else {
      // لینک‌های نمونه
      links = [
        'https://google.com',
        'https://github.com',
        'https://stackoverflow.com',
        'https://invalid-domain-that-does-not-exist.com'
      ];
    }

    const results = [];
    
    for (const link of links) {
      const result = await checkSingleLink(link);
      results.push(result);
      
      // تاخیر کوتاه بین درخواست‌ها
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // ذخیره نتایج
    const resultsPath = path.join(process.cwd(), 'data', 'link-check-results.json');
    const dataDir = path.dirname(resultsPath);
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(resultsPath, JSON.stringify({
      lastCheck: new Date().toISOString(),
      totalLinks: results.length,
      workingLinks: results.filter(r => r.isWorking).length,
      brokenLinks: results.filter(r => !r.isWorking).length,
      results
    }, null, 2));

    return {
      success: true,
      totalChecked: results.length,
      workingLinks: results.filter(r => r.isWorking).length,
      brokenLinks: results.filter(r => !r.isWorking).length,
      results
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function scanContentForLinks() {
  try {
    // شبیه‌سازی اسکن محتوا برای یافتن لینک‌ها
    const foundLinks = [
      'https://example.com/page1',
      'https://example.com/page2',
      'https://external-site.com',
      'https://another-site.org'
    ];

    const results = {
      totalFound: foundLinks.length,
      internalLinks: foundLinks.filter(link => link.includes('example.com')).length,
      externalLinks: foundLinks.filter(link => !link.includes('example.com')).length,
      links: foundLinks,
      scannedAt: new Date().toISOString()
    };

    return results;

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function GET() {
  try {
    // بازگرداندن آخرین نتایج بررسی
    const resultsPath = path.join(process.cwd(), 'data', 'link-check-results.json');
    
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      return NextResponse.json(results);
    } else {
      return NextResponse.json({
        lastCheck: null,
        totalLinks: 0,
        workingLinks: 0,
        brokenLinks: 0,
        results: []
      });
    }

  } catch (error) {
    console.error('خطا در خواندن نتایج:', error);
    return NextResponse.json(
      { error: 'خطا در خواندن نتایج' },
      { status: 500 }
    );
  }
}