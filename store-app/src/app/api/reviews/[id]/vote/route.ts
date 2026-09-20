import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// POST /api/reviews/[id]/vote - Vote helpful or not helpful
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { vote } = body; // 'helpful' or 'not-helpful'

    if (!['helpful', 'not-helpful'].includes(vote)) {
      return NextResponse.json(
        { success: false, error: 'نوع رای نامعتبر است' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();

    // Find review
    let review;
    try {
      review = await mongodb.reviews.findOne({ _id: new ObjectId(id) });
    } catch {
      return NextResponse.json(
        { success: false, error: 'شناسه نظر نامعتبر است' },
        { status: 400 }
      );
    }

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'نظر یافت نشد' },
        { status: 404 }
      );
    }

    // Update vote count
    const updateField = vote === 'helpful' ? 'helpfulCount' : 'notHelpfulCount';
    
    await mongodb.reviews.updateOne(
      { _id: new ObjectId(id) },
      { 
        $inc: { [updateField]: 1 },
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    // Get updated counts
    const updatedReview = await mongodb.reviews.findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      data: {
        helpfulCount: updatedReview?.helpfulCount || 0,
        notHelpfulCount: updatedReview?.notHelpfulCount || 0
      },
      message: 'رای شما ثبت شد'
    });
  } catch (error) {
    console.error('Review vote error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت رای' },
      { status: 500 }
    );
  }
}
