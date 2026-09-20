import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'کلید API الزامی است' },
        { status: 400 }
      );
    }

    try {
      // Get line numbers using official SMS.ir endpoint
      const response = await fetch('https://api.sms.ir/v1/line', {
        method: 'GET',
        headers: {
          'X-API-KEY': apiKey,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok && result.status === 1) {
        return NextResponse.json({
          success: true,
          lineNumbers: result.data || [],
          message: 'لیست خط‌ها با موفقیت دریافت شد'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.message || 'خطا در دریافت خط‌ها'
        }, { status: 400 });
      }

    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error.message || 'خطا در دریافت خط‌ها'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('SMS get lines error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت خط‌ها: ' + error.message },
      { status: 500 }
    );
  }
}
