import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const db = await connectDB();
    const settings = await db.getCollection('shipping_settings').findOne({});
    
    if (!settings) {
      // Default settings
      return NextResponse.json({
        success: true,
        data: {
          packagingCost: 5000,
          trackingEnabled: true,
          smsNotification: true,
          emailNotification: true
        }
      });
    }
    
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching shipping settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packagingCost, trackingEnabled, smsNotification, emailNotification } = body;
    
    const db = await connectDB();
    
    const result = await db.getCollection('shipping_settings').updateOne(
      {},
      {
        $set: {
          packagingCost: packagingCost || 0,
          trackingEnabled: trackingEnabled !== undefined ? trackingEnabled : true,
          smsNotification: smsNotification !== undefined ? smsNotification : true,
          emailNotification: emailNotification !== undefined ? emailNotification : true,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error saving shipping settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
