import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectDB();
    const resolvedParams = await params;
    
    if (!ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر نامعتبر است' },
        { status: 400 }
      );
    }

    const user = await db.users.findOne(
      { _id: new ObjectId(resolvedParams.id) },
      {
        projection: {
          password: 0, // Don't return password
        },
      }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Format response
    const formattedUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      active: user.active,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _count: {
        orders: 0, // TODO: Count actual orders
        reviews: 0, // TODO: Count actual reviews
        cartItems: 0, // TODO: Count actual cart items
      },
    };

    return NextResponse.json({
      success: true,
      data: formattedUser,
    });
  } catch (error) {
    console.error('User GET error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت کاربر' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectDB();
    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    if (!ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر نامعتبر است' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.users.findOne({
      _id: new ObjectId(resolvedParams.id),
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Check email uniqueness if email is being updated
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await db.users.findOne({
        email: validatedData.email,
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'این ایمیل قبلاً ثبت شده است' },
          { status: 400 }
        );
      }
    }

    // Hash password if provided
    const updateData: any = { 
      ...validatedData,
      updatedAt: new Date(),
    };
    
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 12);
    }

    const result = await db.users.updateOne(
      { _id: new ObjectId(resolvedParams.id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'خطا در بروزرسانی کاربر' },
        { status: 500 }
      );
    }

    // Get updated user
    const updatedUser = await db.users.findOne(
      { _id: new ObjectId(resolvedParams.id) },
      { projection: { password: 0 } }
    );

    const formattedUser = {
      id: updatedUser!._id.toString(),
      name: updatedUser!.name,
      email: updatedUser!.email,
      phone: updatedUser!.phone,
      address: updatedUser!.address,
      role: updatedUser!.role,
      active: updatedUser!.active,
      avatar: updatedUser!.avatar,
      updatedAt: updatedUser!.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: formattedUser,
      message: 'کاربر با موفقیت بروزرسانی شد',
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

    console.error('User PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی کاربر' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectDB();
    const resolvedParams = await params;

    if (!ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه کاربر نامعتبر است' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.users.findOne({
      _id: new ObjectId(resolvedParams.id),
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Soft delete: set active to false
    const result = await db.users.updateOne(
      { _id: new ObjectId(resolvedParams.id) },
      { 
        $set: { 
          active: false,
          updatedAt: new Date(),
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'خطا در حذف کاربر' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'کاربر با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('User DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف کاربر' },
      { status: 500 }
    );
  }
}
