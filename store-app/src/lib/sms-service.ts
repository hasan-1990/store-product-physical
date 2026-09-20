/**
 * Facade یکپارچه SMS — همه مسیرها از sms.ts استفاده می‌کنند.
 * auth routes: SMSService.sendVerificationCode(phone, code)
 * API /api/sms: import smsService from '@/lib/sms'
 */
import smsClient from './sms';

export class SMSService {
  static async sendVerificationCode(phone: string, code: string): Promise<boolean> {
    const mobile = smsClient.formatMobileNumber(phone);
    const result = await smsClient.sendVerificationCode({ mobile, code });
    return result.success;
  }

  static async sendMessage(phone: string, message: string): Promise<boolean> {
    const mobile = smsClient.formatMobileNumber(phone);
    const result = await smsClient.sendBulkSMS({ mobile, messageText: message });
    return result.success;
  }

  static async testConnection(): Promise<boolean> {
    const result = await smsClient.getCredit();
    return result.success;
  }

  static async getCredit(): Promise<{ success: boolean; credit?: number; message: string }> {
    return smsClient.getCredit();
  }

  static async getLineNumbers(): Promise<{
    success: boolean;
    lineNumbers?: string[];
    message: string;
  }> {
    return smsClient.getLineNumbers();
  }
}

export default SMSService;
