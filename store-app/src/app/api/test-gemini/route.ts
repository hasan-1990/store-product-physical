import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await connectDB();
    const apiKeySetting = await db.chatbotSettings.findOne({ key: 'gemini_api_key' });
    const apiKey = apiKeySetting?.value;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API Key یافت نشد',
        hint: 'لطفاً از پنل ادمین → تنظیمات API → Gemini، API Key را وارد کنید'
      });
    }

    // تست ساده با Gemini
    const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'سلام' }] }],
        generationConfig: {
          maxOutputTokens: 50,
        }
      }),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }

      return NextResponse.json({
        success: false,
        error: `خطای Gemini API (${response.status})`,
        details: errorData,
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        hint: response.status === 400 
          ? 'API Key نامعتبر است. لطفاً یک API Key جدید از https://aistudio.google.com/app/apikey دریافت کنید'
          : response.status === 429
          ? 'محدودیت درخواست. لطفاً چند دقیقه صبر کنید یا API Key دیگری استفاده کنید'
          : 'خطای ناشناخته'
      }, { status: response.status });
    }

    const data = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      message: '✅ API Key معتبر است!',
      response: data.candidates?.[0]?.content?.parts?.[0]?.text || 'پاسخ دریافت شد',
      apiKeyPrefix: apiKey.substring(0, 10) + '...'
    });

  } catch (error) {
    console.error('Test Gemini error:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در تست',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
