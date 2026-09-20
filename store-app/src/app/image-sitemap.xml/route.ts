import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// تولید Image Sitemap برای Google Images
const generateImageSitemap = async (): Promise<string> => {
  try {
    const baseURL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

    // دریافت محصولات با تصاویر
    try {
      const db = await connectDB();
      const products = await db.products
        .find({ 
          active: true,
          $or: [
            { imageUrl: { $exists: true, $ne: '' } },
            { image: { $exists: true, $ne: '' } },
            { images: { $exists: true, $ne: [] } }
          ]
        })
        .limit(500)
        .toArray();
      
      products.forEach((product: any) => {
        const productUrl = `/products/${product.slug || product.sequentialId || product._id}`;
        const mainImage = product.imageUrl || product.image;
        
        if (mainImage) {
          const imageUrl = mainImage.startsWith('http') 
            ? mainImage 
            : `${baseURL}${mainImage.startsWith('/') ? '' : '/'}${mainImage}`;
          
          sitemap += `
  <url>
    <loc>${baseURL}${productUrl}</loc>
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:caption>${product.name || 'محصول'}</image:caption>
      <image:title>${product.name || 'محصول'}</image:title>
    </image:image>`;
          
          // اضافه کردن تصاویر اضافی (گالری)
          if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            product.images.slice(0, 5).forEach((img: string) => {
              if (img && img !== mainImage) {
                const galleryImageUrl = img.startsWith('http') 
                  ? img 
                  : `${baseURL}${img.startsWith('/') ? '' : '/'}${img}`;
                
                sitemap += `
    <image:image>
      <image:loc>${galleryImageUrl}</image:loc>
      <image:caption>${product.name} - تصویر گالری</image:caption>
      <image:title>${product.name}</image:title>
    </image:image>`;
              }
            });
          }
          
          sitemap += `
  </url>`;
        }
      });
    } catch (error) {
      console.warn('خطا در بارگیری محصولات برای image sitemap:', error);
    }

    // دریافت مقالات بلاگ با تصاویر
    try {
      const db = await connectDB();
      const blogPosts = await db.blogPosts
        .find({ 
          status: 'published',
          $or: [
            { featuredImage: { $exists: true, $ne: '' } },
            { thumbnail: { $exists: true, $ne: '' } }
          ]
        })
        .limit(200)
        .toArray();
      
      blogPosts.forEach((post: any) => {
        const postUrl = `/blog/${post.slug || post._id}`;
        const postImage = post.featuredImage || post.thumbnail;
        
        if (postImage) {
          const imageUrl = postImage.startsWith('http') 
            ? postImage 
            : `${baseURL}${postImage.startsWith('/') ? '' : '/'}${postImage}`;
          
          sitemap += `
  <url>
    <loc>${baseURL}${postUrl}</loc>
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:caption>${post.title || 'مقاله'}</image:caption>
      <image:title>${post.title || 'مقاله'}</image:title>
    </image:image>
  </url>`;
        }
      });
    } catch (error) {
      console.warn('خطا در بارگیری مقالات برای image sitemap:', error);
    }

    sitemap += `
</urlset>`;

    return sitemap;
  } catch (error) {
    console.error('خطا در تولید image sitemap:', error);
    
    // Fallback minimal sitemap
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- خطا در تولید image sitemap -->
</urlset>`;
  }
};

export async function GET() {
  try {
    const sitemap = await generateImageSitemap();
    
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600' // 1 ساعت cache
      }
    });
  } catch (error) {
    console.error('خطا در تولید image sitemap:', error);
    return NextResponse.json(
      { error: 'خطا در تولید image sitemap' },
      { status: 500 }
    );
  }
}
