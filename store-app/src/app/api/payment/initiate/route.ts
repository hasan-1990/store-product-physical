import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * API برای شروع فرآیند پرداخت و هدایت به درگاه بانکی
 * 
 * این API یک درخواست پرداخت ایجاد کرده و URL درگاه بانکی را برمی‌گرداند
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, email, phone, gatewayId } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, error: 'orderId و amount الزامی هستند' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();

    // بررسی وجود سفارش
    const order = await mongodb.orders.findOne({
      _id: new ObjectId(orderId)
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'سفارش یافت نشد' },
        { status: 404 }
      );
    }

    // دریافت اطلاعات درگاه پرداخت
    const gateway = gatewayId 
      ? await mongodb.paymentGateways.findOne({ _id: new ObjectId(gatewayId) })
      : await mongodb.paymentGateways.findOne({ enabled: true });

    if (!gateway) {
      return NextResponse.json(
        { success: false, error: 'درگاه پرداخت فعالی یافت نشد' },
        { status: 404 }
      );
    }

    if (!gateway.merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID درگاه تنظیم نشده است' },
        { status: 500 }
      );
    }

    // اتصال به درگاه زرین‌پال
    console.log('💳 درخواست پرداخت زرین‌پال:', {
      orderId,
      orderNumber: order.orderNumber,
      amount,
      gateway: gateway.name,
      testMode: gateway.testMode
    });

    // تعیین URL های زرین‌پال بر اساس حالت تست یا واقعی
    const zarinpalApiUrl = gateway.testMode 
      ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
      : 'https://api.zarinpal.com/pg/v4/payment/request.json';
    
    const zarinpalPaymentUrl = gateway.testMode
      ? 'https://sandbox.zarinpal.com/pg/StartPay/'
      : 'https://www.zarinpal.com/pg/StartPay/';

    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/payment/verify`;

    // تبدیل تومان به ریال (باید عدد صحیح باشد)
    const amountInRials = Math.round(Math.round(amount) * 10);
    
    console.log('💰 محاسبه مبلغ:', {
      amountInToman: amount,
      roundedToman: Math.round(amount),
      amountInRials: amountInRials
    });

    // ارسال درخواست به زرین‌پال
    const zarinpalResponse = await fetch(zarinpalApiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        merchant_id: gateway.merchantId,
        amount: amountInRials, // مبلغ به ریال (عدد صحیح)
        callback_url: callbackUrl,
        description: `پرداخت سفارش ${order.orderNumber}`,
        metadata: {
          email: email || '',
          mobile: phone || ''
        }
      })
    });

    const zarinpalData = await zarinpalResponse.json();
    
    console.log('📡 پاسخ زرین‌پال:', zarinpalData);

    if (zarinpalData.data && zarinpalData.data.code === 100 && zarinpalData.data.authority) {
      // ذخیره authority در دیتابیس
      await mongodb.orders.updateOne(
        { _id: new ObjectId(orderId) },
        { 
          $set: { 
            paymentAuthority: zarinpalData.data.authority,
            paymentGateway: gateway.name,
            paymentInitiatedAt: new Date(),
            paymentAmount: amountInRials,
            updatedAt: new Date()
          } 
        }
      );

      // ساخت رکورد پرداخت
      await mongodb.payments.insertOne({
        orderId: new ObjectId(orderId),
        authority: zarinpalData.data.authority,
        amount: amountInRials,
        gateway: gateway.name,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const paymentUrl = `${zarinpalPaymentUrl}${zarinpalData.data.authority}`;
      
      console.log('✅ Authority دریافت شد:', zarinpalData.data.authority);
      console.log('� URL پرداخت:', paymentUrl);

      return NextResponse.json({
        success: true,
        paymentUrl: paymentUrl,
        authority: zarinpalData.data.authority,
        message: 'درخواست پرداخت ایجاد شد'
      });
    } else {
      console.error('❌ خطای زرین‌پال:', zarinpalData);
      return NextResponse.json(
        { 
          success: false, 
          error: zarinpalData.errors?.message || 'خطا در ایجاد درخواست پرداخت',
          details: zarinpalData
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Payment initiate error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد درخواست پرداخت' },
      { status: 500 }
    );
  }
}
