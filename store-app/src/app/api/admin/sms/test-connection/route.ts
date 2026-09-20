import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Log the request for debugging
    console.log('SMS test connection - Request received');
    
    const body = await request.json();
    console.log('SMS test connection - Request body:', body);
    
    const { apiKey } = body;

    if (!apiKey) {
      console.log('SMS test connection - No API key provided');
      return NextResponse.json(
        { success: false, error: 'کلید API الزامی است' },
        { status: 400 }
      );
    }

    console.log('SMS test connection - API key provided:', apiKey.substring(0, 10) + '...');

    try {
      console.log('SMS test connection - Testing API connection...');
      
      // Test API connection by getting credit (official SMS.ir endpoint)
      const response = await fetch('https://api.sms.ir/v1/credit', {
        method: 'GET',
        headers: {
          'X-API-KEY': apiKey,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      console.log('SMS test connection - API response:', result);
      
      if (response.ok && result.status === 1) {
        return NextResponse.json({
          success: true,
          credit: result.data || 0,
          message: `اتصال API موفق - اعتبار: ${result.data || 0} پیامک`
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.message || 'خطا در اتصال به API'
        }, { status: 400 });
      }

    } catch (error: any) {
      console.error('SMS test connection - API error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'خطا در اتصال به API'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('SMS test connection error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در تست اتصال: ' + error.message },
      { status: 500 }
    );
  }
}
