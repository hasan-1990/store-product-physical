import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const popular = searchParams.get('popular');
    const limit = searchParams.get('limit');
    const id = searchParams.get('id');

    const mongodb = await connectDB();

    // If id is provided, return single tag
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { success: false, error: 'شناسه برچسب معتبر نیست' },
          { status: 400 }
        );
      }

      const tag = await mongodb.blogTags.findOne({ _id: new ObjectId(id) });
      
      if (!tag) {
        return NextResponse.json(
          { success: false, error: 'برچسب یافت نشد' },
          { status: 404 }
        );
      }

      return NextResponse.json(tag);
    }

    let query = mongodb.blogTags.find({});

    // Sort by usage count if popular is requested
    if (popular === 'true') {
      query = query.sort({ usageCount: -1 });
    } else {
      query = query.sort({ name: 1 });
    }

    // Apply limit if specified
    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    const tags = await query.toArray();

    return NextResponse.json(tags);

  } catch (error) {
    console.error('Error fetching blog tags:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تگ‌های بلاگ' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const mongodb = await connectDB();

    // Generate slug from name if not provided
    if (!data.slug) {
      data.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    // Ensure slug is unique
    let uniqueSlug = data.slug;
    let counter = 1;
    while (await mongodb.blogTags.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${data.slug}-${counter}`;
      counter++;
    }
    data.slug = uniqueSlug;

    // Set default values
    data.usageCount = data.usageCount || 0;
    data.createdAt = new Date().toISOString();
    data.updatedAt = new Date().toISOString();

    const result = await mongodb.blogTags.insertOne(data);

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...data }
    });

  } catch (error) {
    console.error('Error creating blog tag:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد تگ بلاگ' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه برچسب معتبر نیست' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();

    // Generate slug from name if not provided
    if (!updateData.slug && updateData.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    // Set timestamps
    updateData.updatedAt = new Date().toISOString();

    const result = await mongodb.blogTags.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'برچسب یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { _id: id, ...updateData }
    });

  } catch (error) {
    console.error('Error updating blog tag:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی برچسب بلاگ' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه برچسب معتبر نیست' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();

    const result = await mongodb.blogTags.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'برچسب یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'برچسب با موفقیت حذف شد'
    });

  } catch (error) {
    console.error('Error deleting blog tag:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف برچسب بلاگ' },
      { status: 500 }
    );
  }
}