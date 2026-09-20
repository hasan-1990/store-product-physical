import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import type { License, LicenseStats } from '@/types';

/**
 * API برای دریافت آمار لایسنس‌ها (فقط ادمین)
 * GET /api/admin/licenses/stats
 */
export async function GET(request: NextRequest) {
  try {
    // چک دسترسی ادمین
    const session = await getServerSession();
    if (!session?.user || !isAdmin(session.user)) {
      return NextResponse.json(
        { error: 'دسترسی مجاز نیست' },
        { status: 403 }
      );
    }

    const db = await connectDB();

    // آمار کلی
    const totalLicenses = await db.licenses.countDocuments();
    const activeLicenses = await db.licenses.countDocuments({ status: 'active' });
    const inactiveLicenses = await db.licenses.countDocuments({ status: 'inactive' });
    const suspendedLicenses = await db.licenses.countDocuments({ status: 'suspended' });
    const expiredLicenses = await db.licenses.countDocuments({ status: 'expired' });

    // آمار بر اساس محصول
    const productStats = await db.licenses.aggregate([
      {
        $group: {
          _id: '$productName',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    // آمار ماهانه (آخرین 6 ماه)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await db.licenses.aggregate([
      {
        $match: {
          createdAt: {
            $gte: sixMonthsAgo.toISOString()
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: { $dateFromString: { dateString: '$createdAt' } } },
            month: { $month: { $dateFromString: { dateString: '$createdAt' } } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]).toArray();

    // لایسنس‌های اخیر (10 تا آخر)
    const recentLicenses = await db.licenses
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray() as any as License[];

    const stats: LicenseStats & {
      productStats: any[];
      monthlyStats: any[];
      recentLicenses: License[];
    } = {
      total: totalLicenses,
      active: activeLicenses,
      inactive: inactiveLicenses,
      suspended: suspendedLicenses,
      expired: expiredLicenses,
      byProduct: {},
      productStats,
      monthlyStats,
      recentLicenses,
    };

    // تبدیل آمار محصولات به object
    productStats.forEach(item => {
      stats.byProduct[item._id] = item.count;
    });

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error('Error getting license stats:', error);
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    );
  }
}

/**
 * چک کردن دسترسی ادمین
 */
function isAdmin(user: any): boolean {
  // این تابع رو بر اساس سیستم احراز هویت شما تنظیم کنید
  return user?.role === 'admin' || user?.email === 'admin@yoursite.com';
}