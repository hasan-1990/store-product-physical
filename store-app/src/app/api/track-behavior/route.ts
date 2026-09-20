import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { UserBehaviorEvent } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      type, 
      productId, 
      categoryId, 
      searchQuery, 
      duration, 
      userId, 
      sessionId,
      metadata 
    } = body;

    // Validation
    if (!type || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'نوع رویداد و شناسه نشست الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    
    // Create event object
    const event: UserBehaviorEvent = {
      type,
      timestamp: new Date(),
      ...(productId && { productId }),
      ...(categoryId && { categoryId }),
      ...(searchQuery && { searchQuery }),
      ...(duration && { duration }),
      ...(metadata && { metadata })
    };

    // Find or create user behavior document
    const existingBehavior = await db.userBehaviors.findOne({
      $or: [
        ...(userId ? [{ userId }] : []),
        { sessionId }
      ]
    });

    if (existingBehavior) {
      // Update existing document
      await db.userBehaviors.updateOne(
        { _id: existingBehavior._id },
        {
          $push: { events: { $each: [event], $slice: -1000 } }, // نگه‌داری آخرین 1000 رویداد
          $set: { 
            updatedAt: new Date(),
            ...(userId && { userId }) // آپدیت userId اگر کاربر لاگین کرد
          }
        }
      );
    } else {
      // Create new document
      await db.userBehaviors.insertOne({
        userId: userId || null,
        sessionId,
        events: [event],
        deviceType: getDeviceType(request),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'رفتار کاربر ذخیره شد'
    });

  } catch (error) {
    console.error('Error tracking behavior:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره رفتار کاربر' },
      { status: 500 }
    );
  }
}

// Helper function to detect device type
function getDeviceType(request: NextRequest): 'mobile' | 'desktop' | 'tablet' {
  const userAgent = request.headers.get('user-agent') || '';
  
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
}
