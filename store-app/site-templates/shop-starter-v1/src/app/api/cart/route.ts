import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import {
  getCartItemsForSession,
  addToCart,
  clearCart,
} from '@/lib/db/orders';
import { CART_SESSION_COOKIE, cartSessionCookieOptions, getCartSessionFromRequest } from '@/lib/session';

const addSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
});

function resolveSessionId(request: NextRequest): string {
  return getCartSessionFromRequest(request) || randomUUID();
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = getCartSessionFromRequest(request);
    if (!sessionId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const items = await getCartItemsForSession(sessionId);
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در دریافت سبد' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = addSchema.parse(body);
    const sessionId = resolveSessionId(request);

    await addToCart(sessionId, data.productId, data.quantity);

    const response = NextResponse.json({ success: true, message: 'به سبد اضافه شد' });
    if (!getCartSessionFromRequest(request)) {
      response.cookies.set(CART_SESSION_COOKIE, sessionId, cartSessionCookieOptions());
    }
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'داده‌های ورودی نامعتبر' }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در افزودن به سبد' },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = getCartSessionFromRequest(request);
    if (!sessionId) {
      return NextResponse.json({ success: true });
    }
    await clearCart(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در پاک کردن سبد' },
      { status: 500 },
    );
  }
}
