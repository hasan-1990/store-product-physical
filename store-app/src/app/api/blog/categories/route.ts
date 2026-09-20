import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { CacheManager, CACHE_TTL } from '@/lib/cache-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const id = searchParams.get('id');

    // Create cache key
    const cacheKey = `blog:categories:${id || (active ? `active_${active}` : 'all')}`;
    
    // Try to get from cache first
    const cachedData = await CacheManager.get(cacheKey);
    if (cachedData) {
      console.log(`✅ Cache HIT for blog categories: ${cacheKey}`);
      return NextResponse.json(cachedData);
    }

    console.log(`❌ Cache MISS for blog categories: ${cacheKey}`);
    const mongodb = await connectDB();

    // If id is provided, return single category
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { success: false, error: 'شناسه دسته‌بندی معتبر نیست' },
          { status: 400 }
        );
      }

      const category = await mongodb.blogCategories.findOne({ _id: new ObjectId(id) });
      
      if (!category) {
        return NextResponse.json(
          { success: false, error: 'دسته‌بندی یافت نشد' },
          { status: 404 }
        );
      }

      // Cache single category
      await CacheManager.set(cacheKey, category, CACHE_TTL.CATEGORIES);
      
      return NextResponse.json(category);
    }

    // Build filter
    const filter: any = {};
    if (active !== null) {
      filter.active = active === 'true';
    }

    const categories = await mongodb.blogCategories
      .find(filter)
      .sort({ name: 1 })
      .toArray();

    const result = { success: true, data: categories };
    
    // Cache categories list (30 minutes)
    await CacheManager.set(cacheKey, result, CACHE_TTL.CATEGORIES);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت دسته‌بندی‌های بلاگ' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const mongodb = await connectDB();

    // Generate slug from name if not provided
    if (!data.slug) {
      data.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    // Ensure slug is unique
    let uniqueSlug = data.slug;
    let counter = 1;
    while (await mongodb.blogCategories.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${data.slug}-${counter}`;
      counter++;
    }
    data.slug = uniqueSlug;

    // Set timestamps
    data.createdAt = new Date().toISOString();
    data.updatedAt = new Date().toISOString();

    const result = await mongodb.blogCategories.insertOne(data);

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...data }
    });

  } catch (error) {
    console.error('Error creating blog category:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد دسته‌بندی بلاگ' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه دسته‌بندی معتبر نیست' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();

    // Generate slug from name if not provided
    if (!updateData.slug && updateData.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    // Set timestamps
    updateData.updatedAt = new Date().toISOString();

    const result = await mongodb.blogCategories.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { _id: id, ...updateData }
    });

  } catch (error) {
    console.error('Error updating blog category:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی دسته‌بندی بلاگ' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه دسته‌بندی معتبر نیست' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();

    const result = await mongodb.blogCategories.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'دسته‌بندی با موفقیت حذف شد'
    });

  } catch (error) {
    console.error('Error deleting blog category:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف دسته‌بندی بلاگ' },
      { status: 500 }
    );
  }
}