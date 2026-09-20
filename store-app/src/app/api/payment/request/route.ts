import { NextRequest, NextResponse } from 'next/server';
import { requestPayment as zarinpalRequest, getPaymentUrl as zarinpalPaymentUrl } from '@/lib/zarinpal';
import { requestPayment as zibalRequest, getPaymentUrl as zibalPaymentUrl } from '@/lib/zibal';
import { connectDB } from '@/lib/mongodb';

/**
 * API درخواست پرداخت
 * POST /api/payment/request
 * پشتیبانی از ZarinPal و Zibal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, description, mobile, email, gateway } = body;

    // اعتبارسنجی
    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, error: 'شماره سفارش و مبلغ الزامی است' },
        { status: 400 }
      );
    }

    if (amount < 1000) {
      return NextResponse.json(
        { success: false, error: 'حداقل مبلغ پرداخت 1,000 ریال است' },
        { status: 400 }
      );
    }

    // انتخاب درگاه پرداخت
    const db = await connectDB();
    let selectedGateway = gateway;

    // اگر درگاه مشخص نشده، درگاه فعال را انتخاب می‌کنیم
    if (!selectedGateway) {
      const activeGateway = await db.paymentGateways.findOne({ active: true });
      if (!activeGateway) {
        return NextResponse.json(
          { success: false, error: 'هیچ درگاه پرداخت فعالی یافت نشد' },
          { status: 500 }
        );
      }
      selectedGateway = activeGateway.type;
    }

    // URL بازگشت
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const callbackUrl = `${siteUrl}/payment/verify`;

    console.log('📤 Payment Request:', {
      orderId,
      amount,
      gateway: selectedGateway,
      callbackUrl,
    });

    let authority: string;
    let paymentUrl: string;
    let trackId: number | undefined;

    // انتخاب درگاه
    if (selectedGateway === 'zibal') {
      // درخواست پرداخت از Zibal
      const zibalConfig = await db.paymentGateways.findOne({ type: 'zibal', active: true });
      
      const paymentResponse = await zibalRequest({
        merchant: zibalConfig?.merchant || zibalConfig?.merchantId || 'zibal',
        amount,
        callbackUrl,
        description: description || `پرداخت سفارش #${orderId}`,
        orderId,
        mobile,
      });

      if (!paymentResponse.trackId) {
        return NextResponse.json(
          { 
            success: false, 
            error: paymentResponse.message || 'خطا در ایجاد درخواست پرداخت از Zibal'
          },
          { status: 500 }
        );
      }

      trackId = paymentResponse.trackId;
      authority = String(trackId); // برای سازگاری
      paymentUrl = zibalPaymentUrl(trackId);

    } else {
      // درخواست پرداخت از زرین‌پال (پیش‌فرض)
      const paymentResponse = await zarinpalRequest({
        amount,
        description: description || `پرداخت سفارش #${orderId}`,
        callback_url: callbackUrl,
        mobile,
        email,
        order_id: orderId,
      });

      if (!paymentResponse.data?.authority) {
        return NextResponse.json(
          { 
            success: false, 
            error: paymentResponse.errors?.[0]?.message || 'خطا در ایجاد درخواست پرداخت از ZarinPal'
          },
          { status: 500 }
        );
      }

      authority = paymentResponse.data.authority;
      paymentUrl = await zarinpalPaymentUrl(authority);
    }

    // ذخیره اطلاعات پرداخت در دیتابیس
    await db.payments.insertOne({
      orderId,
      authority,
      trackId,
      gateway: selectedGateway,
      amount,
      status: 'pending',
      mobile,
      email,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        authority,
        trackId,
        gateway: selectedGateway,
        paymentUrl,
        message: 'درخواست پرداخت با موفقیت ایجاد شد',
      },
    });
  } catch (error) {
    console.error('❌ Payment Request Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'خطای سرور'
      },
      { status: 500 }
    );
  }
}
