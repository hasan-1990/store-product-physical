import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'پیام الزامی است' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'کلید API Gemini تنظیم نشده است' },
        { status: 500 }
      );
    }

    // Step 1: جستجوی محصولات مرتبط از MongoDB (RAG)
    const relevantProducts = await searchRelevantProducts(message);

    // Step 2: ساخت context فشرده برای AI
    const context = buildContext(relevantProducts);

    // Step 3: ساخت prompt
    const systemPrompt = `دستیار فروش فاتمز. کمک به خرید محصولات WordPress. مودب و حرفه‌ای باش.
محصولات:
${context}`;

    const fullPrompt = `${systemPrompt}

سوال کاربر: ${message}

پاسخ کوتاه و مفید (حداکثر 100 کلمه):`;

    // Step 4: ارسال به Gemini API
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 200,
          candidateCount: 1
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      'متأسفانه نتوانستم پاسخ مناسبی بدهم. لطفاً سوال خود را دوباره مطرح کنید.';

    // Step 5: ذخیره مکالمه (اختیاری)
    if (sessionId) {
      await saveChatHistory(sessionId, message, aiResponse);
    }

    return NextResponse.json({
      success: true,
      response: aiResponse.trim(),
      products: relevantProducts.map(p => ({
        _id: p._id.toString(),
        name: p.name,
        price: p.price,
        slug: p.slug
      }))
    });

  } catch (error) {
    console.error('Chatbot error:', error);
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
        { description: { $regex: keywords.join('|'), $options: 'i' } },
        { 'category.name': { $regex: keywords.join('|'), $options: 'i' } }
      ]
    };

    const products = await db.products
      .aggregate([
        { $match: searchQuery },
        { $limit: 3 },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
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
  }).join('\n');
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
