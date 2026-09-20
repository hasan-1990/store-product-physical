import { NextRequest, NextResponse } from 'next/server';

// Mock cart API for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('درخواست افزودن به سبد خرید:', body);

    // شبیه‌سازی موفقیت
    await new Promise(resolve => setTimeout(resolve, 1000)); // تاخیر ۱ ثانیه

    return NextResponse.json({
      success: true,
      message: 'محصول با موفقیت به سبد خرید اضافه شد (تست)',
      data: {
        productId: body.productId,
        quantity: body.quantity,
        sessionId: body.sessionId
      }
    });

  } catch (error) {
    console.error('خطا در mock cart API:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در سرور (تست)' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: [],
    message: 'سبد خرید خالی است (تست)'
  });
}
