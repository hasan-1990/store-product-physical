import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    const db = await connectDB();
    const ordersCollection = db.getCollection('orders');

    // تاریخ‌های مرجع
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // محاسبه تاریخ شروع بر اساس دوره
    let startDate: Date;
    let groupByFormat: string;
    let dateLabels: string[] = [];

    if (period === 'week') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 6);
      groupByFormat = '%Y-%m-%d';
      
      // ایجاد برچسب‌های روزهای هفته
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'][date.getDay()];
        dateLabels.push(dayName);
      }
    } else if (period === 'month') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 29);
      groupByFormat = '%Y-%m-%d';
      
      // ایجاد برچسب‌های روزهای ماه (هر 3 روز یک برچسب)
      for (let i = 29; i >= 0; i -= 3) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dateLabels.push(`${date.getDate()} ${['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'][date.getMonth()]}`);
      }
    } else {
      // سالانه - 12 ماه گذشته
      startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - 11);
      groupByFormat = '%Y-%m';
      
      dateLabels = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    }

    // دریافت سفارشات تکمیل شده
    const completedOrders = await ordersCollection.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered', 'processing', 'shipped'] },
          createdAt: { $exists: true }
        }
      },
      {
        $addFields: {
          orderDate: {
            $cond: {
              if: { $eq: [{ $type: '$createdAt' }, 'string'] },
              then: { $toDate: '$createdAt' },
              else: '$createdAt'
            }
          }
        }
      },
      {
        $match: {
          orderDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: '$orderDate' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();

    // محاسبه آمار امروز
    const todayOrders = await ordersCollection.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered', 'processing', 'shipped'] },
          createdAt: { $exists: true }
        }
      },
      {
        $addFields: {
          orderDate: {
            $cond: {
              if: { $eq: [{ $type: '$createdAt' }, 'string'] },
              then: { $toDate: '$createdAt' },
              else: '$createdAt'
            }
          }
        }
      },
      {
        $match: {
          orderDate: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      }
    ]).toArray();

    // محاسبه آمار دیروز
    const yesterdayOrders = await ordersCollection.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered', 'processing', 'shipped'] },
          createdAt: { $exists: true }
        }
      },
      {
        $addFields: {
          orderDate: {
            $cond: {
              if: { $eq: [{ $type: '$createdAt' }, 'string'] },
              then: { $toDate: '$createdAt' },
              else: '$createdAt'
            }
          }
        }
      },
      {
        $match: {
          orderDate: { $gte: yesterday, $lt: today }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' }
        }
      }
    ]).toArray();

    // محاسبه آمار این هفته
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    const thisWeekOrders = await ordersCollection.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered', 'processing', 'shipped'] },
          createdAt: { $exists: true }
        }
      },
      {
        $addFields: {
          orderDate: {
            $cond: {
              if: { $eq: [{ $type: '$createdAt' }, 'string'] },
              then: { $toDate: '$createdAt' },
              else: '$createdAt'
            }
          }
        }
      },
      {
        $match: {
          orderDate: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' }
        }
      }
    ]).toArray();

    // محاسبه آمار هفته گذشته
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekOrders = await ordersCollection.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered', 'processing', 'shipped'] },
          createdAt: { $exists: true }
        }
      },
      {
        $addFields: {
          orderDate: {
            $cond: {
              if: { $eq: [{ $type: '$createdAt' }, 'string'] },
              then: { $toDate: '$createdAt' },
              else: '$createdAt'
            }
          }
        }
      },
      {
        $match: {
          orderDate: { $gte: lastWeekStart, $lt: weekStart }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' }
        }
      }
    ]).toArray();

    // محاسبه آمار این ماه
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthOrders = await ordersCollection.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered', 'processing', 'shipped'] },
          createdAt: { $exists: true }
        }
      },
      {
        $addFields: {
          orderDate: {
            $cond: {
              if: { $eq: [{ $type: '$createdAt' }, 'string'] },
              then: { $toDate: '$createdAt' },
              else: '$createdAt'
            }
          }
        }
      },
      {
        $match: {
          orderDate: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' }
        }
      }
    ]).toArray();

    // محاسبه آمار ماه گذشته
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthOrders = await ordersCollection.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered', 'processing', 'shipped'] },
          createdAt: { $exists: true }
        }
      },
      {
        $addFields: {
          orderDate: {
            $cond: {
              if: { $eq: [{ $type: '$createdAt' }, 'string'] },
              then: { $toDate: '$createdAt' },
              else: '$createdAt'
            }
          }
        }
      },
      {
        $match: {
          orderDate: { $gte: lastMonthStart, $lt: lastMonthEnd }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' }
        }
      }
    ]).toArray();

    // کل سفارشات و مشتریان
    const totalOrders = await ordersCollection.countDocuments({
      status: { $in: ['completed', 'delivered', 'processing', 'shipped'] }
    });

    const usersCollection = db.getCollection('users');
    const totalCustomers = await usersCollection.countDocuments({});

    // محاسبه میانگین ارزش سفارش
    const allOrders = await ordersCollection.find({
      status: { $in: ['completed', 'delivered', 'processing', 'shipped'] }
    }).toArray();

    const totalRevenue = allOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // ایجاد داده‌های نمودار
    const chartData = dateLabels.map((label, index) => {
      const orderData = completedOrders[index];
      return {
        date: label,
        revenue: orderData?.revenue || 0,
        orders: orderData?.orders || 0
      };
    });

    // آمار نهایی
    const stats = {
      today: todayOrders[0]?.revenue || 0,
      yesterday: yesterdayOrders[0]?.revenue || 0,
      thisWeek: thisWeekOrders[0]?.revenue || 0,
      lastWeek: lastWeekOrders[0]?.revenue || 0,
      thisMonth: thisMonthOrders[0]?.revenue || 0,
      lastMonth: lastMonthOrders[0]?.revenue || 0,
      totalOrders,
      averageOrderValue,
      totalCustomers
    };

    return NextResponse.json({
      success: true,
      chartData,
      stats
    });

  } catch (error) {
    console.error('Revenue API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در دریافت اطلاعات درآمد',
        chartData: [],
        stats: {
          today: 0,
          yesterday: 0,
          thisWeek: 0,
          lastWeek: 0,
          thisMonth: 0,
          lastMonth: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          totalCustomers: 0
        }
      },
      { status: 500 }
    );
  }
}
