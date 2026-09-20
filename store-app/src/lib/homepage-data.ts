import { connectDB } from '@/lib/mongodb';
import { unstable_cache } from 'next/cache';
import { getDynamicContent } from '@/lib/dynamicContent';
import { getSEODataByUrl } from '@/lib/seo-helpers';

// تابع دریافت تنظیمات سایت (ترکیب settings و dynamicContent)
export const getSiteSettings = unstable_cache(
  async () => {
    try {
      const db = await connectDB();
      
      // دریافت تنظیمات از collection settings
      const settings = await db.settings.findOne({ key: 'general' });
      const settingsData = settings?.data || {};
      
      // دریافت محتوای داینامیک
      const dynamicContent = await getDynamicContent();
      
      // ترکیب هر دو منبع - dynamicContent اولویت دارد
      const merged = {
        ...settingsData,
        site_name: dynamicContent.site_name || dynamicContent.seo_site_name || settingsData.site_name || 'فروشگاه آنلاین',
        site_description: dynamicContent.site_description || dynamicContent.seo_site_description || settingsData.site_description || 'بهترین محصولات با قیمت مناسب',
        site_title: dynamicContent.site_title || dynamicContent.seo_site_name || settingsData.site_title || 'فروشگاه آنلاین',
        site_subtitle: dynamicContent.site_subtitle || settingsData.site_subtitle || '',
        hero_title: dynamicContent.hero_title || settingsData.hero_title || '',
        logo_text: dynamicContent.logo_text || dynamicContent.site_name || settingsData.logo_text || '',
        seo_description: dynamicContent.seo_description || dynamicContent.seo_site_description || settingsData.seo_description || '',
        seo_keywords: dynamicContent.seo_keywords || settingsData.seo_keywords || '',
        seo_title: dynamicContent.seo_title || dynamicContent.seo_site_name || settingsData.seo_title || '',
        og_title: dynamicContent.og_title || dynamicContent.seo_site_name || settingsData.og_title || '',
        og_description: dynamicContent.og_description || dynamicContent.seo_site_description || settingsData.og_description || '',
      };
      
      return merged;
    } catch (error) {
      console.error('خطا در دریافت تنظیمات سایت:', error);
      return {};
    }
  },
  ['site-settings'],
  { revalidate: 60, tags: ['site-settings', 'dynamic-content'] } // هر 60 ثانیه refresh
);

// تابع دریافت تنظیمات header سایت
export const getSiteHeaderSettings = unstable_cache(
  async () => {
    try {
      const db = await connectDB();
      const settings = await db.siteHeaderSettings.findOne({});
      return settings || null;
    } catch (error) {
      console.error('خطا در دریافت تنظیمات header:', error);
      return null;
    }
  },
  ['site-header-settings'],
  { revalidate: 3600, tags: ['site-header-settings'] }
);

// تابع دریافت تنظیمات WhyUs
export const getWhyUsSettings = unstable_cache(
  async () => {
    try {
      const db = await connectDB();
      const settings = await db.whyUsSectionSettings.findOne({});
      return settings || null;
    } catch (error) {
      console.error('خطا در دریافت تنظیمات WhyUs:', error);
      return null;
    }
  },
  ['whyus-settings'],
  { revalidate: 3600, tags: ['whyus-settings'] }
);

// تابع دریافت تنظیمات Products Intro
export const getProductsIntroSettings = unstable_cache(
  async () => {
    try {
      const db = await connectDB();
      const settings = await db.getCollection('productsIntroSettings').findOne({});
      return settings || null;
    } catch (error) {
      console.error('خطا در دریافت تنظیمات Products Intro:', error);
      return null;
    }
  },
  ['products-intro-settings'],
  { revalidate: 3600, tags: ['products-intro-settings'] }
);

// تابع دریافت دسته‌بندی‌های ویژه
export const getFeaturedCategories = unstable_cache(
  async () => {
    try {
      const db = await connectDB();
      
      // دریافت تنظیمات بخش دسته‌بندی
      let categoriesCount = 6;
      let categoriesSortBy = 'order';
      let selectedCategories: string[] = [];
      
      try {
        const categorySettings = await db.categorySectionSettings.findOne({});
        if (categorySettings) {
          categoriesCount = categorySettings.displayCount || 6;
          categoriesSortBy = categorySettings.layout || 'order';
          selectedCategories = categorySettings.selectedCategories || [];
        }
      } catch (error) {
        console.error('خطا در دریافت تنظیمات دسته‌بندی:', error);
      }

      // دریافت دسته‌بندی‌ها
      let query: any = { active: true };
      let sort: any = {};

      // اگر دسته‌بندی‌های خاص انتخاب شده‌اند
      if (selectedCategories.length > 0) {
        // بررسی اینکه آیا selectedCategories شامل sequential ID هست یا ObjectId
        const firstId = selectedCategories[0];
        
        if (typeof firstId === 'number') {
          // اگر عدد بود، با sequentialId جستجو می‌کنیم
          query = { 
            active: true, 
            sequentialId: { $in: selectedCategories }
          };
        } else {
          // اگر string یا ObjectId بود
          query = { 
            active: true, 
            _id: { $in: selectedCategories.map(id => new ObjectId(id.toString())) }
          };
        }
      }

      // تنظیم مرتب‌سازی
      if (categoriesSortBy === 'order') {
        sort = { order: 1, _id: 1 }; // fallback به _id اگر order یکسان بود
      } else if (categoriesSortBy === 'name') {
        sort = { name: 1, _id: 1 };
      } else if (categoriesSortBy === 'created') {
        sort = { createdAt: -1, _id: 1 };
      } else {
        // اگر هیچ sort مشخص نبود، پیش‌فرض
        sort = { order: 1, _id: 1 };
      }

      // استفاده از aggregation برای گرفتن تعداد محصولات
      const { ObjectId } = await import('mongodb');
      
      const pipeline: any[] = [
        { $match: query },
        // Join با products برای شمارش - بررسی همه فیلدهای ممکن
        {
          $lookup: {
            from: 'products',
            let: { 
              categoryId: '$_id',
              categoryIdStr: { $toString: '$_id' },
              categorySeqId: '$sequentialId'
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $or: [
                          // بررسی ObjectId مستقیم
                          { $eq: ['$categoryId', '$$categoryId'] },
                          { $eq: ['$category', '$$categoryId'] },
                          { $eq: ['$category_id', '$$categoryId'] },
                          // بررسی string format
                          { $eq: ['$categoryId', '$$categoryIdStr'] },
                          { $eq: ['$category', '$$categoryIdStr'] },
                          { $eq: ['$category_id', '$$categoryIdStr'] },
                          // بررسی sequential ID
                          { $eq: ['$categoryId', '$$categorySeqId'] },
                          { $eq: ['$category', '$$categorySeqId'] },
                          { $eq: ['$category_id', '$$categorySeqId'] }
                        ]
                      },
                      { $eq: ['$active', true] }
                    ]
                  }
                }
              }
            ],
            as: 'products'
          }
        },
        // اضافه کردن فیلد تعداد محصولات
        {
          $addFields: {
            productCount: { $size: '$products' }
          }
        },
        // حذف آرایه products (فقط تعداد نیاز داریم)
        {
          $project: {
            products: 0
          }
        },
        // مرتب‌سازی
        { $sort: sort },
        // محدودیت تعداد
        { $limit: categoriesCount }
      ];

      const categories = await db.categories.aggregate(pipeline).toArray();

      // Debug: بررسی داده‌های برگشتی - اجباری برای production
      const debugInfo = categories.map(cat => ({
        name: cat.name,
        productCount: cat.productCount,
        _id: cat._id,
        sequentialId: cat.sequentialId
      }));
      
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG_MODE === 'true') {
        console.log('🔍 Categories with product count:', debugInfo);
        console.log('🔍 Total active products in DB:', await db.products.countDocuments({ active: true }));
      }

      return categories.map(cat => ({
        id: cat._id.toString(),
        _id: cat._id.toString(),
        name: cat.name,
        href: `/products/${cat.slug || cat._id}`,
        image: cat.image,
        description: cat.description,
        order: cat.order || 0,
        active: cat.active,
        slug: cat.slug,
        productCount: cat.productCount || 0
      }));
    } catch (error) {
      console.error('خطا در دریافت دسته‌بندی‌ها:', error);
      return [];
    }
  },
  ['featured-categories'],
  { revalidate: 600, tags: ['featured-categories', 'categories'] }
);

// تابع دریافت SEO data
export const getSEODataForUrl = unstable_cache(
  async (url: string = '/') => {
    return await getSEODataByUrl(url);
  },
  ['seo-data'],
  { revalidate: 3600, tags: ['seo-data'] }
);

// تابع دریافت SEO data برای صفحه اصلی
export const getSEOData = unstable_cache(
  async () => {
    return await getSEODataForUrl('/');
  },
  ['homepage-seo-data'],
  { revalidate: 3600, tags: ['seo-data'] }
);

// تابع کامل برای دریافت همه داده‌های صفحه اصلی
export const getHomePageData = unstable_cache(
  async () => {
    try {
      const [
        siteSettings,
        featuredCategories,
        seoData,
        siteHeaderSettings,
        whyUsSettings,
        productsIntroSettings
      ] = await Promise.all([
        getSiteSettings(),
        getFeaturedCategories(),
        getSEOData(),
        getSiteHeaderSettings(),
        getWhyUsSettings(),
        getProductsIntroSettings()
      ]);

      return {
        siteSettings,
        featuredCategories,
        seoData,
        siteHeaderSettings,
        whyUsSettings,
        productsIntroSettings
      };
    } catch (error) {
      console.error('خطا در دریافت داده‌های صفحه اصلی:', error);
      return {
        siteSettings: {},
        featuredCategories: [],
        seoData: null,
        siteHeaderSettings: null,
        whyUsSettings: null,
        productsIntroSettings: null
      };
    }
  },
  ['homepage-data'],
  { revalidate: 600, tags: ['homepage-data'] }
);

// تابع دریافت محصول به همراه دسته‌بندی
export const getProductById = unstable_cache(
  async (id: string) => {
    try {
      const db = await connectDB();
      const { ObjectId } = await import('mongodb');
      
      // بررسی validity of ObjectId
      if (!ObjectId.isValid(id)) {
        return null;
      }

      const productData = await db.products.aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $addFields: {
            category: { $arrayElemAt: ['$category', 0] }
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            price: 1,
            originalPrice: 1,
            stock: 1,
            imageUrl: 1,
            gallery: 1,
            categoryId: 1,
            active: 1,
            featured: 1,
            rating: 1,
            ratingCount: 1,
            productType: 1,
            downloadUrl: 1,
            fileSize: 1,
            fileFormat: 1,
            downloadLimit: 1,
            keyFeatures: 1,
            whatIncluded: 1,
            technicalSpecs: 1,
            productBenefits: 1,
            shippingInfo: 1,
            createdAt: 1,
            updatedAt: 1,
            'category._id': 1,
            'category.name': 1,
            'category.slug': 1,
          }
        }
      ]).toArray();

      if (productData.length === 0) {
        return null;
      }

      const product = productData[0];
      return {
        id: product._id.toString(),
        _id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        imageUrl: product.imageUrl,
        image: product.imageUrl,
        gallery: product.gallery,
        categoryId: product.categoryId?.toString(),
        category: product.category ? {
          id: product.category._id?.toString(),
          _id: product.category._id?.toString(),
          name: product.category.name,
          slug: product.category.slug
        } : undefined,
        active: product.active,
        featured: product.featured,
        rating: product.rating || 0,
        ratingCount: product.ratingCount || 0,
        productType: product.productType,
        downloadUrl: product.downloadUrl,
        fileSize: product.fileSize,
        fileFormat: product.fileFormat,
        downloadLimit: product.downloadLimit,
        keyFeatures: product.keyFeatures || [],
        whatIncluded: product.whatIncluded || [],
        technicalSpecs: product.technicalSpecs || {},
        productBenefits: product.productBenefits || [],
        shippingInfo: product.shippingInfo,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    } catch (error) {
      console.error('خطا در دریافت محصول:', error);
      return null;
    }
  },
  ['product-detail'],
  { revalidate: 300, tags: ['product-detail', 'products'] }
);