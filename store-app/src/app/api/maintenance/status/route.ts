import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// GET /api/maintenance/status - بررسی وضعیت maintenance mode
export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    
    const maintenanceSettings = await db.settings.findOne({ key: 'maintenanceMode' });
    const maintenanceMode = maintenanceSettings?.value === 'true';
    
    const endTimeSettings = await db.settings.findOne({ key: 'maintenanceEndTime' });
    const titleSettings = await db.settings.findOne({ key: 'maintenanceTitle' });
    const messageSettings = await db.settings.findOne({ key: 'maintenanceMessage' });
    const contactSettings = await db.settings.findOne({ key: 'maintenanceContact' });
    
    // اگر maintenance mode فعال باشه
    if (maintenanceMode) {
      // بررسی زمان پایان
      if (endTimeSettings?.value) {
        const now = new Date().getTime();
        const endTime = new Date(endTimeSettings.value).getTime();
        
        // اگر زمان تمام شده، خودکار غیرفعال کن
        if (now >= endTime) {
          await db.settings.updateOne(
            { key: 'maintenanceMode' },
            { $set: { value: 'false', updatedAt: new Date() } }
          );
          
          const response = NextResponse.json({
            success: true,
            data: {
              maintenanceMode: false,
              expired: true,
              maintenanceEndTime: endTimeSettings?.value || null,
              maintenanceTitle: titleSettings?.value || null,
              maintenanceMessage: messageSettings?.value || null,
              maintenanceContact: contactSettings?.value || null,
            }
          });
          
          // پاک کردن cookie
          response.cookies.set('maintenance_mode', 'false', {
            maxAge: 60 * 60 * 24 * 365,
            path: '/',
            sameSite: 'lax',
            httpOnly: false
          });
          
          return response;
        }
      }
      
      // maintenance mode هنوز فعاله
      const response = NextResponse.json({
        success: true,
        data: {
          maintenanceMode: true,
          maintenanceEndTime: endTimeSettings?.value || null,
          maintenanceTitle: titleSettings?.value || null,
          maintenanceMessage: messageSettings?.value || null,
          maintenanceContact: contactSettings?.value || null,
        }
      });
      
      // تنظیم cookie
      response.cookies.set('maintenance_mode', 'true', {
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        sameSite: 'lax',
        httpOnly: false
      });
      
      return response;
    }
    
    // maintenance mode غیرفعاله
    const response = NextResponse.json({
      success: true,
      data: {
        maintenanceMode: false,
        maintenanceEndTime: endTimeSettings?.value || null,
        maintenanceTitle: titleSettings?.value || null,
        maintenanceMessage: messageSettings?.value || null,
        maintenanceContact: contactSettings?.value || null,
      }
    });
    
    // پاک کردن cookie
    response.cookies.set('maintenance_mode', 'false', {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
      httpOnly: false
    });
    
    return response;
    
  } catch (error) {
    console.error('خطا در بررسی وضعیت maintenance:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بررسی وضعیت' },
      { status: 500 }
    );
  }
}
