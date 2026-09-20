import { NextRequest, NextResponse } from 'next/server';
import { mongodb, connectDB } from '@/lib/mongodb';
import { CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/cache-manager';

// GET /api/admin/settings - Get all settings (with Redis cache)
export async function GET() {
  try {
    // Try to get from cache first
    const cachedSettings = await CacheManager.getSettings('all');
    if (cachedSettings) {
      console.log('⚡ Settings served from cache');
      return NextResponse.json({
        success: true,
        data: cachedSettings,
        source: 'cache'
      });
    }

    // Cache miss - fetch from database
    console.log('🔄 Fetching settings from database');
    const db = await connectDB();
    const settings = await db.settings.find({}).toArray();
    
    // Convert to key-value object for easier frontend usage
    const settingsObj = settings.reduce((acc, setting) => {
      let value: any = setting.value;
      
      // Parse based on type
      if (setting.type === 'boolean') {
        value = setting.value === 'true';
      } else if (setting.type === 'number') {
        value = parseFloat(setting.value);
      } else if (setting.type === 'json') {
        try {
          value = JSON.parse(setting.value);
        } catch {
          value = setting.value;
        }
      }
      
      acc[setting.key] = value;
      return acc;
    }, {} as Record<string, any>);

    // Store in cache for next time
    await CacheManager.setSettings('all', settingsObj);

    return NextResponse.json({
      success: true,
      data: settingsObj,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update multiple settings (with cache invalidation)
export async function PUT(request: NextRequest) {
  try {
    const db = await connectDB();
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'تنظیمات نامعتبر' },
        { status: 400 }
      );
    }

    // Update or create each setting
    const settingsUpdates = Object.entries(settings).map(async ([key, value]) => {
      let stringValue = String(value);
      let type = 'string';

      if (typeof value === 'boolean') {
        type = 'boolean';
        stringValue = value.toString();
      } else if (typeof value === 'number') {
        type = 'number';
        stringValue = value.toString();
      } else if (typeof value === 'object') {
        type = 'json';
        stringValue = JSON.stringify(value);
      }

      return db.settings.updateOne(
        { key },
        { 
          $set: { 
            value: stringValue, 
            type,
            updatedAt: new Date()
          } 
        },
        { upsert: true }
      );
    });

    await Promise.all(settingsUpdates);

    // Invalidate cache after updating
    await CacheManager.invalidateSettings('all');
    console.log('🧹 Settings cache invalidated after update');

    // اگر maintenanceMode تغییر کرده، cookie رو هم آپدیت کن
    const response = NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت بروزرسانی شد'
    });

    if (settings.maintenanceMode !== undefined) {
      response.cookies.set('maintenance_mode', settings.maintenanceMode.toString(), {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
        sameSite: 'lax',
        httpOnly: false // کاربران باید بتونن ببینن
      });
    }

    return response;
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی تنظیمات' },
      { status: 500 }
    );
  }
}
