import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import { ObjectId } from 'mongodb';

// DELETE - حذف محصول از لیست علاقه‌مندی‌ها
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    console.log('🗑️ DELETE /api/user/wishlist - Received id:', id, 'Type:', typeof id);

    const db = await connectDB();

    // Check if id is a valid ObjectId (wishlistId) or productId
    let result;
    
    if (ObjectId.isValid(id)) {
      // Try to delete by _id (wishlistId) first
      result = await db.wishlist.deleteOne({
        _id: new ObjectId(id),
        userId: decoded.userId
      });
      
      // If not found, try to delete by productId
      if (result.deletedCount === 0) {
        result = await db.wishlist.deleteOne({
          productId: new ObjectId(id),
          userId: decoded.userId
        });
      }
    } else {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    if (result.deletedCount === 0) {
      console.log('❌ Wishlist item not found for id:', id, 'userId:', decoded.userId);
      return NextResponse.json({ error: 'Wishlist item not found' }, { status: 404 });
    }
    
    console.log('✅ Deleted wishlist item for id:', id);

    return NextResponse.json({
      success: true,
      message: 'محصول از لیست علاقه‌مندی‌ها حذف شد'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
