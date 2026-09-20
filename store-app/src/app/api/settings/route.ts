import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';
import { CacheManager, CACHE_KEYS } from '@/lib/cache-manager';

const updateSettingSchema = z.object({
  key: z.string().min(1, 'کلید الزامی است'),
  value: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
});

// GET /api/settings - Get all settings
export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const authResult = await requireAdmin();
    if (authResult instanceof Response) {
      return authResult;
    }

    const db = await connectDB();
    const settings = await db.settings.find({}).sort({ key: 1 }).toArray();

    // Convert to key-value object
    const settingsObject: Record<string, any> = {};
    settings.forEach((setting: any) => {
      let value = setting.value;
      
      try {
        switch (setting.type) {
          case 'number':
            value = parseFloat(setting.value);
            break;
          case 'boolean':
            value = setting.value === 'true';
            break;
          case 'json':
            value = JSON.parse(setting.value);
            break;
          default:
            value = setting.value;
        }
      } catch (error) {
        // If parsing fails, keep as string
        value = setting.value;
      }
      
      settingsObject[setting.key] = value;
    });

    return NextResponse.json({
      success: true,
      data: settingsObject,
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    // Check admin auth
    const authResult = await requireAdmin();
    if (authResult instanceof Response) {
      return authResult;
    }

    const body = await request.json();
    
    // Validate if body is an object with settings
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'داده‌های ورودی نامعتبر' },
        { status: 400 }
      );
    }

    // Update settings
    const db = await connectDB();
    const results = [];
    
    for (const [key, value] of Object.entries(body)) {
      let stringValue: string;
      let type: string = 'string';
      
      if (typeof value === 'number') {
        stringValue = value.toString();
        type = 'number';
      } else if (typeof value === 'boolean') {
        stringValue = value.toString();
        type = 'boolean';
      } else if (typeof value === 'object') {
        stringValue = JSON.stringify(value);
        type = 'json';
      } else {
        stringValue = String(value);
        type = 'string';
      }

      const result = await db.settings.updateOne(
        { key },
        { 
          $set: { 
            key,
            value: stringValue,
            type,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      const setting = await db.settings.findOne({ key });
      results.push(setting);
    }

    // Invalidate settings cache after updating
    await Promise.all([
      CacheManager.invalidatePattern(`${CACHE_KEYS.SETTINGS}*`),
      CacheManager.invalidatePattern(`${CACHE_KEYS.ADMIN_SETTINGS}*`)
    ]);

    return NextResponse.json({
      success: true,
      data: results,
      message: 'تنظیمات با موفقیت بروزرسانی شد',
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی تنظیمات' },
      { status: 500 }
    );
  }
}
