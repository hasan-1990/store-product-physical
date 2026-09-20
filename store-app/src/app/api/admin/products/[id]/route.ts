import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/admin/products/[id] - دریافت یک محصول خاص
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔄 Admin Single Product API: Starting for ID:', id);
    const db = await connectDB();
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول نامعتبر است' },
        { status: 400 }
      );
    }

    const pipeline = [
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
          views: 1,
          createdAt: 1,
          updatedAt: 1,
          'category._id': 1,
          'category.name': 1,
          'category.slug': 1,
        }
      }
    ];

    const products = await db.products.aggregate(pipeline).toArray();
    
    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }

    const product = products[0];
    
    // تبدیل فرمت برای سازگاری با فرانت‌اند
    const formattedProduct = {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
      image: product.imageUrl,
      gallery: product.gallery,
      categoryId: product.categoryId?.toString(),
      category: product.category?.name || 'بدون دسته',
      active: product.active,
      featured: product.featured,
      rating: product.rating,
      ratingCount: product.ratingCount,
      views: product.views || 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    console.log('✅ Admin Single Product API: Product found');

    return NextResponse.json({
      success: true,
      product: formattedProduct
    });

  } catch (error) {
    console.error('❌ Admin Single Product API error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت محصول' },
      { status: 500 }
    );
  }
}
