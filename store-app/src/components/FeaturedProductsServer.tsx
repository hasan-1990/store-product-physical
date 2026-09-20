import { connectDB } from '@/lib/mongodb';
import { Product } from '@/types';
import FeaturedProductsClient from './FeaturedProductsClient';

// Server Component - داده‌ها را از دیتابیس می‌گیرد
export default async function FeaturedProductsServer() {
  let products: Product[] = [];
  let settings = null;

  try {
    const db = await connectDB();
    
    // دریافت تنظیمات محصولات ویژه
    const settingsDoc = await db.tabbedProducts2Settings.findOne({});
    settings = settingsDoc ? {
      enabled: settingsDoc.enabled !== false,
      title: settingsDoc.title || 'محصولات ویژه',
      subtitle: settingsDoc.subtitle || 'محصولات منتخب و برتر ما'
    } : { enabled: true, title: 'محصولات ویژه', subtitle: 'محصولات منتخب و برتر ما' };

    // اگر بخش غیرفعال است، محصولات را نگیر
    if (!settings.enabled) {
      return null;
    }

    // دریافت جدیدترین محصولات فعال - فقط 4 عدد
    const productsData = await db.products
      .find({ 
        active: true,
        stock: { $gt: 0 }
      })
      .sort({ createdAt: -1 })
      .limit(4)
      .toArray();
    
    // تبدیل به فرمت Product
    products = productsData.map((product: any) => ({
      _id: product._id?.toString() || '',
      id: product._id?.toString() || product.id || '',
      sequentialId: product.sequentialId,
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      price: product.price || 0,
      salePrice: product.salePrice,
      compareAtPrice: product.compareAtPrice,
      originalPrice: product.originalPrice,
      // فیلدهای تصویر
      image: product.image || product.imageUrl || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null),
      imageUrl: product.imageUrl || product.image || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null),
      images: Array.isArray(product.images) ? product.images : [],
      category: product.category,
      categories: product.categories,
      stock: product.stock || 0,
      featured: product.featured || false,
      active: product.active !== false,
      tags: product.tags || [],
      rating: product.rating,
      reviewCount: product.reviewCount,
      createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: product.updatedAt ? new Date(product.updatedAt).toISOString() : new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error loading featured products from database:', error);
    return null;
  }

  // اگر محصولی نیست، null برگردان
  if (products.length === 0) {
    return null;
  }

  // wrapper با ارتفاع مناسب
  return (
    <div className="w-full">
      <FeaturedProductsClient 
        products={products}
        settings={settings}
      />
    </div>
  );
}
