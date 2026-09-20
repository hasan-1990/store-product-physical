import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const approved = searchParams.get('approved');

    const mongodb = await connectDB();

    // Build filter
    const filter: any = {};
    if (postId) {
      filter.postId = postId;
    }
    if (approved !== null) {
      filter.approved = approved === 'true';
    }

    const comments = await mongodb.blogComments
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: comments
    });

  } catch (error) {
    console.error('Error fetching blog comments:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت نظرات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const mongodb = await connectDB();

    // Validate required fields
    if (!data.postId || !data.name || !data.email || !data.content) {
      return NextResponse.json(
        { success: false, error: 'تمام فیلدهای مورد نیاز باید پر شوند' },
        { status: 400 }
      );
    }

    // Set default values
    data.approved = false; // Comments need approval by default
    data.createdAt = new Date().toISOString();
    data.updatedAt = new Date().toISOString();

    const result = await mongodb.blogComments.insertOne(data);

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...data },
      message: 'نظر شما ثبت شد و پس از تایید نمایش داده خواهد شد'
    });

  } catch (error) {
    console.error('Error creating blog comment:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت نظر' },
      { status: 500 }
    );
  }
}