import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';

// Authentication helper
async function checkAdminAuth(request: NextRequest) {
  // First try NextAuth session
  const session = await getServerSession(authOptions);
  console.log('Session:', session);
  
  if (session?.user?.role?.toLowerCase() === 'admin') {
    return { authenticated: true, source: 'session' };
  }

  // Fallback to Bearer token
  const authHeader = request.headers.get('authorization');
  console.log('Authorization header:', authHeader);

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('Token found:', token.substring(0, 20) + '...');
    
    try {
      // Decode base64 JWT payload
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('Token payload:', payload);
        
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

// GET - Fetch all emails (from users + custom emails)
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
    
    // Get emails from users collection
    const usersCollection = db.getCollection('users');
    const users = await usersCollection.find(
      { email: { $exists: true, $ne: null } },
      { projection: { email: 1, name: 1, createdAt: 1, groups: 1 } }
    ).toArray();

    const userEmails = users.map((user: any) => ({
      email: user.email,
      name: user.name || '',
      source: 'ثبت‌نام کاربر',
      createdAt: user.createdAt || new Date(),
      groups: user.groups || []
    }));

    // Get custom emails from emailList collection
    const emailListCollection = db.getCollection('emailList');
    const customEmails = await emailListCollection.find({}).toArray();

    const customEmailsFormatted = customEmails.map((item: any) => ({
      email: item.email,
      name: item.name || '',
      source: 'افزوده دستی',
      createdAt: item.createdAt || new Date(),
      groups: item.groups || []
    }));

    // Combine and remove duplicates
    const allEmails = [...userEmails, ...customEmailsFormatted];
    const uniqueEmails = allEmails.filter((item, index, self) =>
      index === self.findIndex((t) => t.email === item.email)
    );

    // Sort by date (newest first)
    uniqueEmails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: uniqueEmails
    });

  } catch (error) {
    console.error('Email list fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری لیست ایمیل‌ها' },
      { status: 500 }
    );
  }
}

// POST - Add new email to custom list
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    
    if (!authCheck.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { email, name } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'ایمیل معتبر وارد کنید' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const emailListCollection = db.getCollection('emailList');

    // Check if email already exists
    const existing = await emailListCollection.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'این ایمیل قبلاً اضافه شده است' },
        { status: 400 }
      );
    }

    // Also check in users collection
    const usersCollection = db.getCollection('users');
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'این ایمیل متعلق به یک کاربر ثبت‌نام شده است' },
        { status: 400 }
      );
    }

    // Add to custom email list
    await emailListCollection.insertOne({
      email,
      name: name || '',
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      data: { email, name }
    });

  } catch (error) {
    console.error('Email add error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در افزودن ایمیل' },
      { status: 500 }
    );
  }
}
