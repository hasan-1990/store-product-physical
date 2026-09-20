import { NextRequest, NextResponse } from 'next/server';
import { mongodb, connectDB } from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/cache-manager';
import { slugify, buildProductSlug } from '@/utils/helpers';
import { getNextProductSequence } from '@/lib/sequences';
import {
  buildCategoryPath,
  findCategoryById,
  toObjectId,
} from '@/lib/category-db-helpers';

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(2, 'نام محصول باید حداقل 2 کاراکتر باشد').transform(s => s.trim()),
  slug: z.string().optional(), // اختیاری - اگر نباشد از name ساخته می‌شود
  description: z.string().optional().default('').transform(s => s || ''), // توضیحات اختیاری
  price: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().positive('قیمت باید مثبت باشد')),
  originalPrice: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().positive()).optional(),
  stock: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().int().min(0, 'موجودی نمی‌تواند منفی باشد')).default(0),
  imageUrl: z.string().optional().default('/images/products/placeholder.svg'), // تصویر اختیاری
  gallery: z.array(z.string()).optional().default([]),
  categoryId: z.string().min(1, 'انتخاب دسته‌بندی الزامی است').refine(
    (id) => id && id.trim() !== '' && id !== 'undefined', 
    { message: 'دسته‌بندی باید انتخاب شود' }
  ),
  brandId: z.string().optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  weight: z.union([z.number(), z.string().transform(Number)]).pipe(z.number().min(0)).optional(),
  // Digital product fields
  productType: z.enum(['PHYSICAL', 'DIGITAL']).default('PHYSICAL'),
  downloadUrl: z.string().optional(),
  fileSize: z.union([
    z.number().positive('حجم فایل باید بزرگتر از صفر باشد'),
    z.literal(0),
    z.null(),
    z.undefined()
  ]).optional(),
  fileFormat: z.string().optional(),
  downloadLimit: z.number().int().positive().optional().nullable(),
  previewUrl: z.string().optional(), // لینک پیش‌نمایش زنده
  previewType: z.enum(['template', 'plugin', 'theme', 'app']).optional(), // نوع پیش‌نمایش
  isDigital: z.boolean().optional(), // فلگ محصول دیجیتال
  // New fields for product details
  keyFeatures: z.array(z.string()).optional().default([]),
  whatIncluded: z.array(z.string()).optional().default([]),
  technicalSpecs: z.object({
    weight: z.string().optional(),
    dimensions: z.string().optional(),
    material: z.string().optional(),
    brand: z.string().optional(),
    warranty: z.string().optional(),
    origin: z.string().optional(),
  }).optional().default({}),
  productBenefits: z.array(z.string()).optional().default([]),
  shippingInfo: z.string().optional().default(''),
  colors: z.array(z.object({
    id: z.string(),
    name: z.string(),
    value: z.string(),
    available: z.boolean(),
  })).optional().default([]),
  sizes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    value: z.string(),
    available: z.boolean(),
    price: z.number().optional(),
  })).optional().default([]),
}).passthrough(); // اجازه فیلدهای اضافی

const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(1).optional(), // اگر ارسال شد باید حداقل 1 کاراکتر باشد
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  originalPrice: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  imageUrl: z.string().min(1).optional(),
  gallery: z.array(z.string().min(1)).optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  weight: z.number().min(0).optional(),
  // Digital product fields
  productType: z.enum(['PHYSICAL', 'DIGITAL']).optional(),
  downloadUrl: z.string().optional(),
  fileSize: z.union([
    z.number().positive('حجم فایل باید بزرگتر از صفر باشد'),
    z.literal(0),
    z.null(),
    z.undefined()
  ]).optional(),
  fileFormat: z.string().optional(),
  downloadLimit: z.number().int().positive().optional().nullable(),
  previewUrl: z.string().optional(), // لینک پیش‌نمایش زنده
  previewType: z.enum(['template', 'plugin', 'theme', 'app']).optional(), // نوع پیش‌نمایش
  isDigital: z.boolean().optional(), // فلگ محصول دیجیتال
  // New fields for product details
  keyFeatures: z.array(z.string()).optional(),
  whatIncluded: z.array(z.string()).optional(),
  technicalSpecs: z.object({
    weight: z.string().optional(),
    dimensions: z.string().optional(),
    material: z.string().optional(),
    brand: z.string().optional(),
    warranty: z.string().optional(),
    origin: z.string().optional(),
  }).optional(),
  productBenefits: z.array(z.string()).optional(),
  shippingInfo: z.string().optional(),
  colors: z.array(z.object({
    id: z.string(),
    name: z.string(),
    value: z.string(),
    available: z.boolean(),
  })).optional(),
  sizes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    value: z.string(),
    available: z.boolean(),
    price: z.number().optional(),
  })).optional(),
});

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const active = searchParams.get('active');
    const featured = searchParams.get('featured');
    const discount = searchParams.get('discount'); // پارامتر جدید برای محصولات تخفیفی
    const type = searchParams.get('type'); // latest, most_viewed, best_selling, highest_rated
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const sortType = searchParams.get('sort'); // پارامتر جدید برای انواع چینش

    // Create cache key from query parameters
    const cacheKey = `${CACHE_KEYS.PRODUCTS}list:${page}:${limit}:${search}:${categoryId}:${active}:${featured}:${discount}:${type}:${sortBy}:${sortOrder}:${sortType}`;
    
    // Try to get from cache first
    const cachedProducts = await CacheManager.get(cacheKey);
    if (cachedProducts) {
      return NextResponse.json(cachedProducts);
    }

    const db = await connectDB();
    const skip = (page - 1) * limit;

    // Build MongoDB filter
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (categoryId) {
      filter.categoryId = new ObjectId(categoryId);
    }
    
    if (active !== null) {
      filter.active = active === 'true';
    }
    
    if (featured !== null) {
      filter.featured = featured === 'true';
    }

    // فیلتر محصولات تخفیفی (محصولاتی که originalPrice دارند و بیشتر از price است)
    if (discount === 'true') {
      filter.originalPrice = { $exists: true, $ne: null };
      filter.$expr = { $gt: ['$originalPrice', '$price'] };
    }

    // Build sort
    const sort: any = {};
    
    // Handle different product types - FIXED SORTING
    if (type) {
      switch (type) {
        case 'latest':
          // جدیدترین محصولات - بر اساس تاریخ ایجاد
          sort.createdAt = -1;
          break;
        case 'most_viewed':
          // پربازدیدترین - بر اساس تعداد بازدید
          // اگر views نداشت، صفر در نظر بگیر
          sort.views = -1;
          sort.createdAt = -1; // سورت ثانویه
          break;
        case 'best_selling':
          // پرفروش‌ترین - بر اساس تعداد فروش
          // اول soldCount بعد salesCount بعد featured
          sort.soldCount = -1;
          sort.salesCount = -1;
          sort.createdAt = -1;
          break;
        case 'highest_rated':
          // بالاترین امتیاز - بر اساس rating
          sort.rating = -1;
          sort.ratingCount = -1; // سورت ثانویه
          sort.createdAt = -1;
          break;
        default:
          sort.createdAt = -1;
      }
    }
    // اگر پارامتر sortType استفاده شده باشد، آن را در نظر بگیرید
    else if (sortType) {
      switch (sortType) {
        case 'latest':
          sort.createdAt = -1;
          break;
        case 'popular':
          sort.views = -1; // فرض می‌کنیم فیلد views وجود دارد
          break;
        case 'random':
          // برای چینش تصادفی از aggregation pipeline استفاده می‌کنیم
          break;
        default:
          sort.createdAt = -1;
      }
    } else {
      // منطق قدیمی چینش
      if (sortBy === 'price') {
        sort.price = sortOrder === 'desc' ? -1 : 1;
      } else if (sortBy === 'rating') {
        sort.rating = sortOrder === 'desc' ? -1 : 1;
      } else if (sortBy === 'stock') {
        sort.stock = sortOrder === 'desc' ? -1 : 1;
      } else {
        sort.createdAt = sortOrder === 'desc' ? -1 : 1;
      }
    }

    // Get products with category info
    let pipeline: any[] = [
      { $match: filter },
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
          category: { $arrayElemAt: ['$category', 0] },
          // اضافه کردن مقادیر پیش‌فرض برای فیلدهایی که null یا undefined هستند
          views: { $ifNull: ['$views', 0] },
          soldCount: { $ifNull: ['$soldCount', 0] },
          salesCount: { $ifNull: ['$salesCount', 0] },
          rating: { $ifNull: ['$rating', 0] },
          ratingCount: { $ifNull: ['$ratingCount', 0] }
        }
      }
    ];

    // اگر چینش تصادفی باشد، $sample استفاده کنیم
    if (sortType === 'random') {
      pipeline.push({ $sample: { size: limit } });
    } else {
      pipeline.push({ $sort: sort });
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });
    }

    pipeline.push({
      $project: {
        _id: 1,
        sequentialId: 1,
        categoryPath: 1,
        name: 1,
        slug: 1,
        description: 1,
        price: 1,
        originalPrice: 1,
        stock: 1,
        imageUrl: 1,
        gallery: 1,
        categoryId: 1,
        active: 1,
        featured: 1,
        weight: 1,
        rating: 1,
        ratingCount: 1,
        views: 1, // اضافه شد برای پربازدیدترین
        soldCount: 1, // اضافه شد برای پرفروش‌ترین
        salesCount: 1, // اضافه شد برای پرفروش‌ترین
        type: 1,
        fileUrl: 1,
        downloadLimit: 1,
        downloadUrl: 1,
        fileSize: 1,
        fileFormat: 1,
        previewUrl: 1,
        previewType: 1,
        isDigital: 1,
        productType: 1,
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
    });

    const products = await db.products.aggregate(pipeline).toArray();

    // تبدیل فرمت برای سازگاری با فرانت‌اند
    const formattedProducts = products.map(product => {
      // Fallback id strategy: prefer sequentialId; else use _id string
      const fallbackId = product.sequentialId || product._id?.toString();

      // محاسبه درصد تخفیف
      let discountPercentage = 0;
      if (product.originalPrice && product.originalPrice > product.price) {
        discountPercentage = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      }

      return {
        _id: product._id?.toString(), // اضافه کردن _id اصلی برای cart
        id: fallbackId,
        sequentialId: product.sequentialId,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercentage: discountPercentage, // اضافه کردن درصد تخفیف
        stock: product.stock,
        image: product.imageUrl,
        imageUrl: product.imageUrl, // اضافه کردن imageUrl برای سازگاری
        gallery: product.gallery,
        categoryId: product.categoryId?.toString(),
        category: product.category ? {
          id: product.category._id?.toString(),
          _id: product.category._id?.toString(),
          name: product.category.name,
          slug: product.category.slug
        } : { name: 'بدون دسته', slug: '' },
        categoryPath: product.categoryPath,
        active: product.active,
        featured: product.featured,
        weight: product.weight,
        rating: product.rating || 0,
        ratingCount: product.ratingCount || 0,
        views: product.views || 0,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    const total = await db.products.countDocuments(filter);

    const response = {
      success: true,
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };

    // Cache the response for 15 minutes
    await CacheManager.set(cacheKey, response, CACHE_TTL.PRODUCTS);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت محصولات' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const db = await connectDB();
    const body = await request.json();
    
    console.log('📦 POST Product - Raw body:', JSON.stringify(body, null, 2));
    
    // بررسی فیلدهای اجباری قبل از validation
    if (!body.name || !body.name.trim()) {
      console.error('❌ نام محصول خالی است');
      return NextResponse.json({ 
        success: false, 
        error: 'نام محصول الزامی است' 
      }, { status: 400 });
    }
    
    if (!body.categoryId || !body.categoryId.trim()) {
      console.error('❌ دسته‌بندی خالی است');
      return NextResponse.json({ 
        success: false, 
        error: 'انتخاب دسته‌بندی الزامی است' 
      }, { status: 400 });
    }
    
    if (!body.price || parseFloat(body.price) <= 0) {
      console.error('❌ قیمت نامعتبر است:', body.price);
      return NextResponse.json({ 
        success: false, 
        error: 'قیمت باید عددی مثبت باشد' 
      }, { status: 400 });
    }
    
    // اگر slug ارسال نشده، از name بسازیم
    if (!body.slug || !body.slug.trim()) {
      body.slug = slugify(body.name);
      console.log('📦 Auto-generated slug from name:', body.slug);
    } else {
      body.slug = slugify(body.slug);
    }
    
    let validatedData;
    try {
      validatedData = createProductSchema.parse(body);
    } catch (validationError: any) {
      console.error('❌ Validation error:', validationError.errors || validationError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'داده‌های ورودی نامعتبر است',
          details: validationError.errors || validationError.message
        },
        { status: 400 }
      );
    }

    // Validate categoryId format
    if (!validatedData.categoryId || validatedData.categoryId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'لطفاً دسته‌بندی محصول را انتخاب کنید' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(validatedData.categoryId)) {
      return NextResponse.json(
        { success: false, error: 'شناسه دسته‌بندی نامعتبر است' },
        { status: 400 }
      );
    }

    // Check if category exists and build category path
    const category = await findCategoryById(db, validatedData.categoryId);

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'دسته‌بندی انتخاب شده معتبر نیست' },
        { status: 400 }
      );
    }

    const categoryObjectId = toObjectId(category._id);
    const categoryPath = await buildCategoryPath(db, categoryObjectId);

    // دریافت ID افزایشی جدید با helper متمرکز
    const sequentialId = await getNextProductSequence();

    // اگر slug نداشت، از name بسازیم
    const productSlug = validatedData.slug ? slugify(validatedData.slug) : slugify(validatedData.name);

    const productData = {
      ...validatedData,
      slug: productSlug,
      categoryId: categoryObjectId,
      sequentialId: sequentialId,
      categoryPath: categoryPath,
      gallery: validatedData.gallery || [],
      rating: 0,
      ratingCount: 0,
      views: 0,
      soldCount: 0,
      salesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await db.products.insertOne(productData);
    
    // Get the created product with category info
    const product = await db.products.aggregate([
      { $match: { _id: insertResult.insertedId } },
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
          slug: 1,
          description: 1,
          price: 1,
          originalPrice: 1,
          stock: 1,
          imageUrl: 1,
          gallery: 1,
          categoryId: 1,
          sequentialId: 1,
          categoryPath: 1,
          active: 1,
          featured: 1,
          weight: 1,
          rating: 1,
          ratingCount: 1,
          type: 1,
          fileUrl: 1,
          downloadLimit: 1,
          downloadUrl: 1,
          fileSize: 1,
          fileFormat: 1,
          previewUrl: 1,
          previewType: 1,
          isDigital: 1,
          productType: 1,
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
          'category.sequentialId': 1,
        }
      }
    ]).toArray();

    // Invalidate related caches after creating a product
    await Promise.all([
      CacheManager.invalidatePattern(`${CACHE_KEYS.PRODUCTS}*`),
      CacheManager.invalidatePattern(`${CACHE_KEYS.CATEGORIES}*`)
    ]);

    return NextResponse.json({
      success: true,
      data: product[0],
      message: 'محصول با موفقیت ایجاد شد',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'داده‌های ورودی نامعتبر',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Products POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در ایجاد محصول',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// PUT /api/products - Update existing product
export async function PUT(request: NextRequest) {
  try {
    const db = await connectDB();
    const body = await request.json();
    
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول الزامی است' },
        { status: 400 }
      );
    }

    // Validate update data
    const validatedData = updateProductSchema.parse(updateData);

    // If categoryId is being updated, validate it and build new category path
    let categoryPath;
    let categoryObjectId: ObjectId | undefined;
    if (validatedData.categoryId) {
      if (!ObjectId.isValid(validatedData.categoryId)) {
        return NextResponse.json(
          { success: false, error: 'شناسه دسته‌بندی نامعتبر است' },
          { status: 400 }
        );
      }

      const category = await findCategoryById(db, validatedData.categoryId);

      if (!category) {
        return NextResponse.json(
          { success: false, error: 'دسته‌بندی انتخاب شده معتبر نیست' },
          { status: 400 }
        );
      }

      categoryObjectId = toObjectId(category._id);
      categoryPath = await buildCategoryPath(db, categoryObjectId);
    }

    // Find product by sequential ID first, then by _id (build filter early because we may need current doc)
    let productFilter: any;
    if (typeof id === 'number' || (typeof id === 'string' && !ObjectId.isValid(id))) {
      productFilter = { sequentialId: parseInt(id.toString()) };
    } else {
      productFilter = { _id: new ObjectId(id) };
    }

    const currentProduct = await db.products.findOne(productFilter);
    if (!currentProduct) {
      return NextResponse.json(
        { success: false, error: 'محصول پیدا نشد' },
        { status: 404 }
      );
    }

    // Prepare update data base
    const updateFields: any = {
      ...validatedData,
      updatedAt: new Date()
    };

    // Slug logic:
    // 1) اگر کاربر slug صریح فرستاده، همان (نرمال) پذیرفته می‌شود
    if (validatedData.slug) {
      const manual = slugify(validatedData.slug);
      updateFields.slug = manual || 'product-' + Date.now();
    } else if (validatedData.name || validatedData.technicalSpecs) {
      // 2) اگر slug نیامده ولی name یا brand/model تغییر کرده، slug جدید بساز
      const brandU = (validatedData as any)?.technicalSpecs?.brand ?? currentProduct?.technicalSpecs?.brand;
      const modelU = (validatedData as any)?.technicalSpecs?.model ?? currentProduct?.technicalSpecs?.model;
      const baseName = validatedData.name || currentProduct.name || 'product';
      let newSlug = buildProductSlug({
        name: baseName,
        brand: brandU,
        model: modelU
      });
      updateFields.slug = newSlug || 'product-' + Date.now();
    } // else: هیچ تغییری در slug

    if (validatedData.categoryId && categoryObjectId) {
      updateFields.categoryId = categoryObjectId;
      updateFields.categoryPath = categoryPath;
    }


    const updateResult = await db.products.updateOne(
      productFilter,
      { $set: updateFields }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'محصول پیدا نشد' },
        { status: 404 }
      );
    }

    // Get the updated product with category info
    const updatedProduct = await db.products.aggregate([
      { $match: productFilter },
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
          sequentialId: 1,
          name: 1,
          slug: 1,
          description: 1,
          price: 1,
          originalPrice: 1,
          stock: 1,
          imageUrl: 1,
          gallery: 1,
          categoryId: 1,
          categoryPath: 1,
          active: 1,
          featured: 1,
          weight: 1,
          rating: 1,
          ratingCount: 1,
          type: 1,
          fileUrl: 1,
          downloadLimit: 1,
          downloadUrl: 1,
          fileSize: 1,
          fileFormat: 1,
          previewUrl: 1,
          previewType: 1,
          isDigital: 1,
          productType: 1,
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

    // Invalidate related caches after updating a product
    await Promise.all([
      CacheManager.invalidatePattern(`${CACHE_KEYS.PRODUCTS}*`),
      CacheManager.invalidatePattern(`${CACHE_KEYS.CATEGORIES}*`)
    ]);

    return NextResponse.json({
      success: true,
      data: updatedProduct[0],
      message: 'محصول با موفقیت بروزرسانی شد',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'داده‌های ورودی نامعتبر',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Products PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی محصول' },
      { status: 500 }
    );
  }
}
