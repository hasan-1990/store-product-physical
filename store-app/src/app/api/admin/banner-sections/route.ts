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

// GET - دریافت تمام بخش‌های بنر
export async function GET() {
  try {
    const client = await connectToDatabase();
    const db = client.db('store');
    const collection = db.collection('banner_sections');

    // دریافت همه بخش‌ها (فعال و غیرفعال) مرتب شده بر اساس order
    const sections = await collection.find({}).sort({ order: 1 }).toArray();

    return NextResponse.json({
      success: true,
      sections
    });
  } catch (error) {
    console.error('Error fetching banner sections:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'خطا در دریافت بخش‌های بنر' 
      },
      { status: 500 }
    );
  }
}

// POST - ایجاد بخش بنر جدید
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      name, 
      title, 
      position, 
      leftBanner, 
      rightBanner, 
      isActive, 
      order 
    } = data;

    // اعتبارسنجی ورودی
    if (!name || !position) {
      return NextResponse.json(
        { error: 'نام و موقعیت بخش الزامی است' },
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db('store');
    const collection = db.collection('banner_sections');

    // بررسی تکراری نبودن نام
    const existingSection = await collection.findOne({ name });
    if (existingSection) {
      return NextResponse.json(
        { error: 'بخشی با این نام قبلاً ایجاد شده است' },
        { status: 400 }
      );
    }

    // اگر order تعین نشده، آخرین order + 1 را قرار دهیم
    let sectionOrder = order;
    if (!sectionOrder) {
      const lastSection = await collection.findOne({}, { sort: { order: -1 } });
      sectionOrder = lastSection ? lastSection.order + 1 : 1;
    }

    const sectionData = {
      name,
      title: title || name,
      position, // 'before-hero', 'after-hero', 'after-categories', 'after-products', 'before-footer'
      leftBanner: leftBanner || {
        title: '',
        imageUrl: '',
        linkUrl: '',
        isActive: false,
        description: ''
      },
      rightBanner: rightBanner || {
        title: '',
        imageUrl: '',
        linkUrl: '',
        isActive: false,
        description: ''
      },
      isActive: Boolean(isActive),
      order: sectionOrder,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(sectionData);

    return NextResponse.json({
      success: true,
      message: 'بخش بنر جدید با موفقیت ایجاد شد',
      id: result.insertedId,
      section: sectionData
    });
  } catch (error) {
    console.error('Error creating banner section:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد بخش بنر' },
      { status: 500 }
    );
  }
}

// PUT - به‌روزرسانی بخش بنر
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      id, 
      name, 
      title, 
      position, 
      leftBanner, 
      rightBanner, 
      isActive, 
      order 
    } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه بخش الزامی است' },
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db('store');
    const collection = db.collection('banner_sections');

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          title: title || name,
          position,
          leftBanner,
          rightBanner,
          isActive: Boolean(isActive),
          order,
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
      message: 'بخش بنر با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('Error updating banner section:', error);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی بخش بنر' },
      { status: 500 }
    );
  }
}

// DELETE - حذف بخش بنر
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه بخش الزامی است' },
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db('store');
    const collection = db.collection('banner_sections');

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'بخش یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'بخش بنر با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting banner section:', error);
    return NextResponse.json(
      { error: 'خطا در حذف بخش بنر' },
      { status: 500 }
    );
  }
}