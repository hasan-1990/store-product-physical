import { NextRequest, NextResponse } from 'next/server';
import { mongodb, connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/cache-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8');
    const sortBy = searchParams.get('sortBy') || 'order';
    const selectedIds = searchParams.get('selectedIds');

    // Create cache key from query parameters
    const cacheKey = `${CACHE_KEYS.CATEGORIES}homepage:${limit}:${sortBy}:${selectedIds || 'all'}`;
    
    // Try to get from cache first
    const cachedCategories = await CacheManager.get(cacheKey);
    if (cachedCategories) {
      return NextResponse.json(cachedCategories);
    }

    const db = await connectDB();

    let filter: any = { active: true };
    let sort: any = { order: 1 };

    // Handle specific category selection
    if (selectedIds) {
      const idsArray = selectedIds.split(',').map(id => id.trim()).filter(id => id);
      if (idsArray.length > 0) {
        filter._id = { $in: idsArray.map(id => new ObjectId(id)) };
      }
    }

    // Handle different sort options
    switch (sortBy) {
      case 'name':
        sort = { name: 1 };
        break;
      case 'product_count':
        // We'll sort by product count after aggregation
        sort = { order: 1 };
        break;
      case 'random':
        // For random, we'll use $sample in aggregation
        sort = { order: 1 };
        break;
      default:
        sort = { order: 1 };
    }

    let pipeline: any[] = [
      { $match: filter },
      {
        $lookup: {
          from: 'products',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$categoryId', '$$categoryId'] },
                    { $eq: ['$active', true] }
                  ]
                }
              }
            }
          ],
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
          order: 1,
          productCount: 1
        }
      }
    ];

    // Handle random sorting
    if (sortBy === 'random') {
      pipeline.push({ $sample: { size: limit } });
    } else {
      // Handle product count sorting
      if (sortBy === 'product_count') {
        pipeline.push({ $sort: { productCount: -1 } });
      } else {
        pipeline.push({ $sort: sort });
      }
      pipeline.push({ $limit: limit });
    }

    const categories = await db.categories.aggregate(pipeline).toArray();

    // Transform categories data
    const transformedCategories = categories.map(category => ({
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.imageUrl || '/images/products/placeholder.svg',
      imageAlt: category.name,
      href: `/products/${category.slug}`,
      order: category.order,
      active: true,
      productCount: category.productCount
    }));

    const response = {
      success: true,
      categories: transformedCategories
    };

    // Cache for 30 minutes
    await CacheManager.set(cacheKey, response, CACHE_TTL.CATEGORIES);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching homepage categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
