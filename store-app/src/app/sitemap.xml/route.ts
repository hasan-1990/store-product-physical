import { NextResponse } from 'next/server';
import { getGlobalSEOSettings, getAllSEOPages } from '@/lib/seo-helpers';

// تولید sitemap.xml
const generateSitemap = async (): Promise<string> => {
  try {
    // دریافت تنظیمات عمومی از MongoDB
    const globalSettings = await getGlobalSEOSettings();
    const baseURL = globalSettings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // دریافت صفحات SEO از MongoDB
    const seoPages = await getAllSEOPages(false); // فقط صفحات فعال
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`;

    // افزودن صفحات از MongoDB (فیلتر لینک‌های API)
    seoPages.forEach(page => {
      // فیلتر کردن لینک‌های API و صفحات غیرقابل دسترسی
      if (page.url.startsWith('/api')) {
        return; // از اضافه کردن لینک‌های API جلوگیری کن
      }
      
      const lastmod = page.updatedAt ? new Date(page.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const priority = page.url === '/' ? '1.0' : '0.8';
      const changefreq = page.url === '/' ? 'daily' : 'weekly';
      
      sitemap += `
  <url>
    <loc>${baseURL}${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    });

    // دریافت و اضافه کردن محصولات فعال
    try {
      const { connectDB } = await import('@/lib/mongodb');
      const db = await connectDB();
      const products = await db.products.find({ active: true }).limit(1000).toArray();
      
      products.forEach((product: any) => {
        const productUrl = `/products/${product.slug || product.sequentialId || product._id}`;
        const lastmod = product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        sitemap += `
  <url>
    <loc>${baseURL}${productUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
      });
    } catch (error) {
      console.warn('خطا در بارگیری محصولات برای sitemap:', error);
    }

    // دریافت و اضافه کردن مقالات بلاگ
    try {
      const { connectDB } = await import('@/lib/mongodb');
      const db = await connectDB();
      const blogPosts = await db.blogPosts.find({ status: 'published' }).limit(500).toArray();
      
      blogPosts.forEach((post: any) => {
        const postUrl = `/blog/${post.slug || post._id}`;
        const lastmod = post.updatedAt ? new Date(post.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        sitemap += `
  <url>
    <loc>${baseURL}${postUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });
    } catch (error) {
      console.warn('خطا در بارگیری مقالات برای sitemap:', error);
    }

    // دریافت و اضافه کردن دسته‌بندی‌ها
    try {
      const { connectDB } = await import('@/lib/mongodb');
      const db = await connectDB();
      const categories = await db.categories.find({ isActive: true }).toArray();
      
      categories.forEach((category: any) => {
        const categoryUrl = `/products/${category.slug || category._id}`;
        
        sitemap += `
  <url>
    <loc>${baseURL}${categoryUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });
    } catch (error) {
      console.warn('خطا در بارگیری دسته‌بندی‌ها برای sitemap:', error);
    }
    
    // اگر هیچ صفحه‌ای در دیتابیس نبود، صفحات پیش‌فرض اضافه کن
    if (seoPages.length === 0) {
      const currentDate = new Date().toISOString().split('T')[0];
      const defaultPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/products', priority: '0.8', changefreq: 'weekly' },
        { url: '/blog', priority: '0.8', changefreq: 'weekly' },
        { url: '/about', priority: '0.6', changefreq: 'monthly' },
        { url: '/contact', priority: '0.6', changefreq: 'monthly' },
        { url: '/faq', priority: '0.6', changefreq: 'monthly' }
      ];
      
      defaultPages.forEach(page => {
        sitemap += `
  <url>
    <loc>${baseURL}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
      });
    }
    
    sitemap += `
</urlset>`;

    return sitemap;
  } catch (error) {
    console.error('خطا در تولید sitemap:', error);
    
    // Fallback sitemap
    const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const currentDate = new Date().toISOString().split('T')[0];
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseURL}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseURL}/products</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseURL}/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseURL}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseURL}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseURL}/faq</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;
  }
};

export async function GET() {
  try {
    const sitemap = await generateSitemap();
    
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    });
  } catch (error) {
    console.error('خطا در تولید sitemap:', error);
    return NextResponse.json(
      { error: 'خطا در تولید sitemap' },
      { status: 500 }
    );
  }
}