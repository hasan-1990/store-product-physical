import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { isAdminRole, resolveRequestAuth } from '@/lib/resolve-request-auth';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

async function isChatbotEnabled(db: Awaited<ReturnType<typeof connectDB>>): Promise<boolean> {
  const setting = await db.chatbotSettings.findOne({ key: 'enabled' });
  const value = setting?.value;
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Chatbot API called');
    const { message, sessionId, systemPrompt: systemPromptOverride, includeProductsContext } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'پیام الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const auth = await resolveRequestAuth(request);
    const isAdmin = isAdminRole(auth?.role);

    if (!isAdmin && !(await isChatbotEnabled(db))) {
      return NextResponse.json(
        { success: false, error: 'چت‌بات در حال حاضر غیرفعال است' },
        { status: 403 }
      );
    }

    console.log('📝 User message:', message);
    console.log('✅ DB connected');
    
    const providerSetting = await db.chatbotSettings.findOne({ key: 'provider' });
    const provider = providerSetting?.value || 'gemini';
    console.log('🔧 Provider:', provider);

    // Step 1: جستجوی محصولات مرتبط از MongoDB (RAG)
    console.log('🔍 Searching relevant products...');
    const relevantProducts = await searchRelevantProducts(message);
    console.log('📦 Found products:', relevantProducts.length);

    // Step 2: ساخت context فشرده برای AI (اختیاری)
    const context = buildContext(relevantProducts);

    // Step 3: دریافت پرامپت سیستم به صورت داینامیک (از دیتابیس یا override)
    const systemPromptSetting = await db.chatbotSettings.findOne({ key: 'system_prompt' });
    const dbSystemPrompt = typeof systemPromptSetting?.value === 'string' ? systemPromptSetting.value : '';

    const baseSystemPrompt = typeof systemPromptOverride === 'string' ? systemPromptOverride : dbSystemPrompt;
    const shouldIncludeProductsContext = typeof includeProductsContext === 'boolean' ? includeProductsContext : true;

    const finalSystemPrompt = [
      baseSystemPrompt?.trim(),
      shouldIncludeProductsContext ? `محصولات مرتبط:\n${context}` : ''
    ].filter(Boolean).join('\n\n');

    let aiResponse: string;

    // Step 4: ارسال به AI بر اساس provider انتخابی
    console.log('🚀 Calling AI provider:', provider);
    if (provider === 'gemini') {
      aiResponse = await callGemini(finalSystemPrompt, message, db);
    } else if (provider === 'openai') {
      aiResponse = await callOpenAI(finalSystemPrompt, message, db);
    } else {
      throw new Error('سرویس‌دهنده AI نامعتبر است. لطفاً Gemini یا OpenAI را انتخاب کنید.');
    }
    
    console.log('✅ AI Response received');

    // Step 5: ذخیره مکالمه (اختیاری)
    if (sessionId) {
      await saveChatHistory(sessionId, message, aiResponse);
      console.log('💾 Chat history saved');
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      products: relevantProducts.map(p => ({
        _id: p._id.toString(),
        name: p.name,
        price: p.price,
        slug: p.slug
      }))
    });

  } catch (error) {
    console.error('❌ Chatbot error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        success: false, 
        error: 'خطا در پردازش درخواست',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// فراخوانی Gemini API
async function callGemini(systemPrompt: string, userMessage: string, db: any): Promise<string> {
  const apiKeySetting = await db.chatbotSettings.findOne({ key: 'gemini_api_key' });
  const apiKey = apiKeySetting?.value;

  if (!apiKey) {
    throw new Error('Gemini API Key تنظیم نشده است. لطفاً از پنل ادمین API Key را وارد کنید.');
  }

  // استفاده از جدیدترین مدل Gemini 2.5 Flash (بهینه برای سرعت و کیفیت)
  const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  
  const fullPrompt = systemPrompt?.trim()
    ? `${systemPrompt}\n\nسوال کاربر: ${userMessage}\n\nپاسخ:`
    : `سوال کاربر: ${userMessage}\n\nپاسخ:`;

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 800,
          candidateCount: 1,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || response.statusText;
      
      console.error('Gemini API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      throw new Error(`خطای Gemini API: ${errorMessage} (کد: ${response.status})`);
    }

    const data = await response.json();
    
    console.log('🔍 Gemini Response Details:', {
      finishReason: data.candidates?.[0]?.finishReason,
      safetyRatings: data.candidates?.[0]?.safetyRatings,
      hasText: !!data.candidates?.[0]?.content?.parts?.[0]?.text
    });
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini response:', JSON.stringify(data, null, 2));
      
      // بررسی اینکه آیا به دلیل safety block شده یا نه
      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        return 'متاسفم، نمی‌توانم در این مورد پاسخ دهم. لطفاً سوال خود را به شکل دیگری بپرسید.';
      }
      
      throw new Error('پاسخ نامعتبر از Gemini');
    }
    
    let responseText = data.candidates[0].content.parts[0].text.trim();
    console.log('✅ Gemini response length:', responseText.length, 'characters');
    
    // پاک کردن timestamp و اعداد اضافی از ابتدای پاسخ (مثل "۰۰:۴۶")
    responseText = responseText.replace(/^[\d۰-۹:：]+\s*/g, '');
    // پاک کردن کاراکترهای اضافی
    responseText = responseText.replace(/^\s*[-–—*•]+\s*/g, '');
    
    return responseText;
  } catch (error) {
    console.error('Gemini call failed:', error);
    throw error;
  }
}

// فراخوانی OpenAI API
async function callOpenAI(systemPrompt: string, userMessage: string, db: any): Promise<string> {
  const apiKeySetting = await db.chatbotSettings.findOne({ key: 'openai_api_key' });
  const apiKey = apiKeySetting?.value;

  if (!apiKey) {
    throw new Error('OpenAI API Key تنظیم نشده است');
  }

  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
  if (systemPrompt?.trim()) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userMessage });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 
    'متأسفانه نتوانستم پاسخ مناسبی بدهم.';
}

// جستجوی محصولات مرتبط با سوال کاربر
async function searchRelevantProducts(query: string): Promise<any[]> {
  try {
    const db = await connectDB();
    
    // استخراج کلمات کلیدی
    const keywords = query
      .toLowerCase()
      .replace(/[^\u0600-\u06FF\sa-z0-9]/g, '')
      .split(' ')
      .filter(word => word.length > 2);

    if (keywords.length === 0) {
      // اگر کلمه‌ای نبود، محصولات پرفروش را برگردان
      return await db.products
        .find({ active: true })
        .sort({ salesCount: -1 })
        .limit(2)
        .project({ name: 1, price: 1, slug: 1, categoryId: 1 })
        .toArray();
    }

    // جستجوی با regex
    const searchQuery = {
      active: true,
      $or: [
        { name: { $regex: keywords.join('|'), $options: 'i' } },
        { description: { $regex: keywords.join('|'), $options: 'i' } }
      ]
    };

    const products = await db.products
      .aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $match: {
          active: true,
          $or: [
            { name: { $regex: keywords.join('|'), $options: 'i' } },
            { description: { $regex: keywords.join('|'), $options: 'i' } },
            { 'category.name': { $regex: keywords.join('|'), $options: 'i' } }
          ]
        }},
        { $limit: 3 },
        { $project: { name: 1, price: 1, slug: 1, 'category.name': 1, description: 1 } }
      ])
      .toArray();

    return products;
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

// ساخت context برای AI
function buildContext(products: any[]): string {
  if (products.length === 0) {
    return 'هیچ محصول خاصی پیدا نشد.';
  }

  return products.map((p, index) => {
    const price = p.price?.toLocaleString('fa-IR') || 'تماس';
    const desc = p.description ? p.description.substring(0, 80) : '';
    
    return `${index + 1}. ${p.name} - ${price}ت ${desc ? '- ' + desc : ''}`;
  }).join('\n\n');
}

// ذخیره تاریخچه مکالمات
async function saveChatHistory(sessionId: string, userMessage: string, aiResponse: string) {
  try {
    const db = await connectDB();
    
    await db.chatHistory.updateOne(
      { sessionId },
      {
        $push: {
          messages: {
            timestamp: new Date(),
            user: userMessage,
            assistant: aiResponse
          }
        },
        $set: { updatedAt: new Date() }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
}
