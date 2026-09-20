import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await connectDB();
    if (!db) {
      throw new Error('Database connection failed');
    }
    
    const collection = db.getCollection('trust_badge_settings');
    
    let settings = await collection.findOne({ type: 'trustBadge' });
    
    if (!settings) {
      // تنظیمات پیش‌فرض
      const defaultSettings = {
        type: 'trustBadge',
        enabled: false,
        code: '',
        position: 'right', // 'left' or 'right'
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const insertResult = await collection.insertOne(defaultSettings);
      settings = await collection.findOne({ _id: insertResult.insertedId });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        enabled: settings?.enabled || false,
        code: settings?.code || '',
        position: settings?.position || 'right'
      }
    });
    
  } catch (error) {
    console.error('Error fetching trust badge settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { enabled, code, position } = await request.json();
    
    const db = await connectDB();
    if (!db) {
      throw new Error('Database connection failed');
    }
    
    const collection = db.getCollection('trust_badge_settings');
    
    const result = await collection.updateOne(
      { type: 'trustBadge' },
      { 
        $set: { 
          enabled: enabled !== undefined ? enabled : false,
          code: code || '',
          position: position || 'right',
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شد'
    });
    
  } catch (error) {
    console.error('Error updating trust badge settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
