import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, lineNumber } = await request.json();

    if (!apiKey || !lineNumber) {
      return NextResponse.json(
        { error: 'کلید API و شماره خط الزامی هستند' },
        { status: 400 }
      );
    }

    try {
      // Import smsir-js dynamically
      const { Smsir } = await import('smsir-js');
      const smsir = new Smsir(apiKey, lineNumber);

      const creditResult = await smsir.GetCredit();
      const lineResult = await smsir.GetLineNumbers();

      return NextResponse.json({
        success: true,
        credit: creditResult.Credit || 0,
        lineNumbers: lineResult.LineNumbers || [],
        message: 'اطلاعات حساب با موفقیت دریافت شد'
      });

    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error.message || 'خطا در دریافت اطلاعات حساب'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('SMS account info error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات حساب: ' + error.message },
      { status: 500 }
    );
  }
}
