import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!uri && process.env.NODE_ENV !== 'production') {
  console.warn('MongoDB URI not found - using dummy for build');
}

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (!uri || uri.includes('dummy')) {
    throw new Error('MongoDB URI not configured');
  }
  
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(uri as string);
  await client.connect();
  cachedClient = client;
  return client;
}

// GET - دریافت تنظیمات جایگاه بنرها
export async function GET() {
  try {
    const client = await connectToDatabase();
    const db = client.db('store');
    const collection = db.collection('banner_position_settings');

    // دریافت تنظیمات موقعیت
    const settings = await collection.findOne({ type: 'banner_position' });

    if (!settings) {
      return NextResponse.json({
        position: 'after-hero', // پیش‌فرض: بعد از hero slider
        isActive: true
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching banner position settings:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تنظیمات موقعیت بنرها' },
      { status: 500 }
    );
  }
}

// PUT - به‌روزرسانی تنظیمات موقعیت بنرها
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { position, isActive } = data;

    const validPositions = [
      'before-hero',      // قبل از Hero Slider
      'after-hero',       // بعد از Hero Slider (پیش‌فرض)
      'before-categories', // قبل از دسته‌بندی‌ها
      'after-categories',  // بعد از دسته‌بندی‌ها
      'before-products',   // قبل از محصولات ویژه
      'after-products',    // بعد از محصولات ویژه
      'before-whyus',      // قبل از بخش چرا ما
      'after-whyus'        // بعد از بخش چرا ما
    ];

    if (!validPositions.includes(position)) {
      return NextResponse.json(
        { error: 'موقعیت انتخاب شده معتبر نیست' },
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db('store');
    const collection = db.collection('banner_position_settings');

    const result = await collection.updateOne(
      { type: 'banner_position' },
      {
        $set: {
          type: 'banner_position',
          position,
          isActive: Boolean(isActive),
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: 'تنظیمات موقعیت بنرها با موفقیت به‌روزرسانی شد',
      position,
      isActive
    });
  } catch (error) {
    console.error('Error updating banner position settings:', error);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی تنظیمات موقعیت' },
      { status: 500 }
    );
  }
}