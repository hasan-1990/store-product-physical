import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/cache-manager';

// Validation schemas
const createReviewSchema = z.object({
  userId: z.string().optional(), // اختیاری برای مهمان‌ها
  productId: z.string().min(1, 'شناسه محصول الزامی است'),
  productSlug: z.string().optional(),
  userName: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد'),
  userEmail: z.string().email('ایمیل نامعتبر است').optional(),
  rating: z.number().int().min(1, 'امتیاز حداقل 1 است').max(5, 'امتیاز حداکثر 5 است'),
  title: z.string().optional(),
  comment: z.string().min(10, 'نظر باید حداقل 10 کاراکتر باشد'),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  comment: z.string().min(10).optional(),
  approved: z.boolean().optional(),
});

// GET /api/reviews - Get all reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const productId = searchParams.get('productId') || '';
    const productSlug = searchParams.get('productSlug') || '';
    const userId = searchParams.get('userId') || '';
    const approved = searchParams.get('approved');
    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, helpful, rating
    
    // Create cache key from query parameters
    const cacheKey = `reviews:list:${page}:${limit}:${productId}:${productSlug}:${userId}:${approved}:${sortBy}`;
    
    // Try to get from cache first
    const cachedReviews = await CacheManager.get(cacheKey);
    if (cachedReviews) {
      return NextResponse.json(cachedReviews);
    }

    const skip = (page - 1) * limit;

    const mongodb = await connectDB();
    
    // فیلتر
    const filter: any = {};
    if (productId) filter.productId = productId;
    if (productSlug) filter.productSlug = productSlug;
    if (userId) filter.userId = userId;
    if (approved !== null) {
      const isApproved = approved === 'true';
      filter.$or = [{ isApproved }, { approved: isApproved }];
    }

    // مرتب‌سازی
    let sortStage: any = { createdAt: -1 };
    if (sortBy === 'helpful') {
      sortStage = { helpfulCount: -1, createdAt: -1 };
    } else if (sortBy === 'rating') {
      sortStage = { rating: -1, createdAt: -1 };
    }

    const [reviews, total] = await Promise.all([
      mongodb.reviews.aggregate([
        { $match: filter },
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            let: { userIdStr: '$userId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $eq: [
                          '$_id',
                          {
                            $convert: {
                              input: '$$userIdStr',
                              to: 'objectId',
                              onError: null,
                              onNull: null
                            }
                          }
                        ]
                      },
                      { $eq: [{ $toString: '$_id' }, '$$userIdStr'] }
                    ]
                  }
                }
              },
              { $project: { _id: 1, name: 1, avatar: 1 } }
            ],
            as: 'user'
          }
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
      ]).toArray(),
      mongodb.reviews.countDocuments(filter)
    ]);

    // محاسبه آمار
    let stats = null;
    if (productId || productSlug) {
      const statsResult = await mongodb.reviews.aggregate([
        { $match: { ...filter, isApproved: true } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
          }
        }
      ]).toArray();

      stats = statsResult[0] || {
        averageRating: 0,
        totalReviews: 0,
        rating5: 0,
        rating4: 0,
        rating3: 0,
        rating2: 0,
        rating1: 0
      };
    }

    const result = {
      success: true,
      data: reviews.map(r => ({
        ...r,
        _id: r._id?.toString(),
        id: r._id?.toString(),
        approved: r.isApproved || r.approved || false
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats
    };
    
    // Cache the result
    await CacheManager.set(cacheKey, result, CACHE_TTL.PRODUCTS);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت نظرات' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
  const validatedData = createReviewSchema.parse(body);
  const normalizedEmail = validatedData.userEmail?.trim().toLowerCase();

  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || undefined;

    const mongodb = await connectDB();

    // Check if product exists
    let product;
    try {
      product = await mongodb.products.findOne({
        $or: [
          { _id: new ObjectId(validatedData.productId) },
          { sequentialId: parseInt(validatedData.productId) || -1 }
        ]
      });
    } catch {
      product = await mongodb.products.findOne({
        sequentialId: parseInt(validatedData.productId) || -1
      });
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی نظر تکراری (24 ساعت)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const identifierFilters: Record<string, unknown>[] = [];
    if (validatedData.userId) {
      identifierFilters.push({ userId: validatedData.userId });
    }
    if (normalizedEmail) {
      identifierFilters.push({ userEmail: normalizedEmail });
    }
    if (!validatedData.userId && !normalizedEmail && clientIp) {
      identifierFilters.push({ clientIp });
    }

    if (identifierFilters.length > 0) {
      const duplicateFilter: Record<string, unknown> = {
        productId: validatedData.productId,
        createdAt: { $gte: oneDayAgo.toISOString() }
      };

      if (identifierFilters.length === 1) {
        Object.assign(duplicateFilter, identifierFilters[0]);
      } else {
        duplicateFilter.$or = identifierFilters;
      }

      const existingReview = await mongodb.reviews.findOne(duplicateFilter);

      if (existingReview) {
        return NextResponse.json(
          { success: false, error: 'هر کاربر تنها یک‌بار در هر 24 ساعت می‌تواند برای این محصول نظر ثبت کند.' },
          { status: 429 }
        );
      }
    }

    // بررسی خرید تایید شده
    let isVerifiedPurchase = false;
    if (validatedData.userId || normalizedEmail) {
      const purchaseQuery: any = {
        status: { $in: ['completed', 'DELIVERED', 'delivered'] },
        'items.productId': validatedData.productId
      };
      
      if (validatedData.userId) {
        purchaseQuery.userId = validatedData.userId;
      } else if (normalizedEmail) {
        purchaseQuery.userEmail = normalizedEmail;
      }

      const purchase = await mongodb.orders.findOne(purchaseQuery);
      if (purchase) {
        isVerifiedPurchase = true;
      }
    }

    // Create review
    const reviewData = {
      productId: validatedData.productId,
      productSlug: validatedData.productSlug || product.slug,
      userId: validatedData.userId,
      userName: validatedData.userName.trim(),
  userEmail: normalizedEmail,
      rating: validatedData.rating,
      title: validatedData.title?.trim(),
      comment: validatedData.comment.trim(),
      pros: validatedData.pros?.filter((p: string) => p.trim()),
      cons: validatedData.cons?.filter((c: string) => c.trim()),
      isApproved: false, // نیاز به تایید ادمین
      isVerifiedPurchase,
      helpfulCount: 0,
      notHelpfulCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(clientIp && !validatedData.userId && !normalizedEmail ? { clientIp } : {})
    };

    const review = await mongodb.reviews.insertOne(reviewData);

    // به‌روزرسانی تعداد نظرات محصول (فقط برشمارش کل، rating فقط با نظرات تایید شده محاسبه می‌شود)
    await mongodb.products.updateOne(
      { _id: product._id },
      { 
        $inc: { reviewsCount: 1 },
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    // Invalidate reviews cache after creating new review
    await CacheManager.invalidateReviews();

    return NextResponse.json({
      success: true,
      data: {
        ...reviewData,
        _id: review.insertedId.toString(),
        id: review.insertedId.toString()
      },
      message: 'نظر شما با موفقیت ثبت شد و پس از تایید نمایش داده می‌شود.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'داده‌های ورودی نامعتبر',
          details: error.issues.map(i => i.message),
        },
        { status: 400 }
      );
    }

    console.error('Reviews POST error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت نظر' },
      { status: 500 }
    );
  }
}
