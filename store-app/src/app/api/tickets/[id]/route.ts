import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import { ObjectId } from 'mongodb';

// GET - دریافت جزئیات یک تیکت
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'توکن احراز هویت یافت نشد' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const { id } = await params;
    const db = await connectDB();
    
    // Try string ID first (most common in this DB)
    let ticket = await db.tickets.findOne({ _id: id as any });
    
    // If not found, try ObjectId format
    if (!ticket && /^[0-9a-fA-F]{24}$/.test(id)) {
      ticket = await db.tickets.findOne({ _id: new ObjectId(id) });
    }

    if (!ticket) {
      return NextResponse.json({ error: 'تیکت یافت نشد' }, { status: 404 });
    }

    // بررسی دسترسی
    if (ticket.userId !== decoded.userId && decoded.role !== 'admin') {
      return NextResponse.json({ error: 'شما دسترسی به این تیکت ندارید' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        _id: typeof ticket._id === 'string' ? ticket._id : ticket._id.toString()
      }
    });

  } catch (error) {
    console.error('❌ خطا در دریافت تیکت:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تیکت' },
      { status: 500 }
    );
  }
}

// POST - اضافه کردن پیام به تیکت
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'توکن احراز هویت یافت نشد' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const { id } = await params;
    const db = await connectDB();
    
    console.log('🔍 جستجوی تیکت با ID:', id);
    
    // Try multiple formats
    let ticket = null;
    
    // 1. Try as string ID
    ticket = await db.tickets.findOne({ _id: id as any });
    console.log('📌 نتیجه جستجو (string):', ticket ? 'یافت شد' : 'نه');
    
    // 2. Try as ObjectId if valid hex
    if (!ticket && /^[0-9a-fA-F]{24}$/.test(id)) {
      ticket = await db.tickets.findOne({ _id: new ObjectId(id) as any });
      console.log('📌 نتیجه جستجو (ObjectId):', ticket ? 'یافت شد' : 'نه');
    }
    
    // 3. Try by ticketNumber
    if (!ticket) {
      ticket = await db.tickets.findOne({ ticketNumber: id } as any);
      console.log('📌 نتیجه جستجو (ticketNumber):', ticket ? 'یافت شد' : 'نه');
    }

    if (!ticket) {
      console.error('❌ تیکت یافت نشد با هیچ روشی. ID:', id);
      return NextResponse.json({ error: 'تیکت یافت نشد' }, { status: 404 });
    }

    console.log('✅ تیکت پیدا شد:', {
      _id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      messagesCount: ticket.messages?.length || 0
    });

    // بررسی دسترسی
    if (ticket.userId !== decoded.userId && decoded.role !== 'admin') {
      console.error('⛔ دسترسی غیرمجاز:', { userId: decoded.userId, ticketUserId: ticket.userId, role: decoded.role });
      return NextResponse.json({ error: 'شما دسترسی به این تیکت ندارید' }, { status: 403 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'پیام نمی‌تواند خالی باشد' }, { status: 400 });
    }

    // دریافت اطلاعات کاربر
    let user = await db.users.findOne({ _id: decoded.userId as any });
    if (!user && /^[0-9a-fA-F]{24}$/.test(decoded.userId)) {
      user = await db.users.findOne({ _id: new ObjectId(decoded.userId) });
    }

    const newMessage = {
      _id: new ObjectId().toString(),
      senderId: decoded.userId,
      senderName: user?.name || user?.email || 'کاربر',
      senderType: decoded.role === 'admin' ? 'admin' : 'user',
      message,
      createdAt: new Date().toISOString()
    };

    // بروزرسانی تیکت
    let newStatus = ticket.status;
    if (decoded.role === 'admin' && ticket.status === 'open') {
      newStatus = 'answered';
    } else if (decoded.role !== 'admin' && ticket.status === 'answered') {
      newStatus = 'in_progress';
    }

    console.log('📝 اطلاعات پیام جدید:', {
      ticketId: id,
      messageId: newMessage._id,
      senderType: newMessage.senderType,
      messageLength: message.length
    });

    // Use the actual _id from the found ticket
    const ticketId = ticket._id;
    console.log('🔧 استفاده از _id برای بروزرسانی:', ticketId);

    const updateResult = await db.tickets.updateOne(
      { _id: ticketId as any },
      {
        $push: { messages: newMessage } as any,
        $set: {
          status: newStatus,
          updatedAt: new Date().toISOString()
        }
      }
    );

    console.log('✅ نتیجه بروزرسانی:', {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      acknowledged: updateResult.acknowledged
    });

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'تیکت برای بروزرسانی یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'پیام با موفقیت ارسال شد',
      newMessage,
      updateResult: {
        matched: updateResult.matchedCount,
        modified: updateResult.modifiedCount
      }
    });

  } catch (error) {
    console.error('❌ خطا در ارسال پیام:', error);
    return NextResponse.json(
      { error: 'خطا در ارسال پیام' },
      { status: 500 }
    );
  }
}

// PATCH - بروزرسانی وضعیت تیکت
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'توکن احراز هویت یافت نشد' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const db = await connectDB();
    
    let ticket = await db.tickets.findOne({ _id: id as any });
    if (!ticket && /^[0-9a-fA-F]{24}$/.test(id)) {
      ticket = await db.tickets.findOne({ _id: new ObjectId(id) });
    }

    if (!ticket) {
      return NextResponse.json({ error: 'تیکت یافت نشد' }, { status: 404 });
    }

    // بررسی دسترسی
    if (ticket.userId !== decoded.userId && decoded.role !== 'admin') {
      return NextResponse.json({ error: 'شما دسترسی به این تیکت ندارید' }, { status: 403 });
    }

    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (status === 'closed') {
      updateData.closedAt = new Date().toISOString();
    }

    await db.tickets.updateOne(
      { _id: id as any },
      { $set: updateData }
    );

    return NextResponse.json({
      success: true,
      message: 'وضعیت تیکت بروزرسانی شد'
    });

  } catch (error) {
    console.error('❌ خطا در بروزرسانی تیکت:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی تیکت' },
      { status: 500 }
    );
  }
}
