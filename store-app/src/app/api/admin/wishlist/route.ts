import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdminFromRequest } from '@/lib/auth-helper';

// GET - دریافت تمام wishlist ها (برای ادمین)
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminFromRequest(request);
    if (!admin.authorized) return admin.response!;

    const db = await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    // ساخت کوئری
    let query: any = {};
    if (userId) query.userId = userId;
    if (productId) query.productId = productId;

    // دریافت wishlist items با جزئیات
    const wishlistItems = await db.wishlist
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: '$product',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            productId: 1,
            createdAt: 1,
            'user.name': 1,
            'user.email': 1,
            'user._id': 1,
            'product.name': 1,
            'product.slug': 1,
            'product.sequentialId': 1,
            'product.price': 1,
            'product.imageUrl': 1,
            'product._id': 1
          }
        },
        { $sort: { createdAt: -1 } }
      ])
      .toArray();

    // آمار کلی
    const stats = await db.wishlist.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueProducts: { $addToSet: '$productId' }
        }
      },
      {
        $project: {
          _id: 0,
          totalItems: 1,
          totalUsers: { $size: '$uniqueUsers' },
          totalProducts: { $size: '$uniqueProducts' }
        }
      }
    ]).toArray();

    // محبوب‌ترین محصولات
    const popularProducts = await db.wishlist.aggregate([
      {
        $group: {
          _id: '$productId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          productId: '$_id',
          count: 1,
          'product.name': 1,
          'product.slug': 1,
          'product.imageUrl': 1,
          'product.price': 1
        }
      }
    ]).toArray();

    return NextResponse.json({
      success: true,
      data: {
        items: wishlistItems,
        stats: stats[0] || { totalItems: 0, totalUsers: 0, totalProducts: 0 },
        popularProducts
      }
    });
  } catch (error) {
    console.error('Error fetching admin wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}

// DELETE - حذف wishlist item (برای ادمین)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdminFromRequest(request);
    if (!admin.authorized) return admin.response!;

    const db = await connectDB();

    const { searchParams } = new URL(request.url);
    const wishlistId = searchParams.get('id');

    if (!wishlistId) {
      return NextResponse.json(
        { success: false, error: 'شناسه الزامی است' },
        { status: 400 }
      );
    }

    // حذف
    const result = await db.wishlist.deleteOne({ _id: wishlistId as any });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'آیتم یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'آیتم با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting wishlist item:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف آیتم' },
      { status: 500 }
    );
  }
}
