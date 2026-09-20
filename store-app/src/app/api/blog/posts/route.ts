import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { CacheManager, CACHE_TTL } from '@/lib/cache-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '6');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const status = searchParams.get('status') || 'published';
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    // Create cache key based on query params
    const cacheKey = `blog:posts:${id || slug || `p${page}_l${limit}_c${category || 'all'}_t${tag || 'none'}_s${search || 'none'}_f${featured || 'false'}_st${status}`}`;
    
    // Try to get from cache first
    const cachedData = await CacheManager.get(cacheKey);
    if (cachedData) {
      console.log(`✅ Cache HIT for blog posts: ${cacheKey}`);
      return NextResponse.json(cachedData);
    }

    console.log(`❌ Cache MISS for blog posts: ${cacheKey}`);
    const mongodb = await connectDB();

    // If id is provided, return single post
    if (id) {
      // Try both string and ObjectId formats for _id
      let matchId: any = id;
      if (ObjectId.isValid(id)) {
        // If valid ObjectId format, try both ObjectId and string
        matchId = { $in: [id, new ObjectId(id)] };
      }

      const pipeline = [
        { $match: { _id: matchId } },
        {
          $lookup: {
            from: 'blogCategories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $lookup: {
            from: 'blogTags',
            localField: 'tags',
            foreignField: '_id',
            as: 'tags'
          }
        },
        {
          $addFields: {
            category: { $arrayElemAt: ['$category', 0] }
          }
        }
      ];

      const posts = await mongodb.blogPosts.aggregate(pipeline).toArray();
      
      if (posts.length === 0) {
        return NextResponse.json(
          { success: false, error: 'پست یافت نشد' },
          { status: 404 }
        );
      }

      // Cache single post
      await CacheManager.set(cacheKey, posts[0], CACHE_TTL.HOMEPAGE);
      
      // Return the post data directly (frontend expects the post object, not wrapped)
      return NextResponse.json(posts[0], { status: 200 });
    }

    // If slug is provided, return single post (support status=all and legacy docs without status)
    if (slug) {
      // Build flexible slug match: try exact, normalized (collapse dashes), lowercase
      const normalized = slug
        .toLowerCase()
        .replace(/--+/g, '-')
        .replace(/\s+/g, '-')
        .trim();
      const slugVariants = Array.from(new Set([
        slug,
        normalized,
        normalized.replace(/^-+|-+$/g, ''),
      ])).filter(Boolean);

      // Use $in for variants OR a case-insensitive regex fallback
      const match: any = {
        $or: [
          { slug: { $in: slugVariants } },
          { slug: { $regex: `^${normalized.replace(/[-/\\^$*+?.()|[\]{}]/g, '.')}$`, $options: 'i' } }
        ]
      };
      if (status !== 'all') {
        // For explicit status filter, still allow legacy docs without status when requesting 'published'
        if (status === 'published') {
          match.$and = [
            {
              $or: [
                { status: 'published' },
                { status: { $exists: false } }
              ]
            }
          ];
        } else {
          match.$and = [{ status }]; // draft / scheduled
        }
      } // status=all -> do not add any status restriction

      const pipeline = [
        { $match: match },
        {
          $lookup: {
            from: 'blogCategories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $lookup: {
            from: 'blogTags',
            localField: 'tags',
            foreignField: '_id',
            as: 'tags'
          }
        },
        {
          $addFields: {
            category: { $arrayElemAt: ['$category', 0] },
            // Provide a consistent sortDate for possible reuse
            sortDate: { $ifNull: ['$publishedAt', '$createdAt'] }
          }
        }
      ];

      const posts = await mongodb.blogPosts.aggregate(pipeline).toArray();
      const result = { success: true, data: posts };
      
      // Cache posts by slug
      await CacheManager.set(cacheKey, result, CACHE_TTL.HOMEPAGE);
      
      return NextResponse.json(result);
    }

    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    // status=all means do NOT restrict
    if (status !== 'all') {
      filter.status = status;
    }

    console.log('Blog posts API filter:', filter);
    console.log('Requested status:', status);

    if (category) {
      if (ObjectId.isValid(category)) {
        filter.categoryId = new ObjectId(category);
      } else {
        // Search by category slug
        const categoryDoc = await mongodb.blogCategories.findOne({ slug: category });
        if (categoryDoc) {
          filter.categoryId = categoryDoc._id;
        }
      }
    }

    if (tag) {
      filter.tags = { $in: [tag] };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    // Get posts with category info
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'blogCategories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $addFields: {
          category: { $arrayElemAt: ['$categoryInfo', 0] },
          sortDate: { $ifNull: ['$publishedAt', '$createdAt'] }
        }
      },
      { $unset: 'categoryInfo' },
      { $sort: { sortDate: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const posts = await mongodb.blogPosts.aggregate(pipeline).toArray();

    // Get total count for pagination
    const totalPosts = await mongodb.blogPosts.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);

    const result = {
      success: true,
      data: {
        posts,
        total: totalPosts,
        totalPages,
        currentPage: page,
        limit,
        pagination: {
          totalPosts,
          totalPages,
          currentPage: page,
          limit
        }
      }
    };

    // Cache the result (15 minutes for blog posts)
    await CacheManager.set(cacheKey, result, CACHE_TTL.PRODUCTS);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت پست‌های بلاگ' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const mongodb = await connectDB();

    // Generate slug from title if not provided
    if (!data.slug) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    // Normalize image fields (featuredImage -> image)
    if (!data.image && data.featuredImage) {
      data.image = data.featuredImage;
    }

    // Ensure slug is unique
    let uniqueSlug = data.slug;
    let counter = 1;
    while (await mongodb.blogPosts.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${data.slug}-${counter}`;
      counter++;
    }
    data.slug = uniqueSlug;

    // Convert category and tags if needed
    if (data.category && typeof data.category === 'string' && ObjectId.isValid(data.category)) {
      data.categoryId = new ObjectId(data.category);
      delete data.category; // Remove the old field
    }

    // Set timestamps
    data.createdAt = new Date().toISOString();
    data.updatedAt = new Date().toISOString();

    if (data.status === 'published' && !data.publishedAt) {
      data.publishedAt = new Date().toISOString();
    }

    const result = await mongodb.blogPosts.insertOne(data);

    // Invalidate blog posts cache
    await CacheManager.invalidatePattern('blog:posts:*');
    console.log('✅ Blog posts cache invalidated after create');

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...data }
    });

  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد پست بلاگ' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'شناسه پست الزامی است' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();

    // Never allow immutable _id to be updated (can arrive from client state)
    if ((updateData as any)._id) {
      delete (updateData as any)._id;
    }

    // Generate slug from title if not provided
    if (!updateData.slug && updateData.title) {
      updateData.slug = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    // Normalize image fields in update
    if (!updateData.image && (updateData as any).featuredImage) {
      (updateData as any).image = (updateData as any).featuredImage;
    }

    // Normalize category: accept id string or populated object
    if (updateData.category) {
      // If category is an object (populated), extract its _id
      if (typeof updateData.category === 'object' && (updateData.category as any)._id && ObjectId.isValid((updateData.category as any)._id)) {
        updateData.categoryId = new ObjectId((updateData.category as any)._id);
        delete updateData.category;
      } else if (typeof updateData.category === 'string' && ObjectId.isValid(updateData.category)) {
        updateData.categoryId = new ObjectId(updateData.category);
        delete updateData.category;
      }
    }

    // Normalize tags: accept array of ids or populated tag objects
    if (updateData.tags && Array.isArray(updateData.tags)) {
      updateData.tags = updateData.tags.map((tag: any) => {
        if (typeof tag === 'object' && tag?._id && ObjectId.isValid(tag._id)) {
          return new ObjectId(tag._id);
        }
        return ObjectId.isValid(tag) ? new ObjectId(tag) : tag;
      });
    }

    // Set timestamps
    updateData.updatedAt = new Date().toISOString();

    if (updateData.status === 'published' && !updateData.publishedAt) {
      updateData.publishedAt = new Date().toISOString();
    }

    // Try both string and ObjectId formats for _id (blogPosts use string IDs)
    let matchId: any = id;
    if (ObjectId.isValid(id)) {
      matchId = { $in: [id, new ObjectId(id)] };
    }

    const result = await mongodb.blogPosts.updateOne(
      { _id: matchId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'پست یافت نشد' },
        { status: 404 }
      );
    }

    // Invalidate blog posts cache
    await CacheManager.invalidatePattern('blog:posts:*');
    console.log('✅ Blog posts cache invalidated after update');

    return NextResponse.json({
      success: true,
      data: { _id: id, ...updateData }
    });

  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی پست بلاگ' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'شناسه پست الزامی است' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();

    // Try both string and ObjectId formats for _id (blogPosts use string IDs)
    let matchId: any = id;
    if (ObjectId.isValid(id)) {
      matchId = { $in: [id, new ObjectId(id)] };
    }

    const result = await mongodb.blogPosts.deleteOne({ _id: matchId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'پست یافت نشد' },
        { status: 404 }
      );
    }

    // Invalidate blog posts cache
    await CacheManager.invalidatePattern('blog:posts:*');
    console.log('✅ Blog posts cache invalidated after delete');

    return NextResponse.json({
      success: true,
      message: 'پست با موفقیت حذف شد'
    });

  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف پست بلاگ' },
      { status: 500 }
    );
  }
}