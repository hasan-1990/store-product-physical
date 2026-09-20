import { NextRequest, NextResponse } from 'next/server';

// دریافت متریک‌های سرعت صفحه
export async function GET() {
  try {
    // در اینجا می‌توانید متریک‌های واقعی را از Google PageSpeed Insights API دریافت کنید
    // یا از ابزارهای مانیتورینگ داخلی استفاده کنید
    
    const metrics = await getPageSpeedMetrics();
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('خطا در دریافت متریک‌های سرعت:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت متریک‌های سرعت' },
      { status: 500 }
    );
  }
}

async function getPageSpeedMetrics() {
  try {
    // در حالت واقعی، می‌توانید از Google PageSpeed Insights API استفاده کنید
    // const API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY;
    // const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&key=${API_KEY}`;
    
    // برای نمایش، از داده‌های نمونه استفاده می‌کنیم
    return {
      lcp: 2.1, // Largest Contentful Paint (seconds)
      fid: 85,  // First Input Delay (milliseconds)
      cls: 0.12, // Cumulative Layout Shift
      fcp: 1.8, // First Contentful Paint (seconds)
      ttfb: 0.6, // Time to First Byte (seconds)
      score: 78, // Overall performance score
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('خطا در دریافت متریک‌ها:', error);
    throw error;
  }
}