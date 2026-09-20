import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { mobile, templateId, parameters, apiKey, lineNumber } = await request.json();

    if (!mobile || !templateId || !apiKey || !lineNumber) {
      return NextResponse.json(
        { error: 'تمام فیلدها الزامی هستند' },
        { status: 400 }
      );
    }

    // Import smsir-js dynamically to avoid TypeScript issues
    const { Smsir } = await import('smsir-js');
    const smsir = new Smsir(apiKey, lineNumber);

    try {
      const result = await smsir.VerifySend(mobile, templateId, parameters);
      
      return NextResponse.json({
        success: true,
        messageId: result.MessageId || null,
        result: result,
        message: 'پیامک تایید با موفقیت ارسال شد'
      });

    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error.message || 'خطا در ارسال پیامک تایید'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('SMS verify send error:', error);
    return NextResponse.json(
      { error: 'خطا در ارسال پیامک تایید: ' + error.message },
      { status: 500 }
    );
  }
}
