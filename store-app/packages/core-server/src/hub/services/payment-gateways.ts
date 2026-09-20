import type { Db } from 'mongodb';

async function getZarinpalConfig(db: Db) {
  const gateway = await db.collection('paymentGateways').findOne({ type: 'zarinpal', active: true });
  if (gateway) {
    return {
      merchantId: String(gateway.merchantId || ''),
      isSandbox: Boolean(gateway.testMode),
    };
  }
  return {
    merchantId: process.env.ZARINPAL_MERCHANT_ID || '',
    isSandbox: process.env.ZARINPAL_SANDBOX === 'true',
  };
}

async function getZibalConfig(db: Db) {
  const gateway = await db.collection('paymentGateways').findOne({ type: 'zibal', active: true });
  if (gateway) {
    return {
      merchant: String(gateway.merchant || gateway.merchantId || ''),
      apiKey: String(gateway.apiKey || ''),
    };
  }
  return {
    merchant: process.env.ZIBAL_MERCHANT || 'zibal',
    apiKey: process.env.ZIBAL_API_KEY || '',
  };
}

export async function zarinpalRequestPayment(
  db: Db,
  params: {
    amount: number;
    description: string;
    callback_url: string;
    mobile?: string;
    email?: string;
    order_id?: string;
  },
) {
  const config = await getZarinpalConfig(db);
  if (!config.merchantId) {
    return { errors: [{ code: -99, message: 'Merchant ID تنظیم نشده' }] };
  }

  const apiUrl = config.isSandbox
    ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
    : 'https://payment.zarinpal.com/pg/v4/payment/request.json';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchant_id: config.merchantId,
      amount: params.amount,
      description: params.description,
      callback_url: params.callback_url,
      metadata: { mobile: params.mobile, email: params.email, order_id: params.order_id },
    }),
  });

  return response.json();
}

export async function zarinpalVerifyPayment(db: Db, authority: string, amount: number) {
  const config = await getZarinpalConfig(db);
  const apiUrl = config.isSandbox
    ? 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
    : 'https://payment.zarinpal.com/pg/v4/payment/verify.json';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant_id: config.merchantId, authority, amount }),
  });

  return response.json();
}

export async function zarinpalPaymentUrl(db: Db, authority: string): Promise<string> {
  const config = await getZarinpalConfig(db);
  const base = config.isSandbox
    ? 'https://sandbox.zarinpal.com/pg/StartPay'
    : 'https://payment.zarinpal.com/pg/StartPay';
  return `${base}/${authority}`;
}

export async function zibalRequestPayment(
  db: Db,
  params: {
    amount: number;
    callbackUrl: string;
    description?: string;
    orderId?: string;
    mobile?: string;
    merchant?: string;
  },
) {
  const config = await getZibalConfig(db);
  const merchant = params.merchant || config.merchant;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  const response = await fetch('https://gateway.zibal.ir/v1/request', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      merchant,
      amount: params.amount,
      callbackUrl: params.callbackUrl,
      description: params.description || 'پرداخت آنلاین',
      orderId: params.orderId,
      mobile: params.mobile,
    }),
  });

  return response.json();
}

export async function zibalVerifyPayment(db: Db, trackId: number, merchant?: string) {
  const config = await getZibalConfig(db);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  const response = await fetch('https://gateway.zibal.ir/v1/verify', {
    method: 'POST',
    headers,
    body: JSON.stringify({ merchant: merchant || config.merchant, trackId }),
  });

  return response.json();
}

export function zibalPaymentUrl(trackId: number): string {
  return `https://gateway.zibal.ir/start/${trackId}`;
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || 'http://localhost:4000';
}
