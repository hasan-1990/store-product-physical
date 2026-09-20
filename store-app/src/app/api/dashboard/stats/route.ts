import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const authResult = await requireAdmin();
    if (authResult instanceof Response) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const mongodb = await connectDB();

    // Get all statistics
    const [
      totalUsers,
      newUsers,
      totalProducts,
      activeProducts,
      totalOrders,
      newOrders,
      totalRevenue,
      newRevenue,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalReviews,
      pendingReviews,
      approvedReviews,
      lowStockProducts,
      topProducts,
      recentOrders,
    ] = await Promise.all([
      // Users stats
      mongodb.users.countDocuments(),
      mongodb.users.countDocuments({
        createdAt: { $gte: startDate }
      }),

      // Products stats
      mongodb.products.countDocuments(),
      mongodb.products.countDocuments({
        active: true
      }),

      // Orders stats
      mongodb.orders.countDocuments(),
      mongodb.orders.countDocuments({
        createdAt: { $gte: startDate }
      }),

      // Revenue stats
      mongodb.orders.aggregate([
        {
          $match: { status: { $ne: 'CANCELLED' } }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]).toArray(),
      mongodb.orders.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $ne: 'CANCELLED' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]).toArray(),

      // Order status counts
      mongodb.orders.countDocuments({
        status: 'PENDING'
      }),
      mongodb.orders.countDocuments({
        status: 'DELIVERED'
      }),
      mongodb.orders.countDocuments({
        status: 'CANCELLED'
      }),

      // Reviews stats
      mongodb.reviews.countDocuments(),
      mongodb.reviews.countDocuments({
        approved: false
      }),
      mongodb.reviews.countDocuments({
        approved: true
      }),

      // Low stock products
      mongodb.products.countDocuments({
        stock: { $lte: 5 },
        active: true
      }),

      // Top selling products
      mongodb.orderItems.aggregate([
        {
          $group: {
            _id: '$productId',
            totalQuantity: { $sum: '$quantity' }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 }
      ]).toArray(),

      // Recent orders
      mongodb.orders.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'orderItems',
            localField: '_id',
            foreignField: 'orderId',
            as: 'orderItems'
          }
        },
        {
          $project: {
            orderNumber: 1,
            status: 1,
            totalAmount: 1,
            createdAt: 1,
            'user.name': 1,
            'user.email': 1,
            orderItemCount: { $size: '$orderItems' }
          }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 10 }
      ]).toArray(),
    ]);

    // Get product details for top products
    const topProductIds = topProducts.map((item: any) => item._id);
    const topProductDetails = await mongodb.products.find({
      _id: { $in: topProductIds }
    }, {
      projection: {
        _id: 1,
        name: 1,
        imageUrl: 1,
        price: 1
      }
    }).toArray();

    // Combine top products with their details
    const topProductsWithDetails = topProducts.map((item: any) => {
      const product = topProductDetails.find((p: any) => p._id.equals(item._id));
      return {
        ...product,
        totalSold: item.totalQuantity,
      };
    });

    // Generate sales by day for last 7 days
    const salesByDay = await mongodb.orders.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          status: { $ne: 'CANCELLED' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    const stats = {
      overview: {
        totalUsers,
        newUsers,
        totalProducts,
        activeProducts,
        totalOrders,
        newOrders,
        totalRevenue: Number(totalRevenue[0]?.total || 0),
        newRevenue: Number(newRevenue[0]?.total || 0),
      },
      orders: {
        pending: pendingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
      },
      reviews: {
        total: totalReviews,
        pending: pendingReviews,
        approved: approvedReviews,
      },
      alerts: {
        lowStockProducts,
        pendingOrders,
        pendingReviews,
      },
      charts: {
        salesByDay,
      },
      lists: {
        topProducts: topProductsWithDetails,
        recentOrders,
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت آمار' },
      { status: 500 }
    );
  }
}
