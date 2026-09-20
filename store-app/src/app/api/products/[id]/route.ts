import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { CacheManager, CACHE_KEYS } from '@/lib/cache-manager';
import { slugify } from '@/utils/helpers';
import {
  buildCategoryPath,
  categoryRefFilter,
  findCategoryById,
  toObjectId,
} from '@/lib/category-db-helpers';

export const dynamic = 'force-dynamic';

// Zod schema with coercion (accepts numeric strings) & all optional for PATCH‑like PUT
const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().min(5).optional(),
  price: z.coerce.number().positive().optional(),
  originalPrice: z.coerce.number().positive().nullable().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().min(1).optional(),
  gallery: z.array(z.string().min(1)).optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  active: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  weight: z.coerce.number().min(0).optional(),
  productType: z.enum(['PHYSICAL','DIGITAL']).optional(),
  tags: z.array(z.string()).optional(),
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
  downloadUrl: z.string().optional(),
  fileSize: z.coerce.number().optional(),
  fileFormat: z.string().optional(),
  downloadLimit: z.coerce.number().int().nullable().optional(),
  previewUrl: z.string().optional(), // لینک پیش‌نمایش زنده
  previewType: z.enum(['template', 'plugin', 'theme', 'app']).optional(), // نوع پیش‌نمایش
  isDigital: z.boolean().optional(), // فلگ محصول دیجیتال
});

function formatProduct(raw: any) {
  if (!raw) return null;
  return {
    _id: raw._id?.toString(),
    id: raw._id?.toString(),
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    price: raw.price,
    originalPrice: raw.originalPrice,
    stock: raw.stock,
    imageUrl: raw.imageUrl,
    gallery: raw.gallery || [],
    categoryId: raw.categoryId?.toString(),
    brandId: raw.brandId?.toString(),
    categoryPath: raw.categoryPath || [],
    sequentialId: raw.sequentialId,
    active: raw.active,
    featured: raw.featured,
    weight: raw.weight || 0,
    rating: raw.rating || 0,
    ratingCount: raw.ratingCount || 0,
    views: raw.views || 0,
    productType: raw.productType || 'PHYSICAL',
    tags: raw.tags || [],
    keyFeatures: raw.keyFeatures || [],
    whatIncluded: raw.whatIncluded || [],
    technicalSpecs: raw.technicalSpecs || { weight: '', dimensions: '', material: '', brand: '', warranty: '', origin: '' },
    productBenefits: raw.productBenefits || [],
    shippingInfo: raw.shippingInfo || '',
    colors: raw.colors || [],
    sizes: raw.sizes || [],
    downloadUrl: raw.downloadUrl || '',
    fileSize: raw.fileSize || 0,
    fileFormat: raw.fileFormat || '',
    downloadLimit: raw.downloadLimit ?? null,
    previewUrl: raw.previewUrl || '', // لینک پیش‌نمایش زنده
    previewType: raw.previewType || 'template', // نوع پیش‌نمایش
    isDigital: raw.isDigital || (raw.productType === 'DIGITAL'), // فلگ محصول دیجیتال
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// GET /api/products/[id] - Get single product
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'شناسه محصول نامعتبر است' }, { status: 400 });
    const db = await connectDB();
    
    // افزایش تعداد بازدید
    await db.products.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { views: 1 } }
    );
    
    const product = await db.products.aggregate([
      { $match: { _id: new ObjectId(id) } },
      { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
      { $addFields: { category: { $arrayElemAt: ['$category', 0] } } }
    ]).toArray();
    if (!product.length) return NextResponse.json({ success: false, error: 'محصول یافت نشد' }, { status: 404 });
    return NextResponse.json({ success: true, data: formatProduct(product[0]) });
  } catch (e) {
    console.error('Product GET error:', e);
    return NextResponse.json({ success: false, error: 'خطا در دریافت محصول' }, { status: 500 });
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'شناسه محصول نامعتبر است' }, { status: 400 });

    const rawBody = await req.json();
    // Normalize top-level fields (empty strings -> undefined, boolean strings -> booleans)
    const normalized: Record<string, any> = {};
    for (const [k, v] of Object.entries(rawBody || {})) {
      if (v === '') continue; // skip empty so it's not set
      if (v === 'true') { normalized[k] = true; continue; }
      if (v === 'false') { normalized[k] = false; continue; }
      normalized[k] = v;
    }

    let data; // validated
    try {
      data = updateProductSchema.parse(normalized);
    } catch (e) {
      if (e instanceof z.ZodError) {
        console.error('Zod validation error (PUT product):', e.issues, '\nIncoming:', rawBody);
        return NextResponse.json({ success: false, error: 'داده‌های ورودی نامعتبر', details: e.issues }, { status: 400 });
      }
      throw e;
    }

    const db = await connectDB();
    const existing = await db.products.findOne({ _id: new ObjectId(id) });
    if (!existing) return NextResponse.json({ success: false, error: 'محصول یافت نشد' }, { status: 404 });

    const update: any = { updatedAt: new Date() };
    // Only copy defined properties
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) update[k] = v;
    }

    // Auto slug generation - فقط اگر slug در درخواست وجود نداشته باشد و محصول قبلی هم slug نداشته باشد
    // اگر کاربر slug را ارسال کرده (حتی خالی)، دست به slug نمی‌زنیم
    if (data.name && !('slug' in rawBody) && !existing.slug) {
      update.slug = slugify(data.name);
    }

    // Category processing & categoryPath rebuild logic
    // حالات:
    // 1) categoryId در ورودی هست -> اعتبارسنجی و ساخت مسیر جدید
    // 2) categoryId در ورودی نیست ولی محصول قبلی categoryId دارد و مسیر نیاز به sync دارد -> بازتولید مسیر
    // 3) اگر categoryId حذف شود (عبور null یا '') فعلاً پشتیبانی نمی‌کنیم مگر نیاز باشد
    if (data.categoryId) {
      if (!ObjectId.isValid(data.categoryId)) {
        return NextResponse.json({ success: false, error: 'شناسه دسته‌بندی نامعتبر است' }, { status: 400 });
      }
      const category = await findCategoryById(db, data.categoryId);
      if (!category) {
        return NextResponse.json({ success: false, error: 'دسته‌بندی انتخاب شده معتبر نیست' }, { status: 400 });
      }
      const catId = toObjectId(category._id);
      update.categoryId = catId;
      update.categoryPath = await buildCategoryPath(db, catId);
    } else if (!data.categoryId && existing.categoryId) {
      // چک کنیم اگر categoryPath فعلی با ساختار موجود متفاوت است یا خالی است دوباره بسازیم
      try {
        const currentCatId = existing.categoryId instanceof ObjectId ? existing.categoryId : new ObjectId(existing.categoryId);
        const rebuilt = await buildCategoryPath(db, currentCatId);
        const existingPath = Array.isArray(existing.categoryPath) ? existing.categoryPath : [];
        const changed = JSON.stringify(rebuilt) !== JSON.stringify(existingPath);
        if (changed || existingPath.length === 0) {
          update.categoryPath = rebuilt;
        }
      } catch (catErr) {
        console.warn('Category path rebuild skipped:', catErr);
      }
    }

    await db.products.updateOne({ _id: new ObjectId(id) }, { $set: update });

    const product = await db.products.aggregate([
      { $match: { _id: new ObjectId(id) } },
      { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
      { $addFields: { category: { $arrayElemAt: ['$category', 0] } } }
    ]).toArray();

    await Promise.all([
      CacheManager.invalidatePattern(`${CACHE_KEYS.PRODUCTS}*`),
      CacheManager.invalidatePattern(`${CACHE_KEYS.CATEGORIES}*`)
    ]);

    return NextResponse.json({ success: true, data: formatProduct(product[0]), message: 'محصول با موفقیت بروزرسانی شد' });
  } catch (e) {
    console.error('Product PUT error (unexpected):', e);
    return NextResponse.json({ success: false, error: 'خطا در بروزرسانی محصول' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('DELETE product - Received ID:', id, 'Type:', typeof id);
    
    const db = await connectDB();
    
    // Find product by sequential ID first, then by ObjectId
    let productFilter: any;
    let existing: any;
    
    if (typeof id === 'string' && !ObjectId.isValid(id)) {
      // Try sequential ID
      const sequentialId = parseInt(id);
      if (!isNaN(sequentialId)) {
        productFilter = { sequentialId: sequentialId };
        existing = await db.products.findOne(productFilter);
        console.log('DELETE - Searching by sequentialId:', sequentialId, 'Found:', !!existing);
      }
    } else if (ObjectId.isValid(id)) {
      // Try ObjectId
      productFilter = { _id: new ObjectId(id) };
      existing = await db.products.findOne(productFilter);
      console.log('DELETE - Searching by ObjectId:', id, 'Found:', !!existing);
    }
    
    if (!existing) {
      console.log('DELETE - Product not found with filter:', productFilter);
      return NextResponse.json({ success: false, error: 'محصول یافت نشد' }, { status: 404 });
    }

    console.log('DELETE - Found product:', existing.name, 'ID:', existing._id);

    // Check if product is used in orders
    const orderCount = await db.orderItems.countDocuments({ 
      productId: existing._id 
    });
    
    console.log('DELETE - Order count for product:', orderCount);

    if (orderCount > 0) {
      // If product is used in orders, deactivate instead of delete
      await db.products.updateOne(
        { _id: existing._id }, 
        { $set: { active: false, updatedAt: new Date() } }
      );
      await Promise.all([
        CacheManager.invalidatePattern(`${CACHE_KEYS.PRODUCTS}*`),
        CacheManager.invalidatePattern(`${CACHE_KEYS.CATEGORIES}*`)
      ]);
      console.log('DELETE - Product deactivated due to existing orders');
      return NextResponse.json({ success: true, message: 'محصول غیرفعال شد (به دلیل وجود سفارش)' });
    }

    // Delete the product
    const deleteResult = await db.products.deleteOne({ _id: existing._id });
    console.log('DELETE - Delete result:', deleteResult);
    
    await Promise.all([
      CacheManager.invalidatePattern(`${CACHE_KEYS.PRODUCTS}*`),
      CacheManager.invalidatePattern(`${CACHE_KEYS.CATEGORIES}*`)
    ]);
    
    console.log('DELETE - Product deleted successfully');
    return NextResponse.json({ success: true, message: 'محصول با موفقیت حذف شد' });
    
  } catch (e) {
    console.error('Product DELETE error:', e);
    return NextResponse.json({ success: false, error: 'خطا در حذف محصول' }, { status: 500 });
  }
}
