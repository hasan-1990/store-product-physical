import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { recipients, message, apiKey, lineNumber } = await request.json();

    if (!recipients || !message || !apiKey || !lineNumber) {
      return NextResponse.json(
        { error: 'تمام فیلدها الزامی هستند' },
        { status: 400 }
      );
    }

    // Import smsir-js dynamically to avoid TypeScript issues
    const { Smsir } = await import('smsir-js');
    const smsir = new Smsir(apiKey, lineNumber);

    const results = [];
    const recipientsList = recipients.split('\n').filter((r: string) => r.trim());

    for (const recipient of recipientsList) {
      try {
        const result = await smsir.SendBulk(
          [recipient.trim()], // array of mobile numbers
          message,
          lineNumber
        );
        
        results.push({
          recipient: recipient.trim(),
          status: result.IsSuccessful ? 'sent' : 'failed',
          messageId: result.MessageId || null,
          result: result
        });
      } catch (error: any) {
        results.push({
          recipient: recipient.trim(),
          status: 'failed',
          error: error.message || 'خطا در ارسال'
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalSent: results.filter(r => r.status === 'sent').length,
      totalFailed: results.filter(r => r.status === 'failed').length
    });

  } catch (error: any) {
    console.error('SMS send error:', error);
    return NextResponse.json(
      { error: 'خطا در ارسال پیامک: ' + error.message },
      { status: 500 }
    );
  }
}
