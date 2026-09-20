import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

/**
 * API endpoint to test real connection to Zarinpal
 * GET /api/payment/test-connection
 */
export async function GET(request: NextRequest) {
  // Try to get config from database first
  let merchantId: string;
  let isSandbox: boolean;
  let configSource: string;

  try {
    const db = await connectDB();
    const gateway = await db.paymentGateways.findOne({
      type: 'zarinpal',
      active: true
    });

    if (gateway) {
      merchantId = gateway.merchantId;
      isSandbox = gateway.testMode;
      configSource = 'database';
      console.log('✅ Using gateway config from database');
    } else {
      merchantId = process.env.ZARINPAL_MERCHANT_ID || '';
      isSandbox = process.env.ZARINPAL_SANDBOX === 'true';
      configSource = 'environment';
      console.log('⚠️ No active gateway in database, using environment variables');
    }
  } catch (error) {
    merchantId = process.env.ZARINPAL_MERCHANT_ID || '';
    isSandbox = process.env.ZARINPAL_SANDBOX === 'true';
    configSource = 'environment (fallback)';
    console.warn('⚠️ Database error, using environment variables:', error);
  }
  
  // Check if merchant ID is configured and not the default placeholder
  if (!merchantId || merchantId === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx') {
    return NextResponse.json({
      success: false,
      error: 'کد پذیرنده (Merchant ID) تنظیم نشده است',
      details: 'لطفاً از پنل ادمین > درگاه‌های پرداخت تنظیم کنید',
      configSource
    }, { status: 400 });
  }

  if (merchantId.length !== 36) {
    return NextResponse.json({
      success: false,
      error: 'فرمت کد پذیرنده نادرست است',
      details: 'کد پذیرنده باید 36 کاراکتر باشد (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)',
      configSource
    }, { status: 400 });
  }

  // Test actual connection to Zarinpal API
  const apiUrl = isSandbox 
    ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
    : 'https://payment.zarinpal.com/pg/v4/payment/request.json';

  try {
    console.log('🔍 Testing connection to Zarinpal...');
    console.log('📦 Config source:', configSource);
    console.log('📍 API URL:', apiUrl);
    console.log('🔑 Merchant ID:', `${merchantId.substring(0, 8)}...${merchantId.substring(28)}`);

    // Send a minimal test request to Zarinpal
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: 1000, // Minimum amount
        description: 'تست اتصال به درگاه',
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/payment/verify`,
      }),
    });

    const responseText = await response.text();
    console.log('📥 Response status:', response.status);
    console.log('📥 Response text:', responseText);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `خطای HTTP: ${response.status}`,
        details: responseText || 'سرور زرین‌پال پاسخ نداد',
        apiUrl,
        httpStatus: response.status
      }, { status: 500 });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'خطا در دریافت پاسخ از زرین‌پال',
        details: 'پاسخ سرور قابل خواندن نیست',
        rawResponse: responseText
      }, { status: 500 });
    }

    console.log('📦 Parsed data:', JSON.stringify(data, null, 2));

    // Check response code
    if (data.data?.code === 100) {
      // Success!
      return NextResponse.json({
        success: true,
        message: '✅ اتصال به درگاه زرین‌پال موفقیت‌آمیز بود',
        details: {
          merchantIdValid: true,
          apiAccessible: true,
          sandboxMode: isSandbox,
          authority: data.data.authority,
          code: data.data.code
        }
      });
    } else {
      // Zarinpal returned an error code
      const errorMessage = getZarinpalErrorMessage(data.data?.code || data.errors?.[0]?.code);
      return NextResponse.json({
        success: false,
        error: 'زرین‌پال خطا برگرداند',
        details: errorMessage,
        code: data.data?.code || data.errors?.[0]?.code,
        rawResponse: data
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Connection test error:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در اتصال به زرین‌پال',
      details: error instanceof Error ? error.message : 'خطای نامشخص',
      apiUrl
    }, { status: 500 });
  }
}

/**
 * Get Persian error message for Zarinpal error codes
 */
function getZarinpalErrorMessage(code: number | undefined): string {
  const errors: { [key: number]: string } = {
    [-1]: 'اطلاعات ارسال شده ناقص است',
    [-2]: 'IP یا Merchant ID معتبر نیست',
    [-3]: 'مبلغ باید از 1,000 ریال بیشتر باشد',
    [-4]: 'سطح پذیرنده پایین‌تر از سطح نقره‌ای است',
    [-11]: 'درخواست مورد نظر یافت نشد',
    [-12]: 'امکان ویرایش درخواست وجود ندارد',
    [-21]: 'هیچ نوع عملیات مالی برای این تراکنش یافت نشد',
    [-22]: 'تراکنش ناموفق بوده است',
    [-33]: 'رقم تراکنش با رقم پرداخت‌شده مطابقت ندارد',
    [-34]: 'سقف تقسیم تراکنش از لحاظ تعداد یا مبلغ عبور کرده است',
    [-40]: 'اجازه دسترسی به متد مورد نظر وجود ندارد',
    [-41]: 'اطلاعات ارسال شده مربوط به AdditionalData غیرمعتبر است',
    [-42]: 'مدت زمان معتبر طول عمر شناسه پرداخت باید بین 30 دقیقه تا 45 روز باشد',
    [-54]: 'درخواست آرشیو شده است',
    100: 'عملیات موفق',
    101: 'تراکنش قبلاً تایید شده است',
  };

  return errors[code || 0] || `خطای نامشخص (کد: ${code})`;
}
