import { connectDB } from './mongodb';
import { validateIranianMobile, formatMobileNumber as formatMobile, cleanMobileNumber } from '../utils/mobile-validation';

interface SMSConfig {
  apiKey: string;
  lineNumber: string;
  templateIds: {
    verificationCode: number;
    orderConfirmation: number;
    passwordReset: number;
    accountActivation: number;
  };
}

interface SendBulkSMSParams {
  mobile: string;
  messageText: string;
  sendDateTime?: number; // Unix timestamp for scheduled sending
}

interface SendBulkSMSResponse extends SMSIrResponse {
  data?: {
    packId: string;
    messageIds: number[];
    cost: number;
  };
}

interface VerifyParameter {
  name: string;
  value: string;
}

interface SendVerificationCodeParams {
  mobile: string;
  code: string;
}

interface SendOrderConfirmationParams {
  mobile: string;
  orderNumber: string;
  customerName: string;
  totalAmount: string;
}

interface SendPasswordResetParams {
  mobile: string;
  resetCode: string;
  customerName: string;
}

interface SendAccountActivationParams {
  mobile: string;
  activationCode: string;
  customerName: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: number;
  message: string;
  cost?: number;
}

// SMS.ir API Response Types
interface SMSIrResponse {
  status: number;
  message: string;
  data?: any;
}

interface SMSIrVerifyResponse extends SMSIrResponse {
  data?: {
    messageId: number;
    cost: number;
  };
}

interface SMSIrCreditResponse extends SMSIrResponse {
  data?: number; // اعتبار باقی‌مانده
}

interface SMSIrLinesResponse extends SMSIrResponse {
  data?: number[]; // آرایه شماره خطوط
}

class SMSService {
  private readonly API_BASE_URL = 'https://api.sms.ir/v1';

  private async getConfig(): Promise<SMSConfig> {
    try {
      const mongodb = await connectDB();
      const settings = await mongodb.smsSettings.findOne({});
      
      if (!settings) {
        throw new Error('SMS settings not found. Please configure SMS settings first.');
      }

      return {
        apiKey: settings.apiKey,
        lineNumber: settings.lineNumber,
        templateIds: settings.templateIds
      };
    } catch (error) {
      console.error('Error loading SMS config:', error);
      throw new Error('Failed to load SMS configuration');
    }
  }

  private async makeRequest<T = SMSIrResponse>(
    endpoint: string, 
    method: 'GET' | 'POST' = 'GET', 
    body?: any
  ): Promise<T> {
    const config = await this.getConfig();
    
    if (!config.apiKey) {
      throw new Error('SMS API key not configured');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-KEY': config.apiKey
    };

    const requestOptions: RequestInit = {
      method,
      headers,
    };

    if (method === 'POST' && body) {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      console.log(`📤 SMS.ir API Request: ${method} ${endpoint}`);
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, requestOptions);
      
      const responseText = await response.text();
      console.log(`📥 SMS.ir API Response: ${response.status} - ${responseText}`);

      let result: T;
      try {
        result = JSON.parse(responseText) as T;
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      // بررسی HTTP status codes
      if (response.status === 401) {
        throw new Error('خطا در احراز هویت - API Key نامعتبر است');
      } else if (response.status === 429) {
        throw new Error('تعداد درخواست‌ها بیش از حد مجاز است');
      } else if (response.status === 500) {
        throw new Error('خطای داخلی سرور SMS.ir');
      } else if (!response.ok) {
        const errorData = result as SMSIrResponse;
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('SMS.ir API Error:', error);
      throw error;
    }
  }

  /**
   * ارسال پیامک آزاد (بدون قالب)
   */
  async sendBulkSMS({ mobile, messageText, sendDateTime }: SendBulkSMSParams): Promise<SMSResponse> {
    try {
      const config = await this.getConfig();

      if (!config.lineNumber) {
        throw new Error('Line number not configured');
      }

      const requestBody = {
        lineNumber: parseInt(config.lineNumber),
        messageText: messageText,
        mobiles: [this.formatMobileNumber(mobile)],
        sendDateTime: sendDateTime || null
      };

      const result = await this.makeRequest<SendBulkSMSResponse>('/send/bulk', 'POST', requestBody);

      return {
        success: result.status === 1,
        messageId: result.data?.messageIds?.[0],
        message: result.message,
        cost: result.data?.cost
      };
    } catch (error) {
      console.error('SMS Bulk Send Error:', error);
      return {
        success: false,
        message: `خطا در ارسال پیامک: ${error instanceof Error ? error.message : 'خطای نامشخص'}`
      };
    }
  }

  /**
   * ارسال کد تایید
   */
  async sendVerificationCode({ mobile, code }: SendVerificationCodeParams): Promise<SMSResponse> {
    try {
      const config = await this.getConfig();

      if (!config.templateIds.verificationCode) {
        throw new Error('Verification code template ID not configured');
      }

      const requestBody = {
        mobile: this.formatMobileNumber(mobile),
        templateId: config.templateIds.verificationCode,
        parameters: [
          { name: 'Code', value: code }
        ]
      };

      const result = await this.makeRequest<SMSIrVerifyResponse>('/send/verify', 'POST', requestBody);

      return {
        success: result.status === 1,
        messageId: result.data?.messageId,
        message: result.message,
        cost: result.data?.cost
      };
    } catch (error) {
      console.error('SMS Verification Code Error:', error);
      return {
        success: false,
        message: `خطا در ارسال پیامک: ${error instanceof Error ? error.message : 'خطای نامشخص'}`
      };
    }
  }

  /**
   * ارسال تایید سفارش
   */
  async sendOrderConfirmation({ mobile, orderNumber, customerName, totalAmount }: SendOrderConfirmationParams): Promise<SMSResponse> {
    try {
      const config = await this.getConfig();

      if (!config.templateIds.orderConfirmation) {
        throw new Error('Order confirmation template ID not configured');
      }

      const requestBody = {
        mobile: this.formatMobileNumber(mobile),
        templateId: config.templateIds.orderConfirmation,
        parameters: [
          { name: 'CustomerName', value: customerName },
          { name: 'OrderNumber', value: orderNumber },
          { name: 'TotalAmount', value: totalAmount }
        ]
      };

      const result = await this.makeRequest<SMSIrVerifyResponse>('/send/verify', 'POST', requestBody);

      return {
        success: result.status === 1,
        messageId: result.data?.messageId,
        message: result.message,
        cost: result.data?.cost
      };
    } catch (error) {
      console.error('SMS Order Confirmation Error:', error);
      return {
        success: false,
        message: `خطا در ارسال پیامک: ${error instanceof Error ? error.message : 'خطای نامشخص'}`
      };
    }
  }

  /**
   * ارسال کد بازیابی رمز عبور
   */
  async sendPasswordReset({ mobile, resetCode, customerName }: SendPasswordResetParams): Promise<SMSResponse> {
    try {
      const config = await this.getConfig();

      if (!config.templateIds.passwordReset) {
        throw new Error('Password reset template ID not configured');
      }

      const requestBody = {
        mobile: this.formatMobileNumber(mobile),
        templateId: config.templateIds.passwordReset,
        parameters: [
          { name: 'CustomerName', value: customerName },
          { name: 'ResetCode', value: resetCode }
        ]
      };

      const result = await this.makeRequest<SMSIrVerifyResponse>('/send/verify', 'POST', requestBody);

      return {
        success: result.status === 1,
        messageId: result.data?.messageId,
        message: result.message,
        cost: result.data?.cost
      };
    } catch (error) {
      console.error('SMS Password Reset Error:', error);
      return {
        success: false,
        message: `خطا در ارسال پیامک: ${error instanceof Error ? error.message : 'خطای نامشخص'}`
      };
    }
  }

  /**
   * ارسال کد فعال‌سازی حساب کاربری
   */
  async sendAccountActivation({ mobile, activationCode, customerName }: SendAccountActivationParams): Promise<SMSResponse> {
    try {
      const config = await this.getConfig();

      if (!config.templateIds.accountActivation) {
        throw new Error('Account activation template ID not configured');
      }

      const requestBody = {
        mobile: this.formatMobileNumber(mobile),
        templateId: config.templateIds.accountActivation,
        parameters: [
          { name: 'CustomerName', value: customerName },
          { name: 'ActivationCode', value: activationCode }
        ]
      };

      const result = await this.makeRequest<SMSIrVerifyResponse>('/send/verify', 'POST', requestBody);

      return {
        success: result.status === 1,
        messageId: result.data?.messageId,
        message: result.message,
        cost: result.data?.cost
      };
    } catch (error) {
      console.error('SMS Account Activation Error:', error);
      return {
        success: false,
        message: `خطا در ارسال پیامک: ${error instanceof Error ? error.message : 'خطای نامشخص'}`
      };
    }
  }

  /**
   * ارسال پیامک سفارشی با template دلخواه
   */
  async sendCustomTemplate(mobile: string, templateId: number, parameters: VerifyParameter[]): Promise<SMSResponse> {
    try {
      const requestBody = {
        mobile: this.formatMobileNumber(mobile),
        templateId: templateId,
        parameters: parameters
      };

      const result = await this.makeRequest<SMSIrVerifyResponse>('/send/verify', 'POST', requestBody);

      return {
        success: result.status === 1,
        messageId: result.data?.messageId,
        message: result.message,
        cost: result.data?.cost
      };
    } catch (error) {
      console.error('SMS Custom Template Error:', error);
      return {
        success: false,
        message: `خطا در ارسال پیامک: ${error instanceof Error ? error.message : 'خطای نامشخص'}`
      };
    }
  }

  /**
   * دریافت اعتبار باقی‌مانده
   */
  async getCredit(): Promise<{ success: boolean; credit?: number; message: string }> {
    try {
      const result = await this.makeRequest<SMSIrCreditResponse>('/credit');

      return {
        success: result.status === 1,
        credit: result.data,
        message: result.message,
      };
    } catch (error) {
      console.error('SMS Get Credit Error:', error);
      return {
        success: false,
        message: `خطا در دریافت اعتبار: ${error instanceof Error ? error.message : 'خطای نامشخص'}`
      };
    }
  }

  /**
   * دریافت شماره خطوط
   */
  async getLineNumbers(): Promise<{ success: boolean; lineNumbers?: string[]; message: string }> {
    try {
      const result = await this.makeRequest<SMSIrLinesResponse>('/line');

      return {
        success: result.status === 1,
        lineNumbers: result.data?.map(num => num.toString()),
        message: result.message,
      };
    } catch (error) {
      console.error('SMS Get Line Numbers Error:', error);
      return {
        success: false,
        message: `خطا در دریافت شماره خطوط: ${error instanceof Error ? error.message : 'خطای نامشخص'}`
      };
    }
  }

  /**
   * بررسی اعتبار شماره موبایل ایرانی
   */
  isValidIranianMobile(mobile: string): boolean {
    const result = validateIranianMobile(mobile, {
      allowInternational: true,
      strictOperatorCheck: false
    });
    return result.isValid;
  }

  /**
   * دریافت اطلاعات کامل شماره موبایل شامل اپراتور
   */
  getMobileInfo(mobile: string): {
    isValid: boolean;
    formatted?: string;
    operator?: string;
    error?: string;
  } {
    return validateIranianMobile(mobile);
  }

  /**
   * فرمت کردن شماره موبایل برای ارسال
   */
  formatMobileNumber(mobile: string): string {
    try {
      // استفاده از سیستم اعتبارسنجی جدید
      const validation = validateIranianMobile(mobile);
      
      if (!validation.isValid) {
        console.warn('Invalid mobile number for SMS:', mobile, validation.error);
        return mobile; // در صورت نامعتبر بودن، همان شماره را برگردان
      }
      
      // فرمت برای ارسال بین‌المللی (بدون + و با 98)
      const cleaned = cleanMobileNumber(mobile);
      return '98' + cleaned;
      
    } catch (error) {
      console.error('Error formatting mobile number:', error);
      // fallback به روش قدیمی
      const cleanNumber = mobile.replace(/\D/g, '');
      
      if (cleanNumber.startsWith('0')) {
        return '98' + cleanNumber.substring(1);
      }
      
      if (cleanNumber.startsWith('98')) {
        return cleanNumber;
      }
      
      if (cleanNumber.length === 10 && cleanNumber.startsWith('9')) {
        return '98' + cleanNumber;
      }
      
      return cleanNumber;
    }
  }
}

// Singleton instance
const smsService = new SMSService();

export default smsService;
export { SMSService };
export type { 
  SMSResponse, 
  SendVerificationCodeParams, 
  SendOrderConfirmationParams, 
  SendPasswordResetParams, 
  SendAccountActivationParams,
  VerifyParameter 
};
