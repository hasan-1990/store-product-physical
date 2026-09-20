import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { createOrder, listOrders, listOrdersBySession } from '@/lib/db/orders';
import { getCartItemsForSession } from '@/lib/db/orders';
import { getCartSessionFromRequest, CART_SESSION_COOKIE, cartSessionCookieOptions } from '@/lib/session';
import { getAdminFromRequest } from '@/lib/auth';
import { getPromoDiscount } from '@/lib/db/content';
import { getCartSubtotal } from '@/lib/cart';

const createSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(10),
  customerEmail: z.string().email().optional(),
  address: z.string().min(5),
  paymentMethod: z.enum(['online', 'cod']),
  promoCode: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    const sessionId = getCartSessionFromRequest(request);

    if (admin) {
      const orders = await listOrders(50);
      return NextResponse.json({ success: true, data: orders });
    }

    if (!sessionId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const orders = await listOrdersBySession(sessionId);
    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در دریافت سفارشات' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createSchema.parse(body);
    const sessionId = getCartSessionFromRequest(request) || randomUUID();

    const cartItems = await getCartItemsForSession(sessionId);
    if (cartItems.length === 0) {
      return NextResponse.json({ success: false, error: 'سبد خرید خالی است' }, { status: 400 });
    }

    const subtotal = getCartSubtotal(
      cartItems.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        variant: item.variant,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
    );
    const discount = data.promoCode
      ? await getPromoDiscount(data.promoCode)
      : 0;
    const shippingCost = 0;
    const total = Math.max(0, subtotal + shippingCost - discount);

    const result = await createOrder({
      sessionId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      address: data.address,
      paymentMethod: data.paymentMethod,
      items: cartItems.map((item) => ({
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      subtotal,
      discount,
      shippingCost,
      total,
    });

    const response = NextResponse.json({
      success: true,
      orderNumber: result.orderNumber,
      message: 'سفارش با موفقیت ثبت شد',
    });

    if (!getCartSessionFromRequest(request)) {
      response.cookies.set(CART_SESSION_COOKIE, sessionId, cartSessionCookieOptions());
    }

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'اطلاعات سفارش نامعتبر است', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در ثبت سفارش' },
      { status: 500 },
    );
  }
}
