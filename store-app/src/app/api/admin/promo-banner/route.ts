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

// GET - دریافت تنظیمات بنرها
export async function GET() {
  try {
    const client = await connectToDatabase();
    const db = client.db('store');
    const collection = db.collection('promo_banners');

    // دریافت بنرهای فعال
    const banners = await collection.find({ isActive: true }).sort({ position: 1 }).toArray();

    // اگر هیچ بنری وجود ندارد، پیش‌فرض‌ها را برگردان
    if (banners.length === 0) {
      return NextResponse.json({
        leftBanner: {
          id: 'default-left',
          title: '',
          imageUrl: '/images/promo/default-banner.svg',
          linkUrl: '',
          isActive: false,
          description: '',
          position: 'left'
        },
        rightBanner: {
          id: 'default-right',
          title: '',
          imageUrl: '/images/promo/default-banner.svg',
          linkUrl: '',
          isActive: false,
          description: '',
          position: 'right'
        }
      });
    }

    // تنظیم بنرهای چپ و راست
    const leftBanner = banners.find(b => b.position === 'left') || {
      id: 'default-left',
      title: '',
      imageUrl: '/images/promo/default-banner.svg',
      linkUrl: '',
      isActive: false,
      description: '',
      position: 'left'
    };

    const rightBanner = banners.find(b => b.position === 'right') || {
      id: 'default-right',
      title: '',
      imageUrl: '/images/promo/default-banner.svg',
      linkUrl: '',
      isActive: false,
      description: '',
      position: 'right'
    };

    return NextResponse.json({
      leftBanner,
      rightBanner
    });
  } catch (error) {
    console.error('Error fetching promo banners:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تنظیمات بنرها' },
      { status: 500 }
    );
  }
}

// POST - ذخیره یا به‌روزرسانی تنظیمات بنر
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { title, imageUrl, linkUrl, isActive, description } = data;

    // اعتبارسنجی ورودی
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'تصویر بنر الزامی است' },
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db('store');
    const collection = db.collection('promo_banner');

    // ابتدا همه بنرها را غیرفعال کنیم
    await collection.updateMany({}, { $set: { isActive: false } });

    // سپس بنر جدید را ذخیره کنیم
    const bannerData = {
      title: title || '',
      imageUrl,
      linkUrl: linkUrl || '',
      isActive: Boolean(isActive),
      description: description || '',
      updatedAt: new Date(),
      createdAt: new Date()
    };

    const result = await collection.insertOne(bannerData);

    return NextResponse.json({
      message: 'تنظیمات بنر با موفقیت ذخیره شد',
      id: result.insertedId,
      ...bannerData
    });
  } catch (error) {
    console.error('Error saving promo banner:', error);
    return NextResponse.json(
      { error: 'خطا در ذخیره تنظیمات بنر' },
      { status: 500 }
    );
  }
}

// PUT - به‌روزرسانی تنظیمات بنر موجود
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, title, imageUrl, linkUrl, isActive, description, position } = data;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'تصویر بنر الزامی است' },
        { status: 400 }
      );
    }

    if (!position || !['left', 'right'].includes(position)) {
      return NextResponse.json(
        { error: 'موقعیت بنر (چپ یا راست) الزامی است' },
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db('store');
    const collection = db.collection('promo_banners');

    // اگر id موجود است، بنر موجود را به‌روزرسانی کنیم
    if (id && !id.startsWith('default-')) {
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            title: title || '',
            imageUrl,
            linkUrl: linkUrl || '',
            isActive: Boolean(isActive),
            description: description || '',
            position,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'بنر یافت نشد' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'تنظیمات بنر با موفقیت به‌روزرسانی شد'
      });
    } else {
      // ابتدا بنر قبلی با همین موقعیت را حذف کنیم
      await collection.deleteMany({ position });

      // سپس بنر جدید را ذخیره کنیم
      const bannerData = {
        title: title || '',
        imageUrl,
        linkUrl: linkUrl || '',
        isActive: Boolean(isActive),
        description: description || '',
        position,
        updatedAt: new Date(),
        createdAt: new Date()
      };

      const result = await collection.insertOne(bannerData);

      return NextResponse.json({
        message: 'بنر جدید با موفقیت ایجاد شد',
        id: result.insertedId,
        ...bannerData
      });
    }
  } catch (error) {
    console.error('Error updating promo banner:', error);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی تنظیمات بنر' },
      { status: 500 }
    );
  }
}

// DELETE - حذف بنر
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const position = searchParams.get('position');

    if (!id && !position) {
      return NextResponse.json(
        { error: 'شناسه یا موقعیت بنر الزامی است' },
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db('store');
    const collection = db.collection('promo_banners');

    let result;
    if (id && !id.startsWith('default-')) {
      result = await collection.deleteOne({ _id: new ObjectId(id) });
    } else if (position) {
      result = await collection.deleteMany({ position });
    }

    if (result && result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'بنر یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'بنر با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting promo banner:', error);
    return NextResponse.json(
      { error: 'خطا در حذف بنر' },
      { status: 500 }
    );
  }
}