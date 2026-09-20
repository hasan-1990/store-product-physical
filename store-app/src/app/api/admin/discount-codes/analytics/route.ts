import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { DiscountStats } from '@/types/discount';

// GET /api/admin/discount-codes/analytics - Get discount analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const db = await connectDB();

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom && dateTo) {
      dateFilter.createdAt = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    }

    // Get basic stats
    const [totalCodes, activeCodes, expiredCodes] = await Promise.all([
      db.discountCodes.countDocuments(),
      db.discountCodes.countDocuments({
        isActive: true,
        validUntil: { $gte: new Date() }
      }),
      db.discountCodes.countDocuments({
        validUntil: { $lt: new Date() }
      })
    ]);

    // Get usage stats
    const usageStats = await db.discountUsages.aggregate([
      ...(dateFrom && dateTo ? [{ $match: { usedAt: { $gte: new Date(dateFrom), $lte: new Date(dateTo) } } }] : []),
      {
        $group: {
          _id: null,
          totalUsage: { $sum: 1 },
          totalDiscountGiven: { $sum: "$discountAmount" }
        }
      }
    ]).toArray();

    const totalUsage = usageStats[0]?.totalUsage || 0;
    const totalDiscountGiven = usageStats[0]?.totalDiscountGiven || 0;

    // Get top performing codes
    const topCodes = await db.discountUsages.aggregate([
      ...(dateFrom && dateTo ? [{ $match: { usedAt: { $gte: new Date(dateFrom), $lte: new Date(dateTo) } } }] : []),
      {
        $group: {
          _id: "$discountCode",
          usageCount: { $sum: 1 },
          discountGiven: { $sum: "$discountAmount" }
        }
      },
      {
        $project: {
          code: "$_id",
          usageCount: 1,
          discountGiven: 1,
          _id: 0
        }
      },
      { $sort: { usageCount: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Get recent usage
    const recentUsage = await db.discountUsages.aggregate([
      { $sort: { usedAt: -1 } },
      { $limit: 20 },
      {
        $project: {
          code: "$discountCode",
          orderId: 1,
          amount: "$discountAmount",
          usedAt: 1,
          _id: 0
        }
      }
    ]).toArray();

    // Get monthly usage trends
    const monthlyTrends = await db.discountUsages.aggregate([
      {
        $match: {
          usedAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$usedAt" },
            month: { $month: "$usedAt" }
          },
          usage: { $sum: 1 },
          discountGiven: { $sum: "$discountAmount" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]).toArray();

    // Get discount type distribution
    const typeDistribution = await db.discountCodes.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const stats: DiscountStats = {
      totalCodes,
      activeCodes,
      expiredCodes,
      totalUsage,
      totalDiscountGiven,
      topCodes: topCodes as any,
      recentUsage: recentUsage as any
    };

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        monthlyTrends,
        typeDistribution
      }
    });

  } catch (error) {
    console.error('Error fetching discount analytics:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت آمار کدهای تخفیف' },
      { status: 500 }
    );
  }
}