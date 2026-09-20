/**
 * Zibal Payment Gateway Integration
 * مستندات: https://help.zibal.ir/platform/
 * 
 * API Endpoints:
 * - Request: https://gateway.zibal.ir/v1/request
 * - Verify: https://gateway.zibal.ir/v1/verify
 * - Payment Page: https://gateway.zibal.ir/start/{trackId}
 */

import { connectDB } from './mongodb';
import { getStatusMessage } from '@/utils/zibal-messages';

const ZIBAL_API_BASE = 'https://gateway.zibal.ir/v1';
const ZIBAL_PAYMENT_URL = 'https://gateway.zibal.ir/start';

// دریافت Merchant از environment (fallback)
const ENV_MERCHANT = process.env.ZIBAL_MERCHANT || 'zibal';
const ENV_API_KEY = process.env.ZIBAL_API_KEY || '';

/**
 * Get active Zibal gateway configuration from database
 * First tries database, then falls back to environment variables
 */
async function getZibalConfig() {
  try {
    const db = await connectDB();
    const gateway = await db.paymentGateways.findOne({
      type: 'zibal',
      active: true
    });

    if (gateway) {
      console.log('✅ Using Zibal config from database');
      return {
        merchant: gateway.merchant || gateway.merchantId,
        apiKey: gateway.apiKey || '',
        source: 'database'
      };
    }

    console.log('⚠️ No active Zibal gateway in database, using environment variables');
    return {
      merchant: ENV_MERCHANT,
      apiKey: ENV_API_KEY,
      source: 'environment'
    };
  } catch (error) {
    console.warn('⚠️ Could not fetch gateway config from database, using env:', error);
    return {
      merchant: ENV_MERCHANT,
      apiKey: ENV_API_KEY,
      source: 'environment'
    };
  }
}

/**
 * درخواست پرداخت - مرحله اول
 */
export interface ZibalPaymentRequestParams {
  merchant: string; // نام تجاری (merchant)
  amount: number; // مبلغ به ریال
  callbackUrl: string; // آدرس بازگشت
  description?: string; // توضیحات تراکنش
  orderId?: string; // شناسه سفارش
  mobile?: string; // شماره موبایل
  allowedCards?: string[]; // کارت‌های مجاز
  linkToPay?: boolean; // لینک پرداخت
  sms?: boolean; // ارسال پیامک
  multiplexingInfos?: Array<{
    subMerchantId: string;
    amount: number;
    wagePayer?: 'master' | 'sub';
  }>;
}

export interface ZibalPaymentRequestResponse {
  result: number; // کد نتیجه
  message: string; // پیام
  trackId?: number; // شناسه تراکنش (در صورت موفقیت)
}

/**
 * تایید پرداخت - مرحله دوم
 */
export interface ZibalPaymentVerifyParams {
  merchant: string; // نام تجاری
  trackId: number; // شناسه تراکنش
}

export interface ZibalPaymentVerifyResponse {
  paidAt: string; // تاریخ پرداخت
  amount: number; // مبلغ
  result: number; // کد نتیجه
  status: number; // وضعیت (1: موفق و verify شده، 2: موفق و verify نشده)
  refNumber: number; // شماره مرجع
  description: string; // توضیحات
  cardNumber: string; // شماره کارت پرداخت کننده
  orderId: string; // شناسه سفارش
  message: string; // پیام
}

/**
 * درخواست پرداخت
 */
export async function requestPayment(params: ZibalPaymentRequestParams): Promise<ZibalPaymentRequestResponse> {
  try {
    // Get configuration from database first, then fallback to env
    const config = await getZibalConfig();
    const MERCHANT = params.merchant || config.merchant;
    const API_KEY = config.apiKey;

    console.log('📦 Payment config source:', config.source);

    // بررسی Merchant
    if (!MERCHANT || MERCHANT === 'zibal') {
      console.error('❌ Merchant تنظیم نشده است!');
      return {
        result: -99,
        message: 'نام تجاری (Merchant) تنظیم نشده است. لطفاً از پنل ادمین > درگاه‌های پرداخت تنظیم کنید.',
      };
    }

    console.log('🔵 Zibal Payment Request:', {
      ...params,
      merchant: MERCHANT,
    });

    const requestBody = {
      merchant: MERCHANT,
      amount: params.amount,
      callbackUrl: params.callbackUrl,
      description: params.description || 'پرداخت آنلاین',
      orderId: params.orderId,
      mobile: params.mobile,
      allowedCards: params.allowedCards,
      linkToPay: params.linkToPay,
      sms: params.sms,
      multiplexingInfos: params.multiplexingInfos
    };

    console.log('📤 Request Body:', requestBody);

    const apiUrl = `${ZIBAL_API_BASE}/request`;
    console.log('🌐 API URL:', apiUrl);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // اضافه کردن Authorization header در صورت وجود API Key
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    // بررسی HTTP Status
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      return {
        result: response.status,
        message: `خطای HTTP: ${response.status} - ${response.statusText}`,
      };
    }

    const data: ZibalPaymentRequestResponse = await response.json();
    
    console.log('🟢 Zibal Response:', JSON.stringify(data, null, 2));

    // بررسی کد نتیجه
    if (data.result !== 100 && data.result !== 1) {
      const statusInfo = getStatusMessage(data.result);
      console.error('❌ Zibal Error:', statusInfo);
      return {
        ...data,
        message: statusInfo.message + ': ' + statusInfo.description
      };
    }

    return data;

  } catch (error) {
    console.error('❌ Zibal Request Error:', error);
    return {
      result: -1,
      message: error instanceof Error ? error.message : 'خطای ناشناخته در ارتباط با درگاه پرداخت'
    };
  }
}

/**
 * تایید پرداخت
 */
export async function verifyPayment(params: ZibalPaymentVerifyParams): Promise<ZibalPaymentVerifyResponse> {
  try {
    // Get configuration from database first, then fallback to env
    const config = await getZibalConfig();
    const MERCHANT = params.merchant || config.merchant;
    const API_KEY = config.apiKey;

    console.log('📦 Verify config source:', config.source);

    console.log('🔵 Zibal Verify Request:', {
      merchant: MERCHANT,
      trackId: params.trackId
    });

    const requestBody = {
      merchant: MERCHANT,
      trackId: params.trackId
    };

    const apiUrl = `${ZIBAL_API_BASE}/verify`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // اضافه کردن Authorization header در صورت وجود API Key
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ZibalPaymentVerifyResponse = await response.json();
    
    console.log('🟢 Zibal Verify Response:', JSON.stringify(data, null, 2));

    // بررسی وضعیت تایید
    if (data.result !== 100 && data.result !== 1) {
      const statusInfo = getStatusMessage(data.result);
      console.error('❌ Verify Failed:', statusInfo);
      throw new Error(statusInfo.message + ': ' + statusInfo.description);
    }

    return data;

  } catch (error) {
    console.error('❌ Zibal Verify Error:', error);
    throw error;
  }
}

/**
 * ساخت URL صفحه پرداخت
 */
export function getPaymentUrl(trackId: number): string {
  return `${ZIBAL_PAYMENT_URL}/${trackId}`;
}

/**
 * بررسی اتصال به درگاه
 */
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getZibalConfig();
    
    if (!config.merchant || config.merchant === 'zibal') {
      return {
        success: false,
        message: 'Merchant تنظیم نشده است'
      };
    }

    // تست با یک درخواست ساده
    const testResult = await requestPayment({
      merchant: config.merchant,
      amount: 1000,
      callbackUrl: 'https://example.com/callback',
      description: 'تست اتصال'
    });

    if (testResult.result === 100 || testResult.result === 1 || testResult.trackId) {
      return {
        success: true,
        message: 'اتصال به درگاه Zibal موفق'
      };
    }

    return {
      success: false,
      message: testResult.message || 'خطا در اتصال به درگاه'
    };

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'خطای ناشناخته'
    };
  }
}
