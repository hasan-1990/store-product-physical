import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminFromRequest } from '@/lib/auth';
import { listOrders, updateOrderStatus } from '@/lib/db/orders';

const patchSchema = z.object({
  orderNumber: z.string(),
  status: z.enum(['processing', 'shipped', 'cancelled', 'delivered']),
});

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const limit = Number(request.nextUrl.searchParams.get('limit') || 50);
    const orders = await listOrders(limit);
    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در دریافت سفارشات' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const body = await request.json();
    const { orderNumber, status } = patchSchema.parse(body);
    await updateOrderStatus(orderNumber, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'داده‌های ورودی نامعتبر' }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در بروزرسانی سفارش' },
      { status: 500 },
    );
  }
}
