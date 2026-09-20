import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { CacheManager, CACHE_KEYS } from '@/lib/cache-manager';

// Validation schemas
const createBrandSchema = z.object({
  name: z.string().min(2, 'نام برند باید حداقل 2 کاراکتر باشد'),
  slug: z.string().min(2, 'شناسه یکتا باید حداقل 2 کاراکتر باشد'),
  description: z.string().optional(),
  logo: z.string().min(1, 'لوگو برند الزامی است'),
  color: z.string().optional(),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
});

const updateBrandSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  color: z.string().optional(),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
});

// GET /api/brands - Get all brands
export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');

    // Generate cache key
    const cacheKey = `${CACHE_KEYS.CATEGORIES}brands:${page}:${limit}:${search}:${active}`;
    
    // Try cache first
    const cached = await CacheManager.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const skip = (page - 1) * limit;

    // Build filter
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

    // Get brands with product count
    const brands = await db.brands.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'brandId',
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
          sequentialId: 1,
          name: 1,
          slug: 1,
          description: 1,
          logo: 1,
          imageUrl: '$logo',
          color: 1,
          active: 1,
          order: 1,
          createdAt: 1,
          updatedAt: 1,
          productCount: 1
        }
      },
      { $sort: { order: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray();

    const total = await db.brands.countDocuments(filter);

    const responseData = {
      success: true,
      data: brands.map(brand => ({
        ...brand,
        _id: brand._id.toString(),
        id: brand._id.toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Cache for 30 minutes
    await CacheManager.set(cacheKey, responseData, 30 * 60);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Brands GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت برندها' },
      { status: 500 }
    );
  }
}

// POST /api/brands - Create new brand
export async function POST(request: NextRequest) {
  try {
    const db = await connectDB();
    const body = await request.json();
    
    const validatedData = createBrandSchema.parse(body);

    // Check if slug already exists
    const existingBrand = await db.brands.findOne({
      slug: validatedData.slug
    });

    if (existingBrand) {
      return NextResponse.json(
        { success: false, error: 'این شناسه یکتا قبلاً استفاده شده است' },
        { status: 400 }
      );
    }

    // Get next sequential ID
    const lastBrand = await db.brands.findOne({}, { sort: { sequentialId: -1 } });
    const sequentialId = (lastBrand?.sequentialId || 0) + 1;

    const brandData = {
      ...validatedData,
      sequentialId,
      imageUrl: validatedData.logo,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.brands.insertOne(brandData);
    
    const brand = await db.brands.findOne({ _id: result.insertedId });

    // Invalidate caches
    await CacheManager.invalidatePattern(`${CACHE_KEYS.CATEGORIES}brands:*`);

    return NextResponse.json({
      success: true,
      data: {
        ...brand,
        _id: brand!._id.toString(),
        id: brand!._id.toString(),
      },
      message: 'برند با موفقیت ایجاد شد',
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

    console.error('Brands POST error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد برند' },
      { status: 500 }
    );
  }
}
