import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { getOrderStats, getSalesChartData } from '@/lib/db/orders';
import { countProducts, getLowStockProducts } from '@/lib/db/products';

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const [stats, chart, productCount, lowStock] = await Promise.all([
      getOrderStats(),
      getSalesChartData(),
      countProducts(),
      getLowStockProducts(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        chart,
        productCount,
        lowStock,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در دریافت آمار' },
      { status: 500 },
    );
  }
}
