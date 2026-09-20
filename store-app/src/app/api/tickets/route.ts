import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import { ObjectId } from 'mongodb';
import { validateUserContent } from '@/utils';

// GET - دریافت تیکت‌های کاربر
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'توکن احراز هویت یافت نشد' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const db = await connectDB();
    
    // دریافت تیکت‌های کاربر
    const tickets = await db.tickets.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      tickets: tickets.map((ticket: any) => ({
        ...ticket,
        _id: ticket._id.toString()
      }))
    });

  } catch (error) {
    console.error('❌ خطا در دریافت تیکت‌ها:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تیکت‌ها' },
      { status: 500 }
    );
  }
}

// POST - ایجاد تیکت جدید
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'توکن احراز هویت یافت نشد' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const db = await connectDB();
    
    console.log('🔍 Decoded userId:', decoded.userId);
    
    // دریافت اطلاعات کاربر - try string ID first
    let user = await db.users.findOne({ _id: decoded.userId as any });
    
    // Fallback to ObjectId if needed
    if (!user && /^[0-9a-fA-F]{24}$/.test(decoded.userId)) {
      try {
        user = await db.users.findOne({ _id: new ObjectId(decoded.userId) });
      } catch (e) {
        console.error('❌ Invalid userId format:', decoded.userId);
      }
    }
    
    if (!user) {
      console.error('❌ User not found with id:', decoded.userId);
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }
    
    console.log('✅ User found:', user.email);

    const body = await req.json();
    const { subject, category, priority, message } = body;

    // Basic Validation
    if (!subject || !category || !priority || !message) {
      return NextResponse.json(
        { error: 'تمام فیلدها الزامی هستند' },
        { status: 400 }
      );
    }
    
    // Content Validation
    const subjectResult = validateUserContent(subject, {
      minLength: 10,
      maxLength: 200,
      allowLinks: false,
      allowEmails: false
    });
    if (!subjectResult.isValid) {
      return NextResponse.json(
        { error: `عنوان: ${subjectResult.error}` },
        { status: 400 }
      );
    }
    
    const messageResult = validateUserContent(message, {
      minLength: 20,
      maxLength: 2000,
      allowLinks: false,
      allowEmails: true
    });
    if (!messageResult.isValid) {
      return NextResponse.json(
        { error: `متن: ${messageResult.error}` },
        { status: 400 }
      );
    }

    // ساخت شماره تیکت
    console.log('🎫 Generating ticket number...');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    
    // شمارش تیکت‌های امروز
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    console.log('📅 Date range:', { todayStart: todayStart.toISOString(), todayEnd: todayEnd.toISOString() });
    
    const todayTicketsCount = await db.tickets.countDocuments({
      createdAt: { $gte: todayStart.toISOString(), $lte: todayEnd.toISOString() }
    });
    
    console.log('📊 Today tickets count:', todayTicketsCount);
    const ticketNumber = `TKT-${dateStr}-${String(todayTicketsCount + 1).padStart(4, '0')}`;
    console.log('✅ Ticket number generated:', ticketNumber);

    // ایجاد تیکت جدید
    console.log('💾 Creating new ticket...');
    const newTicket = {
      ticketNumber,
      userId: decoded.userId,
      userName: user.name || user.email,
      userEmail: user.email,
      subject,
      category,
      priority,
      status: 'open',
      messages: [
        {
          _id: new ObjectId().toString(),
          senderId: decoded.userId,
          senderName: user.name || user.email,
          senderType: 'user',
          message,
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('📝 Ticket data:', JSON.stringify(newTicket, null, 2));
    const result = await db.tickets.insertOne(newTicket);
    console.log('✅ Ticket inserted with ID:', result.insertedId);

    return NextResponse.json({
      success: true,
      message: 'تیکت با موفقیت ایجاد شد',
      ticket: {
        ...newTicket,
        _id: result.insertedId.toString()
      }
    });

  } catch (error) {
    console.error('❌ خطا در ایجاد تیکت:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد تیکت' },
      { status: 500 }
    );
  }
}
