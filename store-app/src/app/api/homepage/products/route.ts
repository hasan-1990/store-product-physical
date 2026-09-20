import { NextRequest, NextResponse } from 'next/server';
import { mongodb, connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'featured';
    const limit = parseInt(searchParams.get('limit') || '8');
    const sortBy = searchParams.get('sortBy') || null;

    let pipeline: any[] = [
      { $match: { active: true } },
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
      }
    ];

    switch (type) {
      case 'featured':
        pipeline[0].$match.featured = true;
        
        // Handle different sort options
        if (sortBy === 'newest') {
          pipeline.push({ $sort: { createdAt: -1 } });
        } else if (sortBy === 'rating') {
          pipeline.push({ $sort: { rating: -1, ratingCount: -1 } });
        } else if (sortBy === 'random') {
          pipeline.push({ $sample: { size: limit } });
          break;
        } else {
          pipeline.push({ $sort: { createdAt: -1 } });
        }
        
        pipeline.push({ $limit: limit });
        break;

      case 'latest':
        pipeline.push({ $sort: { createdAt: -1 } });
        pipeline.push({ $limit: limit });
        break;

      case 'trending':
        pipeline.push({
          $sort: {
            rating: -1,
            ratingCount: -1,
            createdAt: -1
          }
        });
        pipeline.push({ $limit: limit });
        break;

      default:
        pipeline.push({ $sort: { createdAt: -1 } });
        pipeline.push({ $limit: limit });
    }

    const products = await db.products.aggregate(pipeline).toArray();

    // Transform products data
    const transformedProducts = products.map(product => ({
      id: product.sequentialId || product._id.toString(),
      _id: product._id.toString(),
      sequentialId: product.sequentialId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: parseFloat(product.price.toString()),
      originalPrice: product.originalPrice ? parseFloat(product.originalPrice.toString()) : null,
      image: product.imageUrl,
      imageUrl: product.imageUrl,
      gallery: product.gallery || [],
      categoryPath: product.categoryPath || [],
      rating: product.rating || 0,
      reviewsCount: product.ratingCount || 0,
      stock: product.stock,
      featured: product.featured,
      category: product.category ? {
        id: product.category._id?.toString(),
        _id: product.category._id?.toString(),
        name: product.category.name,
        slug: product.category.slug
      } : { name: 'بدون دسته', slug: '' }
    }));

    return NextResponse.json({
      success: true,
      products: transformedProducts
    });

  } catch (error) {
    console.error('Error fetching homepage products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
