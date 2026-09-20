import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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

// GET - Fetch all groups
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    
    if (!authCheck.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const db = await connectDB();
    const groupsCollection = db.getCollection('emailGroups');
    const groups = await groupsCollection.find({}).toArray();

    return NextResponse.json({
      success: true,
      data: groups
    });

  } catch (error) {
    console.error('Groups fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری گروه‌ها' },
      { status: 500 }
    );
  }
}

// POST - Create new group
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    
    if (!authCheck.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'نام گروه الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const groupsCollection = db.getCollection('emailGroups');

    // Check if group name already exists
    const existing = await groupsCollection.findOne({ name });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'این نام گروه قبلاً استفاده شده است' },
        { status: 400 }
      );
    }

    const result = await groupsCollection.insertOne({
      name,
      description: description || '',
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        name,
        description
      }
    });

  } catch (error) {
    console.error('Group create error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد گروه' },
      { status: 500 }
    );
  }
}

// DELETE - Delete group
export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    
    if (!authCheck.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('id');

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'شناسه گروه الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const groupsCollection = db.getCollection('emailGroups');
    const emailListCollection = db.getCollection('emailList');

    // Delete group
    await groupsCollection.deleteOne({ _id: new ObjectId(groupId) });

    // Remove group from all emails
    await emailListCollection.updateMany(
      { groups: groupId },
      { $pull: { groups: groupId } as any }
    );

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Group delete error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف گروه' },
      { status: 500 }
    );
  }
}
