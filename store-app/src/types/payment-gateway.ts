/**
 * Payment Gateway Types
 */

export interface PaymentGateway {
  _id?: string;
  id?: string;
  name: string;
  type: 'zarinpal' | 'zibal' | 'mellat' | 'parsian' | 'saderat' | 'crypto';
  merchantId: string; // برای ZarinPal و Zibal
  merchant?: string; // برای Zibal (نام تجاری)
  apiKey?: string; // برای Zibal (Access Token)
  active: boolean;
  commissionRate: number;
  testMode: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentSettings {
  currency: string;
  minAmount: number;
  maxAmount: number;
  autoCapture: boolean;
  enableRefund: boolean;
  refundTimeLimit: number;
}
