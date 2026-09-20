import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/cache-manager';

export async function GET(request: Request) {
  try {
    // Check if we should bypass cache
    const { searchParams } = new URL(request.url);
    const bypassCache = searchParams.get('bypass') === 'true';
    
    if (bypassCache) {
      console.log('🔄 Cache bypass requested - fetching fresh data from database');
      // Invalidate cache for next requests
      await CacheManager.invalidateCategories();
    } else {
      // Try to get from cache first
      const cachedCategories = await CacheManager.getCategories();
      if (cachedCategories) {
        console.log('⚡ Categories served from cache');
        return NextResponse.json({
          success: true,
          data: cachedCategories,
          source: 'cache'
        });
      }
    }
    // Cache miss - fetch from database
    console.log('🔄 Fetching categories from database');
    const db = await connectDB();
    
    // Get categories with product count
    const categories = await db.categories.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products',
          pipeline: [
            { $match: { active: true } }
          ]
        }
      },
      {
        $addFields: {
          productCount: { $size: '$products' }
        }
      },
      {
        $sort: { order: 1 }
      },
      {
        $project: {
          name: 1,
          slug: 1,
          active: 1,
          order: 1,
          productCount: 1,
          parentId: 1
        }
      }
    ]).toArray();

    const transformedCategories = categories.map(cat => ({
      id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      active: cat.active,
      order: cat.order,
      productCount: cat.productCount,
      parentId: cat.parentId ? cat.parentId.toString() : null
    }));

    // Store in cache for next time
    await CacheManager.setCategories(transformedCategories);

    return NextResponse.json({
      success: true,
      data: transformedCategories,
      source: 'database'
    });

  } catch (error) {
    console.error('Error fetching admin categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
