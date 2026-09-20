import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';

// Authentication helper
async function checkAdminAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.role?.toLowerCase() === 'admin') {
    return { authenticated: true, source: 'session' };
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        if (payload.role?.toLowerCase() === 'admin') {
          return { authenticated: true, source: 'token' };
        }
      }
    } catch (error) {
      console.error('Token decode error:', error);
    }
  }

  return { authenticated: false };
}

// POST - Add email to group
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    
    if (!authCheck.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { email, groupId } = await request.json();

    if (!email || !groupId) {
      return NextResponse.json(
        { success: false, error: 'ایمیل و شناسه گروه الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const emailListCollection = db.getCollection('emailList');
    const usersCollection = db.getCollection('users');

    // Try to update in emailList first
    let result = await emailListCollection.updateOne(
      { email },
      { $addToSet: { groups: groupId } }
    );

    // If not found in emailList, try users collection
    if (result.matchedCount === 0) {
      result = await usersCollection.updateOne(
        { email },
        { $addToSet: { groups: groupId } }
      );
    }

    // If still not found, create new entry in emailList
    if (result.matchedCount === 0) {
      await emailListCollection.insertOne({
        email,
        name: '',
        groups: [groupId],
        createdAt: new Date()
      });
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Add to group error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در افزودن به گروه' },
      { status: 500 }
    );
  }
}
