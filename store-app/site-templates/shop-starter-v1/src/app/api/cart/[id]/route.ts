import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateCartItemQuantity, removeCartItem } from '@/lib/db/orders';
import { getCartSessionFromRequest } from '@/lib/session';

const patchSchema = z.object({
  quantity: z.coerce.number().int().min(1),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const sessionId = getCartSessionFromRequest(request);
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'سبد خرید یافت نشد' }, { status: 400 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { quantity } = patchSchema.parse(body);

    await updateCartItemQuantity(sessionId, id, quantity);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'داده‌های ورودی نامعتبر' }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در بروزرسانی سبد' },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const sessionId = getCartSessionFromRequest(request);
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'سبد خرید یافت نشد' }, { status: 400 });
    }

    const { id } = await context.params;
    await removeCartItem(sessionId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در حذف آیتم' },
      { status: 500 },
    );
  }
}
