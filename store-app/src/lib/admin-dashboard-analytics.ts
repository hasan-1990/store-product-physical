import { connectDB } from '@/lib/mongodb';
import { getTodayStats } from '@/lib/visitor-tracking';
import cache from '@/lib/redis';

const DASHBOARD_CACHE_KEY = 'admin:analytics:full';
const DASHBOARD_CACHE_TTL = 60; // seconds

export async function getDashboardAnalytics() {
  try {
    const cached = await cache.get<Record<string, unknown>>(DASHBOARD_CACHE_KEY);
    if (cached && cached.success) {
      return { ...cached, cached: true };
    }

    return await buildDashboardAnalytics();
  } catch (error) {
    console.error('getDashboardAnalytics error:', error);
    return buildFallbackAnalytics();
  }
}

function buildFallbackAnalytics() {
  const now = new Date().toISOString();
  return {
    success: true,
    period: '7d',
    metrics: {
      totalPageViews: 0,
      totalUsers: 0,
      totalRevenue: 0,
      conversionRate: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      onlineUsers: 0,
      pagesBeingViewed: 0,
      todayConversions: 0,
    },
    realTime: { currentPageViews: 0, sessionsToday: 0, activeUsers: 0 },
    goals: { purchase: 0, signup: 0, contact: 0, add_to_cart: 0, view_item: 0 },
    topPages: [],
    trafficSources: [],
    visitorTracking: {
      todayVisitors: 0,
      todayPageViews: 0,
      activePages: [],
    },
    businessMetrics: {
      totalProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
      lowStockProducts: 0,
      totalSessions: 0,
    },
    lastUpdated: now,
    note: 'آمار با داده پیش‌فرض — خطا در خواندن analytics',
  };
}

async function buildDashboardAnalytics() {
  const db = await connectDB();
  const todayStart = new Date(new Date().toDateString());
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    todayStats,
    totalOrders,
    totalUsers,
    totalProducts,
    ordersWithAmount,
    pendingOrders,
    lowStockProducts,
    sessionAgg,
    activeUsers,
    sessionsToday,
    weeklyPageViews,
    trafficSources,
    contactsCount,
    cartItemsCount,
  ] = await Promise.all([
    getTodayStats(),
    db.orders.countDocuments({}),
    db.users.countDocuments({}),
    db.products.countDocuments({}),
    db.orders
      .aggregate([{ $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }])
      .toArray(),
    db.orders.countDocuments({ status: 'pending' }),
    db.products.countDocuments({ stock: { $lte: 5 } }),
    db.visitorSessions
      .aggregate([
        {
          $match: {
            firstVisit: { $exists: true, $ne: null },
            lastActivity: { $exists: true, $ne: null },
          },
        },
        {
          $addFields: {
            visitStart: {
              $convert: { input: '$firstVisit', to: 'date', onError: null, onNull: null },
            },
            visitEnd: {
              $convert: { input: '$lastActivity', to: 'date', onError: null, onNull: null },
            },
          },
        },
        {
          $match: {
            visitStart: { $ne: null },
            visitEnd: { $ne: null },
          },
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            totalDurationMs: {
              $sum: { $subtract: ['$visitEnd', '$visitStart'] },
            },
            singlePageSessions: {
              $sum: { $cond: [{ $eq: ['$pageViews', 1] }, 1, 0] },
            },
          },
        },
      ])
      .toArray()
      .catch((err) => {
        console.warn('session aggregation fallback:', err?.message);
        return [];
      }),
    db.visitorSessions.countDocuments({ lastActivity: { $gte: thirtyMinutesAgo } }),
    db.visitorSessions.countDocuments({ firstVisit: { $gte: todayStart } }),
    db.pageViews.countDocuments({ timestamp: { $gte: weekAgo } }),
    db.pageViews
      .aggregate([
        {
          $addFields: {
            ref: { $ifNull: ['$referrer', ''] },
          },
        },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ['$ref', ''] },
                    then: 'مستقیم',
                  },
                  {
                    case: {
                      $regexMatch: { input: '$ref', regex: /google/i },
                    },
                    then: 'جستجوی گوگل',
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: '$ref',
                        regex: /instagram|telegram|whatsapp/i,
                      },
                    },
                    then: 'شبکه‌های اجتماعی',
                  },
                ],
                default: 'سایر',
              },
            },
            visits: { $sum: 1 },
          },
        },
        { $sort: { visits: -1 } },
        { $limit: 10 },
      ])
      .toArray()
      .catch(() => []),
    db.getCollection('contacts').countDocuments({}).catch(() => 0),
    db.cartItems.countDocuments({}).catch(() => 0),
  ]);

  const totalRevenue =
    ordersWithAmount.length > 0 ? ordersWithAmount[0].totalRevenue : 0;
  const sessionRow = sessionAgg[0] as
    | { totalSessions: number; totalDurationMs: number; singlePageSessions: number }
    | undefined;
  const totalSessions = sessionRow?.totalSessions ?? 0;
  const avgSessionDuration =
    totalSessions > 0
      ? Math.round((sessionRow!.totalDurationMs / totalSessions / 1000))
      : 0;
  const bounceRate =
    totalSessions > 0
      ? Math.round(((sessionRow!.singlePageSessions / totalSessions) * 100))
      : 0;

  const totalTrafficVisits = trafficSources.reduce(
    (sum, source) => sum + (source.visits as number),
    0
  );
  const formattedTrafficSources = trafficSources.map((source) => ({
    source: source._id as string,
    visits: source.visits as number,
    percentage:
      totalTrafficVisits > 0
        ? Math.round(((source.visits as number) / totalTrafficVisits) * 100)
        : 0,
  }));

  const payload = {
    success: true,
    period: '7d',
    metrics: {
      totalPageViews: weeklyPageViews,
      totalUsers,
      totalRevenue,
      conversionRate:
        totalUsers > 0
          ? Math.round((totalOrders / totalUsers) * 100 * 100) / 100
          : 0,
      avgSessionDuration,
      bounceRate,
      onlineUsers: activeUsers,
      pagesBeingViewed: todayStats.activePages.length,
      todayConversions: pendingOrders,
    },
    realTime: {
      currentPageViews: todayStats.activePages.length,
      sessionsToday,
      activeUsers,
    },
    goals: {
      purchase: totalOrders,
      signup: totalUsers,
      contact: contactsCount,
      add_to_cart: cartItemsCount,
      view_item: weeklyPageViews,
    },
    topPages: todayStats.activePages.map((page) => ({
      path: page.page,
      views: page.views,
      title:
        page.page === '/'
          ? 'صفحه اصلی'
          : page.page.includes('/products')
            ? 'محصولات'
            : page.page.includes('/blog')
              ? 'وبلاگ'
              : page.page.includes('/categories')
                ? 'دسته‌بندی‌ها'
                : page.page.includes('/contact')
                  ? 'تماس با ما'
                  : page.page,
    })),
    trafficSources: formattedTrafficSources,
    visitorTracking: {
      todayVisitors: todayStats.todayVisitors,
      todayPageViews: todayStats.todayPageViews,
      activePages: todayStats.activePages,
    },
    businessMetrics: {
      totalProducts,
      totalOrders,
      pendingOrders,
      lowStockProducts,
      totalSessions,
    },
    lastUpdated: new Date().toISOString(),
    note: 'تمام داده‌های نمایش داده شده واقعی و از پایگاه داده MongoDB می‌باشند',
  };

  await cache.set(DASHBOARD_CACHE_KEY, payload, DASHBOARD_CACHE_TTL);
  return payload;
}