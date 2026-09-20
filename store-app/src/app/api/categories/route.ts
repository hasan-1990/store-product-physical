import { NextRequest, NextResponse } from 'next/server';
import { mongodb, connectDB } from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { CacheManager, CACHE_KEYS } from '@/lib/cache-manager';
import { findCategoryById, toObjectId } from '@/lib/category-db-helpers';

// Force dynamic rendering - disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(2, 'نام دسته‌بندی باید حداقل 2 کاراکتر باشد'),
  slug: z.string().min(2, 'شناسه یکتا باید حداقل 2 کاراکتر باشد'),
  description: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  imageAlt: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  level: z.number().int().min(0).max(10).default(0), // افزایش به 10 سطح
  active: z.boolean().default(true),
  order: z.number().int().default(0),
});

const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  imageAlt: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  level: z.number().int().min(0).max(10).optional(), // افزایش به 10 سطح
  active: z.boolean().optional(),
  order: z.number().int().optional(),
});

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');
    const level = searchParams.get('level');
    const parentId = searchParams.get('parentId');

    // Generate cache key based on query parameters
    const cacheKey = `${CACHE_KEYS.CATEGORIES}list:${page}:${limit}:${search}:${active}:${level}:${parentId}`;
    
    // Try to get from cache first
    const cached = await CacheManager.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const skip = (page - 1) * limit;

    // Build MongoDB filter
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (active !== null) {
      filter.active = active === 'true';
    }

    if (level !== null && level !== undefined) {
      filter.level = parseInt(level);
    }

    if (parentId) {
      if (ObjectId.isValid(parentId)) {
        filter.parentId = new ObjectId(parentId);
      }
    }

    // Get categories with product count
    const categories = await db.categories.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products'
        }
      },
      {
        $addFields: {
          productCount: { $size: '$products' }
        }
      },
      {
        $addFields: {
          id: { $ifNull: ["$sequentialId", "$_id"] }
        }
      },
      {
        $project: {
          id: 1,
          _id: 1,
          sequentialId: 1,
          name: 1,
          slug: 1,
          description: 1,
          imageUrl: 1,
          imageAlt: 1,
          parentId: 1,
          level: 1,
          active: 1,
          order: 1,
          createdAt: 1,
          updatedAt: 1,
          productCount: 1
        }
      },
      { $sort: { level: 1, order: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray();

    const total = await db.categories.countDocuments(filter);

    // Transform to match frontend interface
    const transformedCategories = categories.map(cat => {
      const { _id, ...rest } = cat;
      return {
        id: cat.sequentialId || _id.toString(),
        _id: _id.toString(),
        ...rest,
        parentId: rest.parentId ? rest.parentId.toString() : null
      };
    });

    const responseData = {
      success: true,
      data: transformedCategories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Cache the result with 30 minute TTL
    await CacheManager.set(cacheKey, responseData, 30 * 60);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت دسته‌بندی‌ها' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const db = await connectDB();
    const body = await request.json();
    
    console.log('Received body:', body);
    
    let parentObjectId: ObjectId | null = null;

    // Validate parent category if provided
    if (body.parentId) {
      if (!ObjectId.isValid(body.parentId)) {
        return NextResponse.json(
          { success: false, error: 'شناسه دسته والد نامعتبر است' },
          { status: 400 }
        );
      }

      const parentCategory = await findCategoryById(db, body.parentId);

      if (!parentCategory) {
        return NextResponse.json(
          { success: false, error: 'دسته والد یافت نشد' },
          { status: 400 }
        );
      }

      // Check level constraint
      if (parentCategory.level >= 2) {
        return NextResponse.json(
          { success: false, error: 'حداکثر سطح دسته‌بندی 3 است' },
          { status: 400 }
        );
      }

      parentObjectId = toObjectId(parentCategory._id);
      body.level = parentCategory.level + 1;
    } else {
      body.level = 0;
      body.parentId = null;
    }

    const validatedData = createCategorySchema.parse(body);
    console.log('Validated data:', validatedData);

    // Check if slug already exists
    const existingCategory = await db.categories.findOne({
      slug: validatedData.slug
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'این شناسه یکتا قبلاً استفاده شده است' },
        { status: 400 }
      );
    }

    // Get next sequential ID - create a simple incremental ID
    const lastCategory = await db.categories.findOne({}, { sort: { sequentialId: -1 } });
    const sequentialId = (lastCategory?.sequentialId || 0) + 1;

    const categoryData = {
      ...validatedData,
      sequentialId: sequentialId,
      parentId: parentObjectId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await db.categories.insertOne(categoryData);
    
    // Get the created category with product count
    const category = await db.categories.aggregate([
      { $match: { _id: insertResult.insertedId } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products'
        }
      },
      {
        $addFields: {
          productCount: { $size: '$products' }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          description: 1,
          imageUrl: 1,
          imageAlt: 1,
          parentId: 1,
          level: 1,
          active: 1,
          order: 1,
          createdAt: 1,
          updatedAt: 1,
          productCount: 1
        }
      }
    ]).toArray();

    const transformedCategory = {
      ...category[0],
      id: category[0].sequentialId || category[0]._id.toString(),
      _id: category[0]._id.toString(),
      parentId: category[0].parentId ? category[0].parentId.toString() : null
    };

    // Invalidate related caches after creating a category
    await Promise.all([
      CacheManager.invalidatePattern(`${CACHE_KEYS.CATEGORIES}*`),
      CacheManager.invalidatePattern(`${CACHE_KEYS.PRODUCTS}*`)
    ]);

    return NextResponse.json({
      success: true,
      data: transformedCategory,
      message: 'دسته‌بندی با موفقیت ایجاد شد',
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

    console.error('Categories POST error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد دسته‌بندی' },
      { status: 500 }
    );
  }
}
