import { NextRequest, NextResponse } from 'next/server';

import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
  const db = await connectDB();
  const collection = db.moduleSettings;
    
    let moduleSettings = await collection.findOne({ type: 'moduleSettings' });
    
    if (!moduleSettings) {
      // ایجاد تنظیمات پیش‌فرض
      const defaultSettings = {
        type: 'moduleSettings',
        modules: {
          security: { 
            enabled: true, 
            name: 'مدیریت امنیت', 
            href: '/admin/security',
            icon: '🛡️',
            description: 'تنظیمات امنیتی، لاگ‌ها و نظارت بر سیستم',
            color: 'from-red-500 to-pink-600'
          },
          seo: { enabled: true, name: 'سئو و بهینه‌سازی', href: '/admin/seo' },
          analytics: { enabled: true, name: 'آمار و تحلیل', href: '/admin/analytics' },
          cache: { enabled: true, name: 'مدیریت کش Redis', href: '/admin/cache' },
          content: { enabled: true, name: 'مدیریت محتوا', href: '/admin/content' },
          blog: { enabled: true, name: 'بلاگ', href: '/admin/blog' },
          sms: { enabled: false, name: 'پیامک', href: '/admin/sms' },
          settings: { enabled: true, name: 'تنظیمات', href: '/admin/settings' },
          shipping: { enabled: true, name: 'حمل و نقل', href: '/admin/shipping' },
          paymentGateway: { enabled: true, name: 'درگاه پرداخت', href: '/admin/payment-gateway' },
          trustBadge: { 
            enabled: true, 
            name: 'نماد اعتماد', 
            href: '/admin/trust-badge',
            icon: '✅',
            description: 'مدیریت نمایش نماد اعتماد الکترونیکی در فوتر',
            color: 'from-green-500 to-emerald-600'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
  const insertResult = await collection.insertOne(defaultSettings);
  moduleSettings = await collection.findOne({ _id: insertResult.insertedId });
    }
    
    return NextResponse.json({
      success: true,
      modules: moduleSettings?.modules || {}
    });
    
  } catch (error) {
    console.error('Error fetching module settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch module settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, moduleKey, enabled } = await request.json();
    
    if (action !== 'toggle') {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
    
  const db = await connectDB();
  const collection = db.moduleSettings;
    
    const result = await collection.updateOne(
      { type: 'moduleSettings' },
      { 
        $set: { 
          [`modules.${moduleKey}.enabled`]: enabled,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Module status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating module settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update module settings' },
      { status: 500 }
    );
  }
}