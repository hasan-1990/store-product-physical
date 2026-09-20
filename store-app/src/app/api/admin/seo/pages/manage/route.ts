import { NextRequest, NextResponse } from 'next/server';
import { getAllSEOPages, getAllSitePages, upsertSEOPage, deleteSEOPage as deleteSEOPageHelper } from '@/lib/seo-helpers';
import { loadFallbackPages, saveFallbackPage, deleteFallbackPage, getFallbackPage } from '@/lib/seo-fallback-storage';

// Function to discover all pages
async function discoverAllPages() {
  try {
    // Get existing SEO pages from database
    const existingPages = await getAllSEOPages(true);
    console.log(`Found ${existingPages.length} existing SEO pages`);
    
    // Get all site pages that should exist
    const allSitePages = await getAllSitePages();
    console.log(`Found ${allSitePages.length} total site pages`);
    
    // Create a map of existing pages by URL
    const existingPagesMap = new Map();
    existingPages.forEach(page => {
      existingPagesMap.set(page.url, page);
    });
    
    // Combine existing and discovered pages
    const allPages: any[] = [];
    
    // Add all discovered site pages
    allSitePages.forEach(url => {
      const existingPage = existingPagesMap.get(url);
      
      if (existingPage) {
        // Use existing page data
        allPages.push({
          _id: existingPage._id,
          url: existingPage.url,
          title: existingPage.title,
          description: existingPage.description,
          keywords: existingPage.keywords || '',
          h1Title: existingPage.h1Title || '',
          h2Title: existingPage.h2Title || '',
          content: existingPage.content || '',
          ogTitle: existingPage.ogTitle || '',
          ogDescription: existingPage.ogDescription || '',
          ogImage: existingPage.ogImage || '',
          twitterTitle: existingPage.twitterTitle || '',
          twitterDescription: existingPage.twitterDescription || '',
          twitterImage: existingPage.twitterImage || '',
          canonicalUrl: existingPage.canonicalUrl || '',
          robotsContent: existingPage.robotsContent || 'index, follow',
          structuredData: existingPage.structuredData || null,
          customMeta: existingPage.customMeta || {},
          isActive: existingPage.isActive,
          isDiscovered: false,
          createdAt: existingPage.createdAt,
          updatedAt: existingPage.updatedAt
        });
      } else {
        // Create discovered page entry
        allPages.push({
          _id: `discovered_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: url,
          title: `صفحه ${url}`,
          description: `تنظیمات SEO برای ${url}`,
          keywords: '',
          h1Title: '',
          h2Title: '',
          content: '',
          ogTitle: '',
          ogDescription: '',
          ogImage: '',
          twitterTitle: '',
          twitterDescription: '',
          twitterImage: '',
          canonicalUrl: '',
          robotsContent: 'index, follow',
          structuredData: null,
          customMeta: {},
          isActive: true,
          isDiscovered: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    // Add any existing pages that aren't in the site pages list
    existingPages.forEach(page => {
      if (!allSitePages.includes(page.url)) {
        allPages.push({
          _id: page._id,
          url: page.url,
          title: page.title,
          description: page.description,
          keywords: page.keywords || '',
          h1Title: page.h1Title || '',
          h2Title: page.h2Title || '',
          content: page.content || '',
          ogTitle: page.ogTitle || '',
          ogDescription: page.ogDescription || '',
          ogImage: page.ogImage || '',
          twitterTitle: page.twitterTitle || '',
          twitterDescription: page.twitterDescription || '',
          twitterImage: page.twitterImage || '',
          canonicalUrl: page.canonicalUrl || '',
          robotsContent: page.robotsContent || 'index, follow',
          structuredData: page.structuredData || null,
          customMeta: page.customMeta || {},
          isActive: page.isActive,
          isDiscovered: false,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt
        });
      }
    });
    
    return allPages;
    
  } catch (error) {
    console.error('Error discovering pages:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDiscovered = searchParams.get('include_discovered') === 'true';
    
    console.log('🔄 Loading SEO pages from database...');
    
    // Try to use database first
    try {
      const allPages = await discoverAllPages();
      console.log(`✅ Loaded ${allPages.length} pages from database`);
      
      return NextResponse.json({
        success: true,
        pages: allPages,
        existingCount: allPages.filter(p => !p.isDiscovered).length,
        discoveredCount: allPages.filter(p => p.isDiscovered).length,
        totalCount: allPages.length,
        message: 'Pages loaded successfully from database'
      });
      
    } catch (dbError) {
      console.error('❌ Database error, falling back to file storage:', dbError);
      
      // Fallback to file storage
      const savedPages = await loadFallbackPages();
      console.log(`📁 Found ${savedPages.length} saved pages in fallback storage`);
      
      // Get all site pages that should exist
      const allSitePages = await getAllSitePages();
      console.log(`Found ${allSitePages.length} total site pages`);
      
      const allPages: any[] = [];
      
      for (const url of allSitePages) {
        const savedPage = savedPages.find(p => p.url === url);
        
        if (savedPage) {
          allPages.push(savedPage);
        } else {
          allPages.push({
            _id: `discovered_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: url,
            title: `صفحه ${url}`,
            description: `تنظیمات SEO برای ${url}`,
            keywords: '',
            h1Title: '',
            h2Title: '',
            content: '',
            ogTitle: '',
            ogDescription: '',
            ogImage: '',
            twitterTitle: '',
            twitterDescription: '',
            twitterImage: '',
            canonicalUrl: '',
            robotsContent: 'index, follow',
            structuredData: null,
            customMeta: {},
            isActive: true,
            isDiscovered: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      return NextResponse.json({
        success: true,
        pages: allPages,
        existingCount: savedPages.length,
        discoveredCount: allPages.length - savedPages.length,
        totalCount: allPages.length,
        message: 'Pages loaded from fallback storage (database unavailable)'
      });
    }
    
  } catch (error) {
    console.error('Error fetching SEO pages:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching SEO pages: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, title, description, keywords, h1Title, h2Title, content, ogTitle, ogDescription, ogImage, twitterTitle, twitterDescription, twitterImage, canonicalUrl, robotsContent, structuredData, customMeta } = body;
    
    console.log('🔄 POST request received:', { url, title });
    console.log('🔍 Content to create:', { h1Title, h2Title, content });
    
    if (!url || !title || !description) {
      return NextResponse.json(
        { success: false, error: 'URL, title and description are required' },
        { status: 400 }
      );
    }
    
    // Try database first
    try {
      console.log('🔄 Using database for create');
      
      const newPage = await upsertSEOPage(url, {
        title,
        description,
        keywords: keywords || '',
        h1Title: h1Title || '',
        h2Title: h2Title || '',
        content: content || '',
        ogTitle: ogTitle || '',
        ogDescription: ogDescription || '',
        ogImage: ogImage || '',
        twitterTitle: twitterTitle || '',
        twitterDescription: twitterDescription || '',
        twitterImage: twitterImage || '',
        canonicalUrl: canonicalUrl || '',
        robotsContent: robotsContent || 'index, follow',
        structuredData: structuredData || null,
        customMeta: customMeta || {},
        isActive: true
      });
      
      if (!newPage) {
        throw new Error('Failed to create SEO page in database');
      }
      
      console.log(`✅ New page "${title}" saved successfully in database`);
      console.log('✅ Saved data check:', { 
        h1Title: newPage.h1Title, 
        h2Title: newPage.h2Title, 
        content: newPage.content 
      });
      
      return NextResponse.json({
        success: true,
        page: newPage,
        message: 'SEO page successfully saved in database'
      });
      
    } catch (dbError) {
      console.error('❌ Database error, falling back to file storage:', dbError);
      
      // Fallback to file storage
      const newPage = await saveFallbackPage({
        url,
        title,
        description,
        keywords: keywords || '',
        h1Title: h1Title || '',
        h2Title: h2Title || '',
        content: content || '',
        ogTitle: ogTitle || '',
        ogDescription: ogDescription || '',
        ogImage: ogImage || '',
        twitterTitle: twitterTitle || '',
        twitterDescription: twitterDescription || '',
        twitterImage: twitterImage || '',
        canonicalUrl: canonicalUrl || '',
        robotsContent: robotsContent || 'index, follow',
        structuredData: structuredData || null,
        customMeta: customMeta || {},
        isActive: true,
        isDiscovered: false
      });
      
      console.log(`✅ New page "${title}" saved successfully (fallback mode)`);
      
      return NextResponse.json({
        success: true,
        page: newPage,
        message: 'SEO page successfully saved (fallback mode)'
      });
    }
    
  } catch (error) {
    console.error('❌ Error saving SEO page:', error);
    return NextResponse.json(
      { success: false, error: 'Error saving SEO page: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Page ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { url, title, description, keywords, h1Title, h2Title, content, ogTitle, ogDescription, ogImage, twitterTitle, twitterDescription, twitterImage, canonicalUrl, robotsContent, structuredData, customMeta } = body;
    
    console.log('🔄 PUT request received:', { id, url, title });
    console.log('🔍 Content to save:', { h1Title, h2Title, content });
    
    if (!url || !title || !description) {
      return NextResponse.json(
        { success: false, error: 'URL, title and description are required' },
        { status: 400 }
      );
    }
    
    // Try database first
    try {
      console.log('🔄 Using database for update');
      
      const updatedPage = await upsertSEOPage(url, {
        title,
        description,
        keywords: keywords || '',
        h1Title: h1Title || '',
        h2Title: h2Title || '',
        content: content || '',
        ogTitle: ogTitle || '',
        ogDescription: ogDescription || '',
        ogImage: ogImage || '',
        twitterTitle: twitterTitle || '',
        twitterDescription: twitterDescription || '',
        twitterImage: twitterImage || '',
        canonicalUrl: canonicalUrl || '',
        robotsContent: robotsContent || 'index, follow',
        structuredData: structuredData || null,
        customMeta: customMeta || {},
        isActive: true
      });
      
      if (!updatedPage) {
        throw new Error('Failed to update SEO page in database');
      }
      
      console.log(`✅ Page "${title}" updated successfully in database`);
      console.log('✅ Saved data check:', { 
        h1Title: updatedPage.h1Title, 
        h2Title: updatedPage.h2Title, 
        content: updatedPage.content 
      });
      
      return NextResponse.json({
        success: true,
        page: updatedPage,
        message: 'SEO page successfully updated in database'
      });
      
    } catch (dbError) {
      console.error('❌ Database error, falling back to file storage:', dbError);
      
      // Fallback to file storage
      const updatedPage = await saveFallbackPage({
        _id: id,
        url,
        title,
        description,
        keywords: keywords || '',
        h1Title: h1Title || '',
        h2Title: h2Title || '',
        content: content || '',
        ogTitle: ogTitle || '',
        ogDescription: ogDescription || '',
        ogImage: ogImage || '',
        twitterTitle: twitterTitle || '',
        twitterDescription: twitterDescription || '',
        twitterImage: twitterImage || '',
        canonicalUrl: canonicalUrl || '',
        robotsContent: robotsContent || 'index, follow',
        structuredData: structuredData || null,
        customMeta: customMeta || {},
        isActive: true,
        isDiscovered: false
      });
      
      console.log(`✅ Page "${title}" updated successfully (fallback mode)`);
      
      return NextResponse.json({
        success: true,
        page: updatedPage,
        message: 'SEO page successfully updated (fallback mode)'
      });
    }
    
  } catch (error) {
    console.error('❌ Error updating SEO page:', error);
    return NextResponse.json(
      { success: false, error: 'Error updating SEO page: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Page ID is required' },
        { status: 400 }
      );
    }
    
    // Try database first
    try {
      console.log('🔄 Using database for delete');
      
      // First find the page to get its URL
      const existingPages = await getAllSEOPages(true);
      const pageToDelete = existingPages.find(page => (page._id as any).toString() === id);
      
      if (!pageToDelete) {
        return NextResponse.json(
          { success: false, error: 'Page not found' },
          { status: 404 }
        );
      }
      
      const deleted = await deleteSEOPageHelper(pageToDelete.url);
      
      if (deleted) {
        console.log(`✅ Page deleted successfully from database: ${pageToDelete.url}`);
        return NextResponse.json({
          success: true,
          message: `SEO page for ${pageToDelete.url} successfully deleted from database`
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Page not found or could not be deleted' },
          { status: 404 }
        );
      }
      
    } catch (dbError) {
      console.error('❌ Database error, falling back to file storage:', dbError);
      
      // Fallback to file storage
      const deleted = await deleteFallbackPage(id);
      
      if (deleted) {
        console.log(`✅ Page deleted successfully from fallback storage: ${id}`);
        return NextResponse.json({
          success: true,
          message: 'SEO page successfully deleted (fallback mode)'
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Page not found in fallback storage' },
          { status: 404 }
        );
      }
    }
    
  } catch (error) {
    console.error('❌ Error deleting SEO page:', error);
    return NextResponse.json(
      { success: false, error: 'Error deleting SEO page: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}