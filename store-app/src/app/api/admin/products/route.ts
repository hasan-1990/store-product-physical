import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/admin/products - دریافت تمام محصولات برای پنل ادمین
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Admin Products API: Starting...');
    const db = await connectDB();
    console.log('✅ Admin Products API: MongoDB connected');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50'); // تعداد بیشتر برای ادمین
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const active = searchParams.get('active');
    const featured = searchParams.get('featured');

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

    console.log('🔍 Admin Products API: Filter:', filter);

    // Get products with category info
    const pipeline = [
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
          category: { $arrayElemAt: ['$category', 0] }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          sequentialId: 1,
          slug: 1,
          name: 1,
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
          rating: 1,
          ratingCount: 1,
          views: 1,
          productType: 1,
          isDigital: 1,
          downloadUrl: 1,
          fileSize: 1,
          fileFormat: 1,
          createdAt: 1,
          updatedAt: 1,
          'category._id': 1,
          'category.name': 1,
          'category.slug': 1,
        }
      }
    ];

    console.log('🔄 Admin Products API: Running aggregation...');
    const products = await db.products.aggregate(pipeline).toArray();

    // تبدیل فرمت برای سازگاری با فرانت‌اند
    const formattedProducts = products.map(product => ({
      _id: product._id.toString(),
      id: product.sequentialId ?? product._id.toString(),
      sequentialId: product.sequentialId,
      slug: product.slug,
      categoryPath: product.categoryPath || [],
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
      imageUrl: product.imageUrl,
      image: product.imageUrl,
      gallery: product.gallery,
      categoryId: product.categoryId?.toString(),
      category: product.category?.name || 'بدون دسته',
      active: product.active,
      featured: product.featured,
      rating: product.rating,
      ratingCount: product.ratingCount,
      views: product.views || 0,
      productType: product.productType,
      isDigital: product.isDigital,
      downloadUrl: product.downloadUrl,
      fileSize: product.fileSize,
      fileFormat: product.fileFormat,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    const total = await db.products.countDocuments(filter);

    console.log(`✅ Admin Products API: Found ${formattedProducts.length} products`);

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });

  } catch (error) {
    console.error('❌ Admin Products API error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت محصولات', details: error instanceof Error ? error.message : 'نامشخص' },
      { status: 500 }
    );
  }
}
