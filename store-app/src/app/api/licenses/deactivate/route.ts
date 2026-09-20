import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import type { License } from '@/types';

/**
 * API برای غیرفعال‌سازی لایسنس
 * POST /api/licenses/deactivate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey, reason } = body;
    
    if (!licenseKey) {
      return NextResponse.json(
        { error: 'کلید لایسنس الزامی است' },
        { status: 400 }
      );
    }
    
    const db = await connectDB();
    
    const license = await db.licenses.findOne({ licenseKey }) as License | null;
    
    if (!license) {
      return NextResponse.json(
        { error: 'لایسنس یافت نشد' },
        { status: 404 }
      );
    }
    
    // غیرفعال‌سازی
    const result = await db.licenses.updateOne(
      { _id: new ObjectId(license._id) },
      {
        $set: {
          isActivated: false,
          status: 'inactive',
          notes: reason || 'غیرفعال شده توسط کاربر',
          updatedAt: new Date().toISOString(),
        }
      }
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'خطا در غیرفعال‌سازی لایسنس' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'لایسنس با موفقیت غیرفعال شد',
    });
    
  } catch (error) {
    console.error('Error deactivating license:', error);
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 }
    );
  }
}
