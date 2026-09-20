import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import { CacheManager, CACHE_KEYS } from '@/lib/cache-manager';
import { categoryRefFilter, categoryIdFilter, findCategoryById } from '@/lib/category-db-helpers';

// Force dynamic rendering - disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: دریافت یک دسته‌بندی بر اساس ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه نامعتبر است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const category = await db.categories.findOne({ _id: new ObjectId(id) });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('خطا در دریافت دسته‌بندی:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    );
  }
}

// PUT: بروزرسانی دسته‌بندی
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه نامعتبر است' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, slug, description, imageUrl, active, order, parentId } = body;

    // اعتبارسنجی داده‌های ورودی
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'نام و شناسه یکتا الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // بررسی یکتا بودن slug (به جز دسته‌بندی جاری)
    const existingCategory = await db.categories.findOne({
      slug,
      _id: { $ne: new ObjectId(id) },
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'شناسه یکتا قبلاً استفاده شده است' },
        { status: 400 }
      );
    }

    // آماده‌سازی داده‌های بروزرسانی
    const updateData: any = {
      name,
      slug,
      description: description || '',
      imageUrl: imageUrl || '',
      active: active !== undefined ? active : true,
      order: order || 0,
      updatedAt: new Date(),
    };

    // مدیریت parentId
    if (parentId) {
      if (ObjectId.isValid(parentId)) {
        updateData.parentId = new ObjectId(parentId);
      }
    } else {
      updateData.parentId = null;
    }

    // بروزرسانی دسته‌بندی
    const result = await db.categories.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      );
    }

    // پاک کردن کش Redis بعد از بروزرسانی
    await Promise.all([
      CacheManager.invalidatePattern(`${CACHE_KEYS.CATEGORIES}*`),
      CacheManager.invalidatePattern(`${CACHE_KEYS.PRODUCTS}*`),
      CacheManager.invalidatePattern(`${CACHE_KEYS.HOMEPAGE_SECTIONS}*`)
    ]);
    console.log('✅ Redis cache invalidated after category update');

    // دریافت دسته‌بندی بروزرسانی شده
    const updatedCategory = await db.categories.findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'دسته‌بندی با موفقیت بروزرسانی شد',
    });
  } catch (error) {
    console.error('خطا در بروزرسانی دسته‌بندی:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    );
  }
}

// DELETE: حذف دسته‌بندی
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه نامعتبر است' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // بررسی اینکه آیا این دسته‌بندی والد دسته‌بندی‌های دیگری است
    const childCategories = await db.categories.countDocuments(
      categoryRefFilter('parentId', id)
    );

    if (childCategories > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'این دسته‌بندی دارای زیرمجموعه است. ابتدا زیرمجموعه‌ها را حذف کنید',
        },
        { status: 400 }
      );
    }

    // بررسی اینکه آیا محصولی به این دسته‌بندی تخصیص داده شده
    const productsCount = await db.products.countDocuments(
      categoryRefFilter('categoryId', id)
    );

    if (productsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `این دسته‌بندی دارای ${productsCount} محصول است. ابتدا محصولات را به دسته‌بندی دیگری منتقل کنید`,
        },
        { status: 400 }
      );
    }

    // حذف دسته‌بندی
    const result = await db.categories.deleteOne(categoryIdFilter(id));

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      );
    }

    // پاک کردن کش Redis بعد از حذف - بسیار مهم!
    console.log('🗑️ Category deleted, clearing Redis cache...');
    await Promise.all([
      CacheManager.invalidatePattern(`${CACHE_KEYS.CATEGORIES}*`),
      CacheManager.invalidatePattern(`${CACHE_KEYS.PRODUCTS}*`),
      CacheManager.invalidatePattern(`${CACHE_KEYS.HOMEPAGE_SECTIONS}*`),
      CacheManager.invalidatePattern(`${CACHE_KEYS.SITE_HEADER}*`)
    ]);
    console.log('✅ Redis cache cleared successfully after category deletion');

    return NextResponse.json({
      success: true,
      message: 'دسته‌بندی با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('خطا در حذف دسته‌بندی:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور' },
      { status: 500 }
    );
  }
}
