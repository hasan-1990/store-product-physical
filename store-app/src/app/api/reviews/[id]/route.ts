import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(10).optional(),
  approved: z.boolean().optional(),
  isApproved: z.boolean().optional(),
});

const buildReviewIdVariants = (id: string) => {
  const variants = new Set<any>();
  variants.add(id);

  if (ObjectId.isValid(id)) {
    variants.add(new ObjectId(id));
  }

  return Array.from(variants);
};

const buildReviewIdFilter = (id: string) => {
  const variants = buildReviewIdVariants(id);
  if (variants.length === 1) {
    return { _id: variants[0] };
  }
  return { $or: variants.map(value => ({ _id: value })) };
};

const buildReviewMatchStage = (id: string) => {
  const variants = buildReviewIdVariants(id);
  if (variants.length === 1) {
    return { $match: { _id: variants[0] } };
  }
  return { $match: { $or: variants.map(value => ({ _id: value })) } };
};

// GET /api/reviews/[id] - Get single review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const mongodb = await connectDB();

    const review = await mongodb.reviews.aggregate([
      buildReviewMatchStage(resolvedParams.id),
      {
        $addFields: {
          productIdObj: {
            $cond: [
              { $eq: [{ $type: "$productId" }, "objectId"] },
              "$productId",
              {
                $convert: {
                  input: "$productId",
                  to: "objectId",
                  onError: null,
                  onNull: null
                }
              }
            ]
          }
        }
      },
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
            { $project: { _id: 1, name: 1, avatar: 1, email: 1 } }
          ],
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productIdObj',
          foreignField: '_id',
          as: 'product',
          pipeline: [
            { $project: { _id: 1, name: 1, imageUrl: 1 } }
          ]
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } }
    ]).toArray();

    if (!review.length) {
      return NextResponse.json(
        { success: false, error: 'نظر یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: review[0],
    });
  } catch (error) {
    console.error('Review GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت نظر' },
      { status: 500 }
    );
  }
}

// PUT /api/reviews/[id] - Update review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    console.log('📥 PUT /api/reviews/[id] - Request body:', body);
    console.log('🆔 Review ID:', resolvedParams.id);
    
    const validatedData = updateReviewSchema.parse(body);
    console.log('✅ Validated data:', validatedData);

    const mongodb = await connectDB();

    // Check if review exists
    const reviewFilter = buildReviewIdFilter(resolvedParams.id);
    const existingReview = await mongodb.reviews.findOne(reviewFilter);

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: 'نظر یافت نشد' },
        { status: 404 }
      );
    }

    // Normalize approved/isApproved field
    const updateData: any = {};
    
    // Copy validated fields
    if (validatedData.rating !== undefined) updateData.rating = validatedData.rating;
    if (validatedData.comment !== undefined) updateData.comment = validatedData.comment;
    
    // Handle approval fields
    if (validatedData.approved !== undefined) {
      updateData.isApproved = validatedData.approved;
      updateData.approved = validatedData.approved;
    }
    if (validatedData.isApproved !== undefined) {
      updateData.isApproved = validatedData.isApproved;
      updateData.approved = validatedData.isApproved;
    }

    // Always update timestamp
    updateData.updatedAt = new Date();

    console.log('📝 Updating review with data:', updateData);

    // Update review
    const updateResult = await mongodb.reviews.updateOne(
      reviewFilter,
      { $set: updateData }
    );

    console.log('✅ Update result:', updateResult);

    // If approval status changed, recalculate product rating
    const approvalChanged = validatedData.approved !== undefined || validatedData.isApproved !== undefined;
    if (approvalChanged || validatedData.rating !== undefined) {
      console.log('🔄 Recalculating product rating...');
      
      try {
        const productIdCandidates = new Set<any>();
        if (existingReview.productId !== undefined && existingReview.productId !== null) {
          productIdCandidates.add(existingReview.productId);

          if (existingReview.productId instanceof ObjectId) {
            productIdCandidates.add(existingReview.productId.toString());
          } else if (
            typeof existingReview.productId === 'string' &&
            ObjectId.isValid(existingReview.productId)
          ) {
            productIdCandidates.add(new ObjectId(existingReview.productId));
          }
        }

        const productIdFilter = Array.from(productIdCandidates);

        if (productIdFilter.length === 0) {
          console.warn('⚠️ Skipping product rating recalculation - missing productId', existingReview._id);
        } else {
          const reviews = await mongodb.reviews.find({
            productId: { $in: productIdFilter },
            $or: [{ approved: true }, { isApproved: true }]
          }).toArray();

          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

          console.log(`📊 Found ${reviews.length} approved reviews, average rating: ${averageRating}`);

          let productObjectId: ObjectId | null = null;
          if (existingReview.productId instanceof ObjectId) {
            productObjectId = existingReview.productId;
          } else if (
            typeof existingReview.productId === 'string' &&
            ObjectId.isValid(existingReview.productId)
          ) {
            productObjectId = new ObjectId(existingReview.productId);
          }

          if (productObjectId) {
            await mongodb.products.updateOne(
              { _id: productObjectId },
              {
                $set: {
                  rating: averageRating,
                  reviewsCount: reviews.length,
                  updatedAt: new Date()
                }
              }
            );
            
            console.log('✅ Product rating updated successfully');
          } else {
            console.warn('⚠️ Skipping product rating update - invalid productId', existingReview.productId);
          }
        }
      } catch (ratingError) {
        console.error('❌ Error updating product rating:', ratingError);
        // Don't fail the whole request if just rating update fails
      }
    }

    // Get updated review with user and product info
    const updatedReview = await mongodb.reviews.aggregate([
      buildReviewMatchStage(resolvedParams.id),
      {
        $addFields: {
          productIdObj: {
            $cond: [
              { $eq: [{ $type: "$productId" }, "objectId"] },
              "$productId",
              {
                $convert: {
                  input: "$productId",
                  to: "objectId",
                  onError: null,
                  onNull: null
                }
              }
            ]
          }
        }
      },
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
      {
        $lookup: {
          from: 'products',
          localField: 'productIdObj',
          foreignField: '_id',
          as: 'product',
          pipeline: [
            { $project: { _id: 1, name: 1, imageUrl: 1 } }
          ]
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } }
    ]).toArray();

    return NextResponse.json({
      success: true,
      data: updatedReview[0],
      message: 'نظر با موفقیت بروزرسانی شد',
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

    console.error('❌ Review PUT error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در بروزرسانی نظر',
        details: error instanceof Error ? error.message : 'خطای ناشناخته'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[id] - Delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const mongodb = await connectDB();

    // Check if review exists
    const reviewFilter = buildReviewIdFilter(resolvedParams.id);
    const existingReview = await mongodb.reviews.findOne(reviewFilter);

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: 'نظر یافت نشد' },
        { status: 404 }
      );
    }

    // Delete review
    await mongodb.reviews.deleteOne(reviewFilter);

    // Recalculate product rating
    const productIdCandidates = new Set<any>();
    if (existingReview.productId !== undefined && existingReview.productId !== null) {
      productIdCandidates.add(existingReview.productId);

      if (existingReview.productId instanceof ObjectId) {
        productIdCandidates.add(existingReview.productId.toString());
      } else if (
        typeof existingReview.productId === 'string' &&
        ObjectId.isValid(existingReview.productId)
      ) {
        productIdCandidates.add(new ObjectId(existingReview.productId));
      }
    }

    const productIdFilter = Array.from(productIdCandidates);

    if (productIdFilter.length > 0) {
      const reviews = await mongodb.reviews.find({
        productId: { $in: productIdFilter },
        $or: [{ approved: true }, { isApproved: true }]
      }).toArray();

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

      let productObjectId: ObjectId | null = null;
      if (existingReview.productId instanceof ObjectId) {
        productObjectId = existingReview.productId;
      } else if (
        typeof existingReview.productId === 'string' &&
        ObjectId.isValid(existingReview.productId)
      ) {
        productObjectId = new ObjectId(existingReview.productId);
      }

      if (productObjectId) {
        await mongodb.products.updateOne(
          { _id: productObjectId },
          {
            $set: {
              rating: averageRating,
              reviewsCount: reviews.length,
              updatedAt: new Date()
            }
          }
        );
      } else {
        console.warn('⚠️ Skipping product rating update after delete - invalid productId', existingReview.productId);
      }
    } else {
      console.warn('⚠️ Skipping product rating recalculation after delete - missing productId', existingReview._id);
    }

    return NextResponse.json({
      success: true,
      message: 'نظر با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('Review DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف نظر' },
      { status: 500 }
    );
  }
}
