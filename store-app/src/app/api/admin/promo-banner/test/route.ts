import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/store-app';
if (!uri || uri === 'mongodb://localhost:27017/store-app') {
  console.warn('MongoDB URI not configured - using fallback for build');
}

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(uri as string);
  await client.connect();
  cachedClient = client;
  return client;
}

// تست اتصال به MongoDB و ایجاد دو بنر نمونه
export async function POST() {
  try {
    const client = await connectToDatabase();
    const db = client.db('store');
    const collection = db.collection('promo_banners');

    // حذف همه بنرهای قبلی
    await collection.deleteMany({});

    // ایجاد دو بنر نمونه
    const sampleBanners = [
      {
        title: 'بنر چپ تست',
        imageUrl: '/images/promo/default-banner.svg',
        linkUrl: '/products',
        isActive: true,
        description: 'این بنر چپ تست است',
        position: 'left',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'بنر راست تست',
        imageUrl: '/images/promo/default-banner.svg',
        linkUrl: '/categories',
        isActive: true,
        description: 'این بنر راست تست است',
        position: 'right',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const result = await collection.insertMany(sampleBanners);

    return NextResponse.json({
      success: true,
      message: 'دو بنر تست با موفقیت ایجاد شد',
      insertedCount: result.insertedCount,
      data: sampleBanners
    });
  } catch (error) {
    console.error('Error creating test banners:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'خطا در ایجاد بنرهای تست',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}