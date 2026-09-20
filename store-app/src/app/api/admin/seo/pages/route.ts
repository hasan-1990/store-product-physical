import { NextRequest, NextResponse } from 'next/server';
import { getAllSEOPages, analyzePageSEO, getAllSitePages } from '@/lib/seo-helpers';

export async function GET() {
  try {
    const pages = await getAllSEOPages();
    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error fetching SEO pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SEO pages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, url, pages } = await request.json();

    if (action === 'refresh') {
      // دریافت صفحات موجود و فعال از پایگاه داده
      const existingPages = await getAllSEOPages();
      
      const results = [];
      
      // تحلیل هر صفحه موجود در پایگاه داده
      for (const existingPage of existingPages) {
        if (existingPage.isActive) {
          const analysis = await analyzePageSEO(existingPage.url);
          
          const pageData = {
            id: existingPage._id || existingPage.url,
            path: existingPage.url,
            url: existingPage.url,
            title: existingPage.title || analysis.title || '',
            description: existingPage.description || analysis.description || '',
            metaTitle: existingPage.title || analysis.title || '',
            metaDescription: existingPage.description || analysis.description || '',
            keywords: existingPage.keywords || analysis.keywords || '',
            ogTitle: existingPage.title || analysis.title || '',
            ogDescription: existingPage.description || analysis.description || '',
            status: existingPage.isActive ? 'active' : 'inactive',
            lastModified: existingPage.updatedAt || new Date().toISOString(),
            analysis: {
              score: analysis.score || 0,
              issues: analysis.issues || [],
              suggestions: analysis.suggestions || [],
              scoreBreakdown: analysis.scoreBreakdown || {},
              loadTime: analysis.loadTime || 0,
              wordCount: analysis.wordCount || 0,
              h1Count: analysis.h1Count || 0,
              h2Count: analysis.h2Count || 0,
              imageCount: analysis.imageCount || 0,
              hasOpenGraph: analysis.hasOpenGraph || false,
              hasTwitterCard: analysis.hasTwitterCard || false,
              hasStructuredData: analysis.hasStructuredData || false
            }
          };
          
          results.push(pageData);
        }
      }
      
      return NextResponse.json(results);
    }

    if (action === 'analyze-single' && url) {
      const analysis = await analyzePageSEO(url);
      const pageData = {
        id: url,
        path: url,
        url: url,
        title: analysis.title || '',
        description: analysis.description || '',
        metaTitle: analysis.title || '',
        metaDescription: analysis.description || '',
        keywords: analysis.keywords || '',
        ogTitle: analysis.title || '',
        ogDescription: analysis.description || '',
        status: 'active',
        lastModified: new Date().toISOString(),
        analysis: {
          score: analysis.score || 0,
          issues: analysis.issues || [],
          suggestions: analysis.suggestions || [],
          scoreBreakdown: analysis.scoreBreakdown || {},
          loadTime: analysis.loadTime || 0,
          wordCount: analysis.wordCount || 0,
          h1Count: analysis.h1Count || 0,
          h2Count: analysis.h2Count || 0,
          imageCount: analysis.imageCount || 0,
          hasOpenGraph: analysis.hasOpenGraph || false,
          hasTwitterCard: analysis.hasTwitterCard || false,
          hasStructuredData: analysis.hasStructuredData || false
        }
      };
      
      return NextResponse.json(pageData);
    }

    if (action === 'get-all-pages') {
      const allPages = await getAllSitePages();
      return NextResponse.json(allPages);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in SEO pages API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}