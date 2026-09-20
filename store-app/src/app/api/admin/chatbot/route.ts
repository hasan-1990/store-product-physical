import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('dateFilter') || 'all';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const db = await connectDB();
    
    // Build date filter query
    let dateQuery = {};
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        dateQuery = { timestamp: { $gte: startOfDay } };
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateQuery = { timestamp: { $gte: weekAgo } };
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateQuery = { timestamp: { $gte: monthAgo } };
        break;
    }

    // Fetch messages
    const messages = await db.chatHistory
      .find(dateQuery)
      .sort({ timestamp: sortOrder === 'desc' ? -1 : 1 })
      .limit(500)
      .toArray();

    // Calculate stats
    const totalMessages = messages.length;
    const sessions = new Set(messages.map((m: any) => m.sessionId));
    const totalConversations = sessions.size;
    const averageMessagesPerSession = totalConversations > 0 
      ? totalMessages / totalConversations 
      : 0;

    // Count today's activity
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const recentActivity = messages.filter((m: any) => 
      new Date(m.timestamp) >= startOfToday
    ).length;

    // Extract top products from messages
    const productCounts: Record<string, number> = {};
    messages.forEach((msg: any) => {
      if (msg.products && Array.isArray(msg.products)) {
        msg.products.forEach((product: any) => {
          const name = product.name || 'نامشخص';
          productCounts[name] = (productCounts[name] || 0) + 1;
        });
      }
    });

    const topProducts = Object.entries(productCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const stats = {
      totalMessages,
      totalConversations,
      averageMessagesPerSession,
      recentActivity,
      topProducts
    };

    return NextResponse.json({
      success: true,
      messages,
      stats
    });

  } catch (error) {
    console.error('Error fetching chatbot data:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { days } = body;

    if (!days || days < 1) {
      return NextResponse.json(
        { success: false, error: 'تعداد روز نامعتبر است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await db.chatHistory.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting old messages:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف پیام‌ها' },
      { status: 500 }
    );
  }
}
