import { NextRequest, NextResponse } from 'next/server';
import smsService from '@/lib/sms';

interface SendSMSRequest {
  type: 'verification' | 'order_confirmation' | 'password_reset' | 'account_activation' | 'custom' | 'bulk';
  mobile: string;
  templateId?: number;
  messageText?: string;
  data?: {
    code?: string;
    orderNumber?: string;
    customerName?: string;
    totalAmount?: string;
    resetCode?: string;
    activationCode?: string;
    ORDER_ID?: string;
    AMOUNT?: string;
    parameters?: Array<{ name: string; value: string }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SendSMSRequest = await request.json();
    const { type, mobile, templateId, messageText, data } = body;

    // بررسی اعتبار شماره موبایل
    if (!smsService.isValidIranianMobile(mobile)) {
      return NextResponse.json({
        success: false,
        message: 'شماره موبایل نامعتبر است'
      }, { status: 400 });
    }

    // فرمت کردن شماره موبایل
    const formattedMobile = smsService.formatMobileNumber(mobile);

    let result;

    switch (type) {
      case 'verification':
        if (!data?.code) {
          return NextResponse.json({
            success: false,
            message: 'کد تایید ارائه نشده است'
          }, { status: 400 });
        }

        result = await smsService.sendVerificationCode({
          mobile: formattedMobile,
          code: data.code
        });
        break;

      case 'order_confirmation':
        if (!data?.orderNumber || !data?.customerName || !data?.totalAmount) {
          return NextResponse.json({
            success: false,
            message: 'اطلاعات سفارش ناقص است'
          }, { status: 400 });
        }

        result = await smsService.sendOrderConfirmation({
          mobile: formattedMobile,
          orderNumber: data.orderNumber,
          customerName: data.customerName,
          totalAmount: data.totalAmount
        });
        break;

      case 'password_reset':
        if (!data?.resetCode || !data?.customerName) {
          return NextResponse.json({
            success: false,
            message: 'اطلاعات بازیابی رمز عبور ناقص است'
          }, { status: 400 });
        }

        result = await smsService.sendPasswordReset({
          mobile: formattedMobile,
          resetCode: data.resetCode,
          customerName: data.customerName
        });
        break;

      case 'account_activation':
        if (!data?.activationCode || !data?.customerName) {
          return NextResponse.json({
            success: false,
            message: 'اطلاعات فعال‌سازی حساب ناقص است'
          }, { status: 400 });
        }

        result = await smsService.sendAccountActivation({
          mobile: formattedMobile,
          activationCode: data.activationCode,
          customerName: data.customerName
        });
        break;

      case 'custom':
        if (!templateId || !data?.ORDER_ID || !data?.AMOUNT) {
          return NextResponse.json({
            success: false,
            message: 'شناسه قالب یا پارامترهای قالب ارائه نشده است'
          }, { status: 400 });
        }

        const customParameters = [
          { name: 'ORDER_ID', value: data.ORDER_ID },
          { name: 'AMOUNT', value: data.AMOUNT }
        ];

        result = await smsService.sendCustomTemplate(
          formattedMobile,
          templateId,
          customParameters
        );
        break;

      case 'bulk':
        if (!messageText) {
          return NextResponse.json({
            success: false,
            message: 'متن پیامک ارائه نشده است'
          }, { status: 400 });
        }

        result = await smsService.sendBulkSMS({
          mobile: formattedMobile,
          messageText: messageText
        });
        break;

      default:
        return NextResponse.json({
          success: false,
          message: 'نوع پیامک نامعتبر است'
        }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('SMS API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'خطای داخلی سرور'
    }, { status: 500 });
  }
}

// GET method برای دریافت اطلاعات SMS
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'credit':
        const creditResult = await smsService.getCredit();
        return NextResponse.json(creditResult);

      case 'lines':
        const linesResult = await smsService.getLineNumbers();
        return NextResponse.json(linesResult);

      default:
        return NextResponse.json({
          success: false,
          message: 'عملیات نامعتبر است'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('SMS API GET Error:', error);
    return NextResponse.json({
      success: false,
      message: 'خطای داخلی سرور'
    }, { status: 500 });
  }
}
