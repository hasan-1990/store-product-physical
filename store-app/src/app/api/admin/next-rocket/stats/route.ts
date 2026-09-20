import { NextRocket } from '@/modules/next-rocket';

/**
 * API برای دریافت آمار جامع Next Rocket
 * 
 * GET /api/admin/next-rocket/stats
 */
export async function GET() {
  try {
    const rocket = NextRocket.getInstance();
    const stats = await rocket.getStats();

    return Response.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ خطا در دریافت آمار:', error);
    return Response.json(
      { error: 'خطا در دریافت آمار' },
      { status: 500 }
    );
  }
}
