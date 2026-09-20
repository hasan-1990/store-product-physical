import { NextRequest, NextResponse } from 'next/server';
import { getSEODataByUrl } from '@/lib/seo-helpers';

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
};

// GET - دریافت اطلاعات SEO برای صفحه خاص (MongoDB + fallback)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL مورد نیاز است' },
        { status: 400, headers: jsonHeaders }
      );
    }

    const page = await getSEODataByUrl(url);

    if (!page) {
      return NextResponse.json(
        { success: false, message: 'اطلاعات SEO برای این صفحه یافت نشد' },
        { status: 404, headers: jsonHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          title: page.title,
          description: page.description,
          keywords: page.keywords,
          h1Title: page.h1Title,
          h2Title: page.h2Title,
          content: page.content,
          ogTitle: page.ogTitle,
          ogDescription: page.ogDescription,
          ogImage: page.ogImage,
          twitterTitle: page.twitterTitle,
          twitterDescription: page.twitterDescription,
          twitterImage: page.twitterImage,
          canonicalUrl: page.canonicalUrl,
          robotsContent: page.robotsContent,
          structuredData: page.structuredData,
        },
      },
      { headers: jsonHeaders }
    );
  } catch (error) {
    console.error('خطا در دریافت اطلاعات SEO:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در دریافت اطلاعات SEO',
        details: error instanceof Error ? error.message : 'خطای ناشناخته',
      },
      { status: 500, headers: jsonHeaders }
    );
  }
}
