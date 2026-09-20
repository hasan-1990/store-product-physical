import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8');
    
    const db = await connectDB();
    
    // For now, we'll get random products and sort by views/sales
    // You can modify this logic based on your trending algorithm
    const products = await db.products.aggregate([
      { $match: { active: true } },
      {
        $addFields: {
          trendScore: {
            $add: [
              { $multiply: [{ $ifNull: ["$viewCount", 0] }, 0.3] },
              { $multiply: [{ $ifNull: ["$salesCount", 0] }, 0.7] }
            ]
          }
        }
      },
      { $sort: { trendScore: -1, createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      {
        $addFields: {
          categoryInfo: { $arrayElemAt: ['$categoryData', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          sequentialId: 1,
          name: 1,
          slug: 1,
          price: 1,
          originalPrice: 1,
          discountPrice: 1,
          imageUrl: 1,
          image: 1,
          categoryPath: 1,
          rating: { $ifNull: ["$rating", 4.5] },
          viewCount: { $ifNull: ["$viewCount", 0] },
          salesCount: { $ifNull: ["$salesCount", 0] },
          'categoryInfo._id': 1,
          'categoryInfo.name': 1,
          'categoryInfo.slug': 1
        }
      }
    ]).toArray();

    // Transform MongoDB _id to id
    const transformedProducts = products.map(product => ({
      id: product.sequentialId || product._id.toString(),
      _id: product._id.toString(),
      sequentialId: product.sequentialId,
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.originalPrice,
      discountPrice: product.discountPrice,
      imageUrl: product.imageUrl || product.image,
      image: product.imageUrl || product.image,
      categoryPath: product.categoryPath || [],
      category: product.categoryInfo ? {
        id: product.categoryInfo._id?.toString(),
        _id: product.categoryInfo._id?.toString(),
        name: product.categoryInfo.name,
        slug: product.categoryInfo.slug
      } : { name: 'بدون دسته', slug: '' },
      rating: product.rating,
      viewCount: product.viewCount,
      salesCount: product.salesCount
    }));

    return NextResponse.json({
      success: true,
      data: transformedProducts,
      total: transformedProducts.length
    });
  } catch (error) {
    console.error('Error fetching trending products:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت محصولات ترند' },
      { status: 500 }
    );
  }
}
