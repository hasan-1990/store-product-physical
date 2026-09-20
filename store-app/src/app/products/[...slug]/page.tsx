import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { Product } from '@/types';
import ProductDetailClient from '@/components/ProductDetailClient';
import { getProductById, getSiteSettings } from '@/lib/homepage-data';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUrlSettings, parseProductUrl, isValidObjectId, isValidSequentialId, isValidProductId, generateProductUrl } from '@/lib/url-server';
import { buildAllSchemas } from '@/lib/structured-data';

// پیدا کردن محصول بر اساس slug ها
async function findProductBySlug(slugs: string[]): Promise<Product | null> {
  try {
    const db = await connectDB();
    const urlSettings = getUrlSettings();
    const parsedUrl = parseProductUrl(slugs);
    
    console.log('🔍 findProductBySlug - URL Settings:', urlSettings);
    console.log('🔍 findProductBySlug - Received slugs:', slugs);
    console.log('🔍 findProductBySlug - Parsed URL:', parsedUrl);
    
    let query: any = {};
    
    // استراتژی جستجو:
    // 1. اگر ID داریم (ObjectId یا sequentialId)، از آن استفاده کنیم
    // 2. اگر productSlug داریم، بر اساس slug جستجو کنیم
    // 3. اگر فقط یک slug داریم، ممکن است ID یا slug باشد
    
    // اگر ID داریم، از آن استفاده کنیم
    if (parsedUrl.productId) {
      if (isValidSequentialId(parsedUrl.productId)) {
        query.sequentialId = parseInt(parsedUrl.productId);
        console.log('✅ Using sequential ID:', parsedUrl.productId);
      } else if (isValidObjectId(parsedUrl.productId)) {
        query._id = new ObjectId(parsedUrl.productId);
        console.log('✅ Using ObjectId:', parsedUrl.productId);
      }
    }
    // اگر categoryPath و productSlug داریم
    else if (parsedUrl.categoryPath && parsedUrl.productSlug) {
      // ابتدا بر اساس slug محصول جستجو کن
      query.slug = parsedUrl.productSlug;
      console.log('✅ Using categoryPath + productSlug:', parsedUrl.categoryPath, parsedUrl.productSlug);
    }
    // اگر فقط productSlug داریم
    else if (parsedUrl.productSlug) {
      query = {
        $or: [
          { slug: parsedUrl.productSlug },
          { name: { $regex: parsedUrl.productSlug.replace(/-/g, ' '), $options: 'i' } }
        ]
      };
      console.log('✅ Using productSlug only:', parsedUrl.productSlug);
    }
    // اگر فقط یک slug داریم - بررسی کنیم ID است یا slug
    else if (slugs.length === 1) {
      if (isValidSequentialId(slugs[0])) {
        query.sequentialId = parseInt(slugs[0]);
        console.log('✅ Direct sequential ID:', slugs[0]);
      } else if (isValidObjectId(slugs[0])) {
        query._id = new ObjectId(slugs[0]);
        console.log('✅ Direct ObjectId:', slugs[0]);
      } else {
        // در غیر این صورت سعی کنیم slug را پیدا کنیم
        query = {
          $or: [
            { slug: slugs[0] },
            { name: { $regex: slugs[0].replace(/-/g, ' '), $options: 'i' } }
          ]
        };
        console.log('✅ Direct slug search:', slugs[0]);
      }
    }
    // اگر چندین slug داریم ولی parsedUrl نتیجه نداد
    // آخرین slug را به عنوان slug محصول در نظر بگیریم
    else if (slugs.length > 1) {
      const productSlug = slugs[slugs.length - 1];
      query = {
        $or: [
          { slug: productSlug },
          { name: { $regex: productSlug.replace(/-/g, ' '), $options: 'i' } }
        ]
      };
      console.log('✅ Multi-level path - using last segment as product slug:', productSlug);
    }
    
    console.log('🔍 Final query:', JSON.stringify(query, null, 2));
    
    const product = await db.products.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      {
        $lookup: {
          from: 'brands',
          let: { brandId: { $toObjectId: '$brandId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$brandId'] } } }
          ],
          as: 'brandData'
        }
      },
      {
        $addFields: {
          categoryInfo: { $arrayElemAt: ['$categoryData', 0] },
          brandInfo: { $arrayElemAt: ['$brandData', 0] }
        }
      },
      // اگر categoryPath در URL مشخص شده، بررسی مطابقت (اختیاری - برای دقت بیشتر)
      // این بخش را غیرفعال می‌کنیم تا محصولات با مسیرهای مختلف قابل دسترسی باشند
      // ...(parsedUrl.categoryPath && parsedUrl.categoryPath.length > 0 ? [{
      //   $match: {
      //     $expr: {
      //       $eq: [
      //         { $map: { input: '$categoryPath', as: 'cat', in: '$$cat.slug' } },
      //         parsedUrl.categoryPath
      //       ]
      //     }
      //   }
      // }] : []),
      { $limit: 1 }
    ]).toArray();
    
    if (product.length > 0) {
      const p = product[0];
      const categoryInfo = p.categoryInfo;
      const brandInfo = p.brandInfo;
      
      console.log('✅ Product FOUND:', p.name);
      
      return {
        id: p.sequentialId || p._id.toString(),
        _id: p._id.toString(),
        sequentialId: p.sequentialId,
        name: p.name,
        description: p.description || '',
        price: p.price,
        originalPrice: p.originalPrice,
        stock: p.stock || 0,
        image: p.imageUrl || p.image || '/placeholder.jpg',
        imageUrl: p.imageUrl || p.image || '/placeholder.jpg',
        gallery: p.gallery || [],
        categoryPath: p.categoryPath || [],
        category: categoryInfo ? {
          id: categoryInfo._id.toString(),
          _id: categoryInfo._id.toString(),
          name: categoryInfo.name,
          slug: categoryInfo.slug || ''
        } : { name: 'بدون دسته', id: '', slug: '' },
        brand: brandInfo ? {
          _id: brandInfo._id.toString(),
          id: brandInfo._id.toString(),
          name: brandInfo.name,
          logo: brandInfo.logo,
          slug: brandInfo.slug || '',
          active: brandInfo.active || true,
          order: brandInfo.order || 0
        } : undefined,
        active: p.active !== false,
        featured: p.featured || false,
        slug: p.slug || '',
        rating: p.rating || 0,
        ratingCount: p.ratingCount || 0,
        views: p.views || 0,
        colors: p.colors || [],
        sizes: p.sizes || [],
        // فیلدهای محصولات دیجیتال
        productType: p.productType || 'PHYSICAL',
        isDigital: p.isDigital || p.productType === 'DIGITAL',
        downloadUrl: p.downloadUrl || '',
        previewUrl: p.previewUrl || '',
        previewType: p.previewType || 'template',
        fileSize: p.fileSize || 0,
        fileFormat: p.fileFormat || '',
        downloadLimit: p.downloadLimit,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      };
    }
    
    console.log('❌ Product NOT FOUND');
    return null;
  } catch (error) {
    console.error('❌ خطا در پیدا کردن محصول:', error);
    return null;
  }
}

// (Old local generateProductSchema removed; using central structured-data utilities.)

// تولید metadata
export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = await findProductBySlug(slug);
    
    if (product) {
      const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const canonicalPath = generateProductUrl(product, product.categoryPath?.length ? { slug: product.categoryPath[product.categoryPath.length-1]?.slug } : undefined);
      const canonicalUrl = base.replace(/\/$/, '') + canonicalPath;
      
      // حذف تگ‌های HTML از description برای نمایش بهتر در پیش‌نمایش شبکه‌های اجتماعی
      const stripHtml = (html: string) => {
        if (!html) return '';
        return html
          .replace(/<[^>]*>/g, '') // حذف تگ‌های HTML
          .replace(/&nbsp;/g, ' ') // تبدیل &nbsp; به فاصله
          .replace(/&amp;/g, '&')  // تبدیل &amp; به &
          .replace(/&lt;/g, '<')   // تبدیل &lt; به <
          .replace(/&gt;/g, '>')   // تبدیل &gt; به >
          .replace(/&quot;/g, '"') // تبدیل &quot; به "
          .replace(/\s+/g, ' ')    // حذف فاصله‌های اضافی
          .trim();
      };
      
      const productTitle = `${product.name} - فروشگاه آنلاین`;
      const cleanDescription = stripHtml(product.description || '');
      const productDescription = cleanDescription || `خرید ${product.name} با بهترین قیمت و کیفیت عالی.`;
      // محدود کردن طول description به 160 کاراکتر برای SEO
      const shortDescription = productDescription.length > 160 
        ? productDescription.substring(0, 157) + '...' 
        : productDescription;
      const productImage = product.imageUrl || product.image || '/placeholder.jpg';
      
      return {
        title: productTitle,
        description: shortDescription,
        keywords: `${product.name}, خرید آنلاین, فروشگاه, ${typeof product.category === 'object' ? product.category?.name || '' : product.category || 'محصولات'}`,
        metadataBase: new URL(base),
        openGraph: {
          title: productTitle,
          description: shortDescription,
          images: [{ url: productImage, width: 800, height: 600, alt: product.name }],
          type: 'website',
          locale: 'fa_IR',
        },
        twitter: {
          card: 'summary_large_image',
          title: productTitle,
          description: shortDescription,
          images: [productImage],
        },
        alternates: {
          canonical: canonicalUrl,
        },
      };
    }
  } catch (error) {
    console.error('خطا در تولید metadata:', error);
  }
  
  return {
    title: 'محصول - فروشگاه آنلاین',
    description: 'مشاهده جزئیات محصول در فروشگاه آنلاین ما.',
    keywords: 'فروشگاه آنلاین, خرید محصول, کیفیت عالی',
  };
}

// صفحه اصلی
export default async function ProductSlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  console.log('=== ProductSlugPage: slug =', slug);
  
  // ✨ تشخیص هوشمند: آیا URL برای محصول است یا دسته‌بندی؟
  // استراتژی جدید: همیشه ابتدا سعی می‌کنیم محصول را پیدا کنیم
  // چون دسته‌بندی‌های آخری که محصول دارند، باید به صفحه محصول برسند
  
  const lastSegment = slug[slug.length - 1];
  console.log('🔍 ProductSlugPage - Last segment:', lastSegment);
  console.log('🔍 Full slug array:', slug);
  
  // ✅ همیشه ابتدا تلاش می‌کنیم محصول را پیدا کنیم
  // این اجازه می‌دهد که URL های سلسله‌مراتبی مثل /products/plugin/test-seo/product-name کار کنند
  let product = null;
  
  try {
    product = await findProductBySlug(slug);
    console.log('=== ProductSlugPage: product =', product ? `FOUND: ${product.name}` : 'NULL');
  } catch (error) {
    console.error('خطا در جستجوی محصول:', error);
  }
  
  // اگر محصول پیدا نشد، پس این یک URL دسته‌بندی است
  if (!product) {
    console.log('=== ProductSlugPage: This is a CATEGORY URL (no product found)');
  }

  // اگر محصول پیدا نشد (یا URL دسته‌بندی بود), صفحه دسته‌بندی رو نشون بده
  if (!product) {
    // اگر URL دسته‌بندی است، بدون تغییر URL صفحه products رو render کن
    console.log('⚠️ No product found - this is a CATEGORY URL');
    console.log('🔄 Full path slugs:', slug);
    
    // ✅ استفاده از آخرین دسته برای فیلتر، ولی URL رو حفظ می‌کنیم
    const lastCategorySlug = slug[slug.length - 1];
    console.log('🔄 Loading category page for:', lastCategorySlug);
    
    // Import ProductsClient dynamically
    const ProductsClient = (await import('../route-handler')).default;
    return <ProductsClient initialCategory={lastCategorySlug} isFromSlug={true} />;
    
    // کد قدیمی که صفحه دسته‌بندی جداگانه می‌ساخت (غیرفعال شد):
    /*
    let categoryData: any = null;
    let categorySlug: string | null = null;
    
    try {
      const db = await connectDB();
      
      // تلاش برای پیدا کردن دسته‌بندی
      // 1. ابتدا آخرین slug را چک کن (زیردسته)
      const lastSlug = slug[slug.length - 1];
      let category = await db.categories.findOne({ slug: lastSlug });
      
      if (category) {
        console.log('Category found with last slug:', lastSlug);
        categorySlug = lastSlug;
        categoryData = category;
      }
      
      // 2. اگر چند slug داریم یا فقط یک slug، اولین را هم چک کن (دسته اصلی)
      if (!categorySlug && slug.length >= 1) {
        const firstSlug = slug[0];
        category = await db.categories.findOne({ slug: firstSlug });
        
        if (category) {
          console.log('Category found with first slug:', firstSlug);
          categorySlug = firstSlug;
          categoryData = category;
        }
      }
      
      // 3. اگر 2 slug داریم، slug دوم را هم چک کن
      if (!categorySlug && slug.length === 2) {
        const secondSlug = slug[1];
        category = await db.categories.findOne({ slug: secondSlug });
        
        if (category) {
          console.log('Category found with second slug:', secondSlug);
          categorySlug = secondSlug;
          categoryData = category;
        }
      }
      
    } catch (e) {
      console.warn('Category check failed:', e);
    }
    */
  }

  // Canonical URL normalization:
  // اگر محصول پیدا شد ولی URL فعلی با فرمت استاندارد متفاوت است (مثلاً slug-ObjectId یا includeId خاموش ولی URL شامل ID است) ریدایرکت دائمی بده
  if (product) {
    try {
      const settings = getUrlSettings();
      const canonical = generateProductUrl(product, product.categoryPath?.length ? { slug: product.categoryPath[product.categoryPath.length-1]?.slug } : undefined);
      const currentPath = '/products/' + slug.join('/');
      if (canonical !== currentPath) {
        // جلوگیری از حلقه: فقط اگر واقعاً متفاوت است
        redirect(canonical);
      }
    } catch (e) {
      console.warn('Canonical redirect check failed:', e);
    }
  }

  // ساخت همه اسکیماها (Product, Breadcrumb, FAQ, HowTo, AggregateRating/Review داخلی)
  const baseForSchemas = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  const schemas = buildAllSchemas(product, baseForSchemas.replace(/\/$/, ''));

  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  const canonicalPath = product ? generateProductUrl(product, product.categoryPath?.length ? { slug: product.categoryPath[product.categoryPath.length-1]?.slug } : undefined) : '/products/' + slug.join('/');
  const canonicalUrl = base.replace(/\/$/, '') + canonicalPath;
  // Related products (server-side): find same category, exclude current; fallback similar price range
  let related: Product[] = [];
  if (product) {
    try {
      const db = await connectDB();
      const categoryId = (product as any).categoryId || (product as any).category?._id || (product as any).category?.id;
      if (categoryId) {
        const baseMatch: any = { active: { $ne: false }, _id: { $ne: new ObjectId(product._id || product.id) } };
        if (categoryId) baseMatch.categoryId = typeof categoryId === 'string' && ObjectId.isValid(categoryId) ? new ObjectId(categoryId) : categoryId;
        const cursor = db.products.find(baseMatch).limit(12);
        const arr = await cursor.toArray();
        related = arr.map((p: any) => ({
          id: p.sequentialId || p._id.toString(),
          _id: p._id.toString(),
          sequentialId: p.sequentialId,
            name: p.name,
            description: p.description || '',
            price: p.price,
            originalPrice: p.originalPrice,
            stock: p.stock || 0,
            image: p.imageUrl || p.image || '/placeholder.jpg',
            imageUrl: p.imageUrl || p.image || '/placeholder.jpg',
            gallery: p.gallery || [],
            categoryPath: p.categoryPath || [],
            category: p.categoryId ? (product as any).category : undefined,
            active: p.active !== false,
            featured: p.featured || false,
            slug: p.slug || '',
            rating: p.rating || 0,
            ratingCount: p.ratingCount || 0,
            views: p.views || 0,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
        }));
      }
      // fallback by price similarity if too few
      if (related.length < 4) {
        const priceRange = {
          $gte: Math.max(0, (product.price || 0) * 0.7),
          $lte: (product.price || 0) * 1.3
        };
        const more = await (await connectDB()).products.find({
          _id: { $ne: new ObjectId(product._id || product.id) },
          price: priceRange
        }).limit(12).toArray();
        const mapped = more.map((p: any) => ({
          id: p.sequentialId || p._id.toString(),
          _id: p._id.toString(),
          sequentialId: p.sequentialId,
          name: p.name,
          description: p.description || '',
          price: p.price,
          originalPrice: p.originalPrice,
          stock: p.stock || 0,
          image: p.imageUrl || p.image || '/placeholder.jpg',
          imageUrl: p.imageUrl || p.image || '/placeholder.jpg',
          gallery: p.gallery || [],
          categoryPath: p.categoryPath || [],
          category: p.categoryId ? (product as any).category : undefined,
          active: p.active !== false,
          featured: p.featured || false,
          slug: p.slug || '',
          rating: p.rating || 0,
          ratingCount: p.ratingCount || 0,
          views: p.views || 0,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        }));
        // merge unique by id
        const existingIds = new Set(related.map(r => r.id));
        for (const m of mapped) {
          if (m.id !== product.id && !existingIds.has(m.id)) {
            related.push(m);
            existingIds.add(m.id);
          }
        }
      }
      // trim
      related = related.filter(r => r.id !== product.id).slice(0, 8);
    } catch (e) {
      console.warn('Related products fetch failed:', e);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" style={{ width: '100%' }}>
      {/* JSON-LD Schemas */}
      {schemas.product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.product) }}
        />
      )}
      {schemas.breadcrumb && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.breadcrumb) }}
        />
      )}
      {schemas.faq && schemas.faq.mainEntity?.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.faq) }}
        />
      )}
      {schemas.howto && schemas.howto.step?.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.howto) }}
        />
      )}
      <ProductDetailClient product={product} relatedProducts={related} />
    </div>
  );
}