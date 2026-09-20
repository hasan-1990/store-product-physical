import { connectDB } from '@/lib/mongodb';

export interface VisitorData {
  ip: string;
  userAgent: string;
  page: string;
  timestamp: Date;
  referrer?: string;
  sessionId?: string;
}

export interface DailyStats {
  date: string;
  uniqueVisitors: number;
  totalPageViews: number;
  topPages: Array<{ page: string; views: number }>;
}

export interface AnalyticsStats {
  daily: DailyStats[];
  weekly: {
    uniqueVisitors: number;
    totalPageViews: number;
    topPages: Array<{ page: string; views: number }>;
  };
  monthly: {
    uniqueVisitors: number;
    totalPageViews: number;
    topPages: Array<{ page: string; views: number }>;
  };
}

// Get client IP address
export function getClientIP(request?: Request): string {
  if (request) {
    // Try different headers for IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfIP = request.headers.get('cf-connecting-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    if (cfIP) {
      return cfIP;
    }
  }
  
  // Fallback to localhost for development
  return '127.0.0.1';
}

// Generate session ID
export function generateSessionId(ip: string, userAgent: string): string {
  const data = `${ip}-${userAgent}-${new Date().toDateString()}`;
  return Buffer.from(data).toString('base64').slice(0, 32);
}

// Track page visit
export async function trackPageVisit(
  page: string,
  ip?: string,
  userAgent?: string,
  referrer?: string
): Promise<void> {
  try {
    const db = await connectDB();
    const timestamp = new Date();
    
    // Use provided data or get from headers
    const visitorIP = ip || getClientIP();
    const visitorUA = userAgent || 'unknown';
    const sessionId = generateSessionId(visitorIP, visitorUA);

    // Record page view with additional details
    await db.pageViews.insertOne({
      ip: visitorIP,
      userAgent: visitorUA,
      page,
      timestamp,
      referrer: referrer || null,
      sessionId,
      date: timestamp.toISOString().split('T')[0], // YYYY-MM-DD format
      hour: timestamp.getHours(),
      dayOfWeek: timestamp.getDay(),
      isUnique: false, // Will be updated below
    });

    // Check if this is a unique visitor today
    const todayStart = new Date(timestamp.toDateString());
    const existingVisitToday = await db.pageViews.findOne({
      ip: visitorIP,
      timestamp: { $gte: todayStart },
      page // Check for visits to any page today
    });

    // Update or create session with more details
    const sessionUpdate = await db.visitorSessions.updateOne(
      { sessionId },
      {
        $set: {
          ip: visitorIP,
          userAgent: visitorUA,
          lastActivity: timestamp,
          lastPage: page,
        },
        $setOnInsert: {
          firstVisit: timestamp,
          sessionId,
          isNewVisitor: !existingVisitToday,
          country: 'Iran', // You can integrate with IP geolocation service
          device: visitorUA.includes('Mobile') ? 'mobile' : 'desktop',
        },
        $inc: { pageViews: 1 },
        $addToSet: { visitedPages: page },
      },
      { upsert: true }
    );

    // If this is a new session, mark the page view as unique
    if (sessionUpdate.upsertedId || !existingVisitToday) {
      await db.pageViews.updateOne(
        { ip: visitorIP, page, timestamp },
        { $set: { isUnique: true } }
      );
    }

    console.log(`📊 Tracked visit: ${page} from ${visitorIP}`);

  } catch (error) {
    console.error('Error tracking page visit:', error);
  }
}

// Get daily analytics
export async function getDailyAnalytics(date: string): Promise<DailyStats> {
  try {
    const db = await connectDB();
    
    // Get unique visitors for the day
    const uniqueVisitors = await db.pageViews.distinct('ip', { date });
    
    // Get total page views for the day
    const totalPageViews = await db.pageViews.countDocuments({ date });
    
    // Get top pages for the day
    const topPagesAgg = await db.pageViews.aggregate([
      { $match: { date } },
      { $group: { _id: '$page', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
      { $project: { page: '$_id', views: 1, _id: 0 } }
    ]).toArray();

    return {
      date,
      uniqueVisitors: uniqueVisitors.length,
      totalPageViews,
      topPages: topPagesAgg as Array<{ page: string; views: number }>
    };
  } catch (error) {
    console.error('Error getting daily analytics:', error);
    return {
      date,
      uniqueVisitors: 0,
      totalPageViews: 0,
      topPages: []
    };
  }
}

// Get analytics for date range
export async function getAnalyticsForRange(
  startDate: Date,
  endDate: Date
): Promise<{ uniqueVisitors: number; totalPageViews: number; topPages: Array<{ page: string; views: number }> }> {
  try {
    const db = await connectDB();
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get unique visitors for the range
    const uniqueVisitors = await db.pageViews.distinct('ip', {
      date: { $gte: startDateStr, $lte: endDateStr }
    });
    
    // Get total page views for the range
    const totalPageViews = await db.pageViews.countDocuments({
      date: { $gte: startDateStr, $lte: endDateStr }
    });
    
    // Get top pages for the range
    const topPagesAgg = await db.pageViews.aggregate([
      { $match: { date: { $gte: startDateStr, $lte: endDateStr } } },
      { $group: { _id: '$page', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
      { $project: { page: '$_id', views: 1, _id: 0 } }
    ]).toArray();

    return {
      uniqueVisitors: uniqueVisitors.length,
      totalPageViews,
      topPages: topPagesAgg as Array<{ page: string; views: number }>
    };
  } catch (error) {
    console.error('Error getting analytics for range:', error);
    return {
      uniqueVisitors: 0,
      totalPageViews: 0,
      topPages: []
    };
  }
}

// Get comprehensive analytics
export async function getComprehensiveAnalytics(): Promise<AnalyticsStats> {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);

    // Get daily data for the last 7 days
    const dailyPromises = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyPromises.push(getDailyAnalytics(dateStr));
    }
    
    const [daily, weekly, monthly] = await Promise.all([
      Promise.all(dailyPromises),
      getAnalyticsForRange(weekAgo, today),
      getAnalyticsForRange(monthAgo, today)
    ]);

    return {
      daily,
      weekly,
      monthly
    };
  } catch (error) {
    console.error('Error getting comprehensive analytics:', error);
    return {
      daily: [],
      weekly: { uniqueVisitors: 0, totalPageViews: 0, topPages: [] },
      monthly: { uniqueVisitors: 0, totalPageViews: 0, topPages: [] }
    };
  }
}

// Get real-time stats for today
export async function getTodayStats(): Promise<{
  todayVisitors: number;
  todayPageViews: number;
  activePages: Array<{ page: string; views: number }>;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const stats = await getDailyAnalytics(today);
    
    return {
      todayVisitors: stats.uniqueVisitors,
      todayPageViews: stats.totalPageViews,
      activePages: stats.topPages.slice(0, 5)
    };
  } catch (error) {
    console.error('Error getting today stats:', error);
    return {
      todayVisitors: 0,
      todayPageViews: 0,
      activePages: []
    };
  }
}