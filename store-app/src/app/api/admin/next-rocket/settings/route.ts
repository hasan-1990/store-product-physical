/**
 * Next Rocket API - Settings
 * API مدیریت تنظیمات
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { NextRocketSettings } from '@/modules/next-rocket/types';
import { DEFAULT_SETTINGS } from '@/modules/next-rocket/config';

/**
 * GET - دریافت تنظیمات
 */
export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    const collection = db.nextRocketSettings;

    let settings = await collection.findOne({ key: 'main' }) as any;

    if (!settings) {
      // ایجاد تنظیمات پیش‌فرض
      const settingsDoc = { key: 'main', ...DEFAULT_SETTINGS } as any;
      await collection.insertOne(settingsDoc);
      settings = settingsDoc;
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('❌ خطا در دریافت تنظیمات Next Rocket:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT - آپدیت تنظیمات
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'تنظیمات ارسال نشده' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const collection = db.nextRocketSettings;

    // حذف فیلدهای MongoDB (_id, key) که نباید update شوند
    const { _id, key, ...settingsToUpdate } = settings as any;

    await collection.updateOne(
      { key: 'main' },
      { $set: { ...settingsToUpdate, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شد',
    });
  } catch (error: any) {
    console.error('❌ خطا در آپدیت تنظیمات Next Rocket:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - ریست به تنظیمات پیش‌فرض
 */
export async function POST(request: NextRequest) {
  try {
    const db = await connectDB();
    const collection = db.nextRocketSettings;

    await collection.updateOne(
      { key: 'main' },
      { $set: { ...DEFAULT_SETTINGS, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'تنظیمات به حالت پیش‌فرض بازگشت',
      settings: DEFAULT_SETTINGS,
    });
  } catch (error: any) {
    console.error('❌ خطا در ریست تنظیمات Next Rocket:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
