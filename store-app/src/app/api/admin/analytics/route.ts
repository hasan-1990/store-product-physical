import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { 
  getComprehensiveAnalytics, 
  getTodayStats,
  getDailyAnalytics,
  getAnalyticsForRange 
} from '@/lib/visitor-tracking';
import { getDashboardAnalytics } from '@/lib/admin-dashboard-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const type = searchParams.get('type') || 'visitor-tracking';
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // استفاده از سیستم ردیابی واقعی بازدیدکنندگان
    if (type === 'visitor-tracking') {
      switch (period) {
        case 'today':
          const todayStats = await getTodayStats();
          return NextResponse.json({
            success: true,
            data: todayStats
          });

        case 'daily':
          if (!date) {
            return NextResponse.json({
              success: false,
              error: 'Date parameter is required for daily analytics'
            }, { status: 400 });
          }
          const dailyStats = await getDailyAnalytics(date);
          return NextResponse.json({
            success: true,
            data: dailyStats
          });

        case 'range':
          if (!startDate || !endDate) {
            return NextResponse.json({
              success: false,
              error: 'startDate and endDate parameters are required for range analytics'
            }, { status: 400 });
          }
          const rangeStats = await getAnalyticsForRange(
            new Date(startDate),
            new Date(endDate)
          );
          return NextResponse.json({
            success: true,
            data: rangeStats
          });

        case 'comprehensive':
        default:
          const comprehensiveStats = await getComprehensiveAnalytics();
          return NextResponse.json({
            success: true,
            data: comprehensiveStats
          });
      }
    }

    // داشبورد ادمین — مسیر بهینه (بدون load کل sessions)
    if (type === 'full') {
      const data = await getDashboardAnalytics();
      return NextResponse.json(data);
    }

    // دریافت آمار واقعی از پایگاه داده (مسیر legacy — کندتر)
    const [todayStats, comprehensiveStats, db] = await Promise.all([
      getTodayStats(),
      getComprehensiveAnalytics(),
      connectDB()
    ]);

    // محاسبه آمار واقعی فروش و سفارشات
    const totalOrders = await db.orders.countDocuments({});
    const totalUsers = await db.users.countDocuments({});
    const totalProducts = await db.products.countDocuments({});
    
    // محاسبه درآمد واقعی
    const ordersWithAmount = await db.orders.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]).toArray();
    const totalRevenue = ordersWithAmount.length > 0 ? ordersWithAmount[0].totalRevenue : 0;

    // محاسبه سفارشات در انتظار
    const pendingOrders = await db.orders.countDocuments({ status: 'pending' });
    
    // محاسبه محصولات کم موجود
    const lowStockProducts = await db.products.countDocuments({ stock: { $lte: 5 } });

    // محاسبه میانگین مدت جلسه واقعی
    const sessions = await db.visitorSessions.find({}).toArray();
    let avgSessionDuration = 0;
    if (sessions.length > 0) {
      const totalDuration = sessions.reduce((sum, session) => {
        if (session.firstVisit && session.lastActivity) {
          const duration = new Date(session.lastActivity).getTime() - new Date(session.firstVisit).getTime();
          return sum + (duration / 1000); // تبدیل به ثانیه
        }
        return sum;
      }, 0);
      avgSessionDuration = Math.round(totalDuration / sessions.length);
    }

    // محاسبه نرخ پرش واقعی (جلسات با فقط یک بازدید صفحه)
    const singlePageSessions = await db.visitorSessions.countDocuments({ pageViews: 1 });
    const totalSessions = sessions.length;
    const bounceRate = totalSessions > 0 ? Math.round((singlePageSessions / totalSessions) * 100) : 0;

    // کاربران فعال (آخرین فعالیت در 30 دقیقه گذشته)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const activeUsers = await db.visitorSessions.countDocuments({
      lastActivity: { $gte: thirtyMinutesAgo }
    });

    // منابع ترافیک واقعی بر اساس referrer
    const trafficSources = await db.pageViews.aggregate([
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$referrer', null] },
              then: 'مستقیم',
              else: {
                $cond: {
                  if: { $regexMatch: { input: '$referrer', regex: 'google' } },
                  then: 'جستجوی گوگل',
                  else: {
                    $cond: {
                      if: { $regexMatch: { input: '$referrer', regex: 'instagram|telegram|whatsapp' } },
                      then: 'شبکه‌های اجتماعی',
                      else: 'سایر'
                    }
                  }
                }
              }
            }
          },
          visits: { $sum: 1 }
        }
      },
      { $sort: { visits: -1 } }
    ]).toArray();

    const totalTrafficVisits = trafficSources.reduce((sum, source) => sum + source.visits, 0);
    const formattedTrafficSources = trafficSources.map(source => ({
      source: source._id,
      visits: source.visits,
      percentage: totalTrafficVisits > 0 ? Math.round((source.visits / totalTrafficVisits) * 100) : 0
    }));

    return NextResponse.json({
      success: true,
      period,
      metrics: {
        totalPageViews: comprehensiveStats.weekly.totalPageViews,
        totalUsers: totalUsers,
        totalRevenue: totalRevenue,
        conversionRate: totalUsers > 0 ? Math.round((totalOrders / totalUsers) * 100 * 100) / 100 : 0,
        avgSessionDuration: avgSessionDuration,
        bounceRate: bounceRate,
        onlineUsers: activeUsers,
        pagesBeingViewed: todayStats.activePages.length,
        todayConversions: pendingOrders
      },
      realTime: {
        currentPageViews: todayStats.activePages.length,
        sessionsToday: await db.visitorSessions.countDocuments({
          firstVisit: { $gte: new Date(new Date().toDateString()) }
        }),
        activeUsers: activeUsers
      },
      goals: {
        purchase: totalOrders,
        signup: totalUsers,
        contact: await db.getCollection('contacts').countDocuments({}).catch(() => 0),
        add_to_cart: await db.cartItems.countDocuments({}).catch(() => 0),
        view_item: comprehensiveStats.weekly.totalPageViews
      },
      topPages: todayStats.activePages.length > 0 ? todayStats.activePages.map(page => ({
        path: page.page,
        views: page.views,
        title: page.page === '/' ? 'صفحه اصلی' : 
               page.page.includes('/products') ? 'محصولات' :
               page.page.includes('/blog') ? 'وبلاگ' :
               page.page.includes('/categories') ? 'دسته‌بندی‌ها' : 
               page.page.includes('/contact') ? 'تماس با ما' :
               page.page
      })) : [],
      trafficSources: formattedTrafficSources,
      visitorTracking: {
        todayVisitors: todayStats.todayVisitors,
        todayPageViews: todayStats.todayPageViews,
        activePages: todayStats.activePages
      },
      businessMetrics: {
        totalProducts: totalProducts,
        totalOrders: totalOrders,
        pendingOrders: pendingOrders,
        lowStockProducts: lowStockProducts,
        totalSessions: totalSessions
      },
      lastUpdated: new Date().toISOString(),
      note: 'تمام داده‌های نمایش داده شده واقعی و از پایگاه داده MongoDB می‌باشند'
    });

  } catch (error) {
    console.error('خطا در دریافت آمار Analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در دریافت آمار'
      },
      { status: 500 }
    );
  }
}

// POST - ذخیره Analytics Event
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // در محیط توسعه، فقط log می‌کنیم
    console.log('📊 Analytics Event:', {
      action: data.action,
      category: data.category,
      label: data.label,
      value: data.value,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Event ثبت شد (development mode)',
      eventId: `event_${Date.now()}` 
    });

  } catch (error) {
    console.error('خطا در ذخیره Analytics Event:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره event' },
      { status: 500 }
    );
  }
}