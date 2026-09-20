import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل 2 کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر نیست'),
  password: z.string().min(6, 'رمز عبور باید حداقل 6 کاراکتر باشد'),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  active: z.boolean().optional(),
});

// GET /api/users - Get all users with pagination OR get single user by email
export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // اگر email داده شده، یک کاربر خاص رو برگردون با تمام اطلاعات
    if (email) {
      const user = await db.users.findOne({ email });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'کاربر یافت نشد' },
          { status: 404 }
        );
      }

      // حذف password از response
      const { password, ...userWithoutPassword } = user;

      return NextResponse.json({
        success: true,
        data: {
          ...userWithoutPassword,
          id: user._id.toString(),
        },
      });
    }

    // در غیر این صورت لیست کاربران رو برگردون
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    const [users, total] = await Promise.all([
      db.users.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .project({
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          role: 1,
          active: 1,
          createdAt: 1,
        })
        .toArray(),
      db.users.countDocuments(query),
    ]);

    // Format response
    const formattedUsers = users.map((user: any) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
      _count: {
        orders: 0, // TODO: Count actual orders
        reviews: 0, // TODO: Count actual reviews
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت کاربران' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const db = await connectDB();
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if email already exists
    const existingUser = await db.users.findOne({
      email: validatedData.email,
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'این ایمیل قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    const result = await db.users.insertOne({
      ...validatedData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true,
    });

    const user = {
      id: result.insertedId.toString(),
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      role: validatedData.role,
      active: true,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: user,
      message: 'کاربر با موفقیت ایجاد شد',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'داده‌های ورودی نامعتبر',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Users POST error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد کاربر' },
      { status: 500 }
    );
  }
}
