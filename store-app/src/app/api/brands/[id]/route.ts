import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { CacheManager, CACHE_KEYS } from '@/lib/cache-manager';

const updateBrandSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  color: z.string().optional(),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
});

// GET /api/brands/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه برند نامعتبر است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    
    const brand = await db.brands.aggregate([
      { $match: { _id: new ObjectId(id) } },
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
          products: 0
        }
      }
    ]).toArray();

    if (!brand.length) {
      return NextResponse.json(
        { success: false, error: 'برند یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...brand[0],
        _id: brand[0]._id.toString(),
        id: brand[0]._id.toString(),
        imageUrl: brand[0].logo,
      }
    });
  } catch (error) {
    console.error('Brand GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت برند' },
      { status: 500 }
    );
  }
}

// PUT /api/brands/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه برند نامعتبر است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const body = await request.json();
    
    const validatedData = updateBrandSchema.parse(body);

    // Check if slug is being changed and if it already exists
    if (validatedData.slug) {
      const existingBrand = await db.brands.findOne({
        slug: validatedData.slug,
        _id: { $ne: new ObjectId(id) }
      });

      if (existingBrand) {
        return NextResponse.json(
          { success: false, error: 'این شناسه یکتا قبلاً استفاده شده است' },
          { status: 400 }
        );
      }
    }

    const updateData = {
      ...validatedData,
      ...(validatedData.logo && { imageUrl: validatedData.logo }),
      updatedAt: new Date()
    };

    const result = await db.brands.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'برند یافت نشد' },
        { status: 404 }
      );
    }

    const updatedBrand = await db.brands.findOne({ _id: new ObjectId(id) });

    // Invalidate caches
    await Promise.all([
      CacheManager.invalidatePattern(`${CACHE_KEYS.CATEGORIES}brands:*`),
      CacheManager.invalidatePattern(`${CACHE_KEYS.PRODUCTS}*`)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...updatedBrand,
        _id: updatedBrand!._id.toString(),
        id: updatedBrand!._id.toString(),
      },
      message: 'برند با موفقیت بروزرسانی شد'
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

    console.error('Brand PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی برند' },
      { status: 500 }
    );
  }
}

// DELETE /api/brands/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه برند نامعتبر است' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Check if brand has products
    const productCount = await db.products.countDocuments({
      brandId: new ObjectId(id)
    });

    if (productCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `این برند دارای ${productCount} محصول است و نمی‌توان آن را حذف کرد` 
        },
        { status: 400 }
      );
    }

    const result = await db.brands.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'برند یافت نشد' },
        { status: 404 }
      );
    }

    // Invalidate caches
    await CacheManager.invalidatePattern(`${CACHE_KEYS.CATEGORIES}brands:*`);

    return NextResponse.json({
      success: true,
      message: 'برند با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Brand DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف برند' },
      { status: 500 }
    );
  }
}
