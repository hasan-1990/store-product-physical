import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!uri && process.env.NODE_ENV !== 'production') {
  console.warn('MongoDB URI not found - using dummy for build');
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

// GET - دریافت اطلاعات یک بخش بنر خاص
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه بخش الزامی است' },
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db('store');
    const collection = db.collection('banner_sections');

    const section = await collection.findOne({ _id: new ObjectId(id) });

    if (!section) {
      return NextResponse.json(
        { error: 'بخش یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      section
    });
  } catch (error) {
    console.error('Error fetching banner section:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات بخش' },
      { status: 500 }
    );
  }
}

// PUT - به‌روزرسانی بنرهای یک بخش خاص
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { bannerPosition, bannerData } = data; // 'left' یا 'right'

    if (!id || !bannerPosition || !bannerData) {
      return NextResponse.json(
        { error: 'شناسه بخش، موقعیت بنر و اطلاعات بنر الزامی است' },
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db('store');
    const collection = db.collection('banner_sections');

    const updateField = bannerPosition === 'left' ? 'leftBanner' : 'rightBanner';
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          [updateField]: bannerData,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'بخش یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `بنر ${bannerPosition === 'left' ? 'چپ' : 'راست'} با موفقیت به‌روزرسانی شد`
    });
  } catch (error) {
    console.error('Error updating banner in section:', error);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی بنر' },
      { status: 500 }
    );
  }
}