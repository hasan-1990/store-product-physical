/**
 * Zarinpal Payment Gateway Integration
 * مستندات: https://docs.zarinpal.com/paymentGateway/
 * 
 * API Endpoints:
 * - Request: https://payment.zarinpal.com/pg/v4/payment/request.json
 * - Verify: https://payment.zarinpal.com/pg/v4/payment/verify.json
 * - Payment Page: https://payment.zarinpal.com/pg/StartPay/{authority}
 */

import { connectDB } from './mongodb';
import { getStatusMessage } from '@/utils/zarinpal-messages';

const ZARINPAL_API_BASE = 'https://payment.zarinpal.com/pg/v4';
const ZARINPAL_PAYMENT_URL = 'https://payment.zarinpal.com/pg/StartPay';

// دریافت Merchant ID از environment (fallback)
const ENV_MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
const ENV_IS_SANDBOX = process.env.ZARINPAL_SANDBOX === 'true';

/**
 * Get active Zarinpal gateway configuration from database
 * First tries database, then falls back to environment variables
 */
async function getZarinpalConfig() {
  try {
    const db = await connectDB();
    const gateway = await db.paymentGateways.findOne({
      type: 'zarinpal',
      active: true
    });

    if (gateway) {
      console.log('✅ Using Zarinpal config from database');
      return {
        merchantId: gateway.merchantId,
        isSandbox: gateway.testMode,
        source: 'database'
      };
    }

    console.log('⚠️ No active Zarinpal gateway in database, using environment variables');
    return {
      merchantId: ENV_MERCHANT_ID,
      isSandbox: ENV_IS_SANDBOX,
      source: 'environment'
    };
  } catch (error) {
    console.warn('⚠️ Could not fetch gateway config from database, using env:', error);
    return {
      merchantId: ENV_MERCHANT_ID,
      isSandbox: ENV_IS_SANDBOX,
      source: 'environment'
    };
  }
}

/**
 * درخواست پرداخت - مرحله اول
 */
export interface PaymentRequestParams {
  amount: number; // مبلغ به ریال
  description: string; // توضیحات تراکنش
  callback_url: string; // آدرس بازگشت
  mobile?: string; // شماره موبایل (اختیاری)
  email?: string; // ایمیل (اختیاری)
  order_id?: string; // شماره سفارش (اختیاری)
  metadata?: {
    mobile?: string;
    email?: string;
    order_id?: string;
  };
}

export interface PaymentRequestResponse {
  data?: {
    code: number;
    message: string;
    authority: string;
    fee_type?: string;
    fee?: number;
  };
  errors?: Array<{
    code: number;
    message: string;
    validations?: any[];
  }>;
}

/**
 * تایید پرداخت - مرحله دوم
 */
export interface PaymentVerifyParams {
  authority: string;
  amount: number;
}

export interface PaymentVerifyResponse {
  data?: {
    code: number;
    message: string;
    card_hash?: string;
    card_pan?: string;
    ref_id?: number;
    fee_type?: string;
    fee?: number;
  };
  errors?: Array<{
    code: number;
    message: string;
    validations?: any[];
  }>;
}

/**
 * درخواست پرداخت
 */
export async function requestPayment(params: PaymentRequestParams): Promise<PaymentRequestResponse> {
  try {
    // Get configuration from database first, then fallback to env
    const config = await getZarinpalConfig();
    const MERCHANT_ID = config.merchantId;
    const IS_SANDBOX = config.isSandbox;

    console.log('📦 Payment config source:', config.source);

    // بررسی Merchant ID
    if (!MERCHANT_ID || MERCHANT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx') {
      console.error('❌ Merchant ID تنظیم نشده است!');
      return {
        errors: [{
          code: -99,
          message: 'کد پذیرنده (Merchant ID) تنظیم نشده است. لطفاً از پنل ادمین > درگاه‌های پرداخت تنظیم کنید.',
          validations: []
        }]
      };
    }

    console.log('🔵 Zarinpal Payment Request:', {
      ...params,
      merchant_id: MERCHANT_ID.substring(0, 8) + '...',
      sandbox: IS_SANDBOX
    });

    const requestBody = {
      merchant_id: MERCHANT_ID,
      amount: params.amount,
      description: params.description,
      callback_url: params.callback_url,
      metadata: params.metadata || {
        mobile: params.mobile,
        email: params.email,
        order_id: params.order_id,
      }
    };

    console.log('📤 Request Body:', {
      ...requestBody,
      merchant_id: MERCHANT_ID.substring(0, 8) + '...'
    });

    // Select API URL based on sandbox mode
    const apiUrl = IS_SANDBOX
      ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
      : 'https://payment.zarinpal.com/pg/v4/payment/request.json';

    console.log('🌐 API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // بررسی HTTP Status
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      return {
        errors: [{
          code: response.status,
          message: `خطای HTTP: ${response.status} - ${response.statusText}`,
          validations: []
        }]
      };
    }

    const data: PaymentRequestResponse = await response.json();
    
    console.log('🟢 Zarinpal Response:', JSON.stringify(data, null, 2));

    // بررسی وجود خطا در پاسخ
    if (data.errors && data.errors.length > 0) {
      console.error('❌ Zarinpal Errors:', data.errors);
      return data; // برگرداندن خطا به جای throw
    }

    // بررسی کد پاسخ
    if (data.data?.code !== 100) {
      console.error('❌ Invalid Response Code:', data.data?.code);
      return {
        errors: [{
          code: data.data?.code || -1,
          message: data.data?.message || 'کد پاسخ نامعتبر',
          validations: []
        }]
      };
    }

    // بررسی وجود Authority
    if (!data.data?.authority) {
      console.error('❌ No Authority in response');
      return {
        errors: [{
          code: -98,
          message: 'Authority دریافت نشد',
          validations: []
        }]
      };
    }

    return data;
  } catch (error) {
    console.error('❌ Zarinpal Request Error:', error);
    return {
      errors: [{
        code: -97,
        message: error instanceof Error ? error.message : 'خطای ناشناخته در ارتباط با درگاه',
        validations: []
      }]
    };
  }
}

/**
 * تایید پرداخت
 */
export async function verifyPayment(params: PaymentVerifyParams): Promise<PaymentVerifyResponse> {
  try {
    // Get configuration from database first, then fallback to env
    const config = await getZarinpalConfig();
    const MERCHANT_ID = config.merchantId;
    const IS_SANDBOX = config.isSandbox;

    console.log('📦 Payment config source:', config.source);

    // بررسی Merchant ID
    if (!MERCHANT_ID || MERCHANT_ID === 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx') {
      console.error('❌ Merchant ID تنظیم نشده است!');
      return {
        errors: [{
          code: -99,
          message: 'کد پذیرنده (Merchant ID) تنظیم نشده است. لطفاً از پنل ادمین > درگاه‌های پرداخت تنظیم کنید.',
          validations: []
        }]
      };
    }

    console.log('� Zarinpal Payment Verification:', {
      authority: params.authority,
      amount: params.amount,
      merchant_id: MERCHANT_ID.substring(0, 8) + '...',
      sandbox: IS_SANDBOX
    });

    const requestBody = {
      merchant_id: MERCHANT_ID,
      authority: params.authority,
      amount: params.amount,
    };

    // Select API URL based on sandbox mode
    const apiUrl = IS_SANDBOX
      ? 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
      : 'https://payment.zarinpal.com/pg/v4/payment/verify.json';

    console.log('🌐 API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // بررسی HTTP Status
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      return {
        errors: [{
          code: response.status,
          message: `خطای HTTP: ${response.status} - ${response.statusText}`,
          validations: []
        }]
      };
    }

    const data: PaymentVerifyResponse = await response.json();
    
    console.log('🟢 Zarinpal Verification Response:', JSON.stringify(data, null, 2));

    // بررسی وجود خطا در پاسخ
    if (data.errors && data.errors.length > 0) {
      console.error('❌ Zarinpal Verification Errors:', data.errors);
      return data; // برگرداندن خطا به جای throw
    }

    // بررسی کد پاسخ (100 یا 101 موفق هستند)
    if (data.data?.code !== 100 && data.data?.code !== 101) {
      console.error('❌ Invalid Response Code:', data.data?.code);
      return {
        errors: [{
          code: data.data?.code || -1,
          message: getStatusMessage(data.data?.code || -1),
          validations: []
        }]
      };
    }

    return data;
  } catch (error) {
    console.error('❌ Zarinpal Verification Error:', error);
    return {
      errors: [{
        code: -97,
        message: error instanceof Error ? error.message : 'خطای ناشناخته در تایید پرداخت',
        validations: []
      }]
    };
  }
}

/**
 * ساخت URL پرداخت
 * Sandbox: https://sandbox.zarinpal.com/pg/StartPay/{authority}
 * Production: https://payment.zarinpal.com/pg/StartPay/{authority}
 */
export async function getPaymentUrl(authority: string): Promise<string> {
  const config = await getZarinpalConfig();
  if (config.isSandbox) {
    return `https://sandbox.zarinpal.com/pg/StartPay/${authority}`;
  }
  return `${ZARINPAL_PAYMENT_URL}/${authority}`;
}

// Export getStatusMessage from utility file
export { getStatusMessage };

const zarinpalService = {
  requestPayment,
  verifyPayment,
  getPaymentUrl,
  getStatusMessage,
};

export default zarinpalService;
