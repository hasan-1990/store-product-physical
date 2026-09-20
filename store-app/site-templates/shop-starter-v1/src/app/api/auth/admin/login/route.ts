import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getAdminFromRequest, verifyPassword, signAdminToken, adminCookieOptions, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { findAdminByEmail } from '@/lib/db/admin';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const admin = await findAdminByEmail(email);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'ایمیل یا رمز عبور اشتباه است' }, { status: 401 });
    }

    const adminDoc = admin as unknown as { _id: ObjectId; email: string; passwordHash: string; name?: string };
    const valid = await verifyPassword(password, adminDoc.passwordHash);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'ایمیل یا رمز عبور اشتباه است' }, { status: 401 });
    }

    const token = signAdminToken({
      sub: adminDoc._id.toString(),
      email: adminDoc.email,
      role: 'admin',
    });

    const response = NextResponse.json({
      success: true,
      admin: {
        name: adminDoc.name ?? 'مدیر',
        email: adminDoc.email,
      },
    });

    response.cookies.set(ADMIN_COOKIE_NAME, token, adminCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'داده‌های ورودی نامعتبر است' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'خطا در ورود' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ success: true, authenticated: true, admin });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE_NAME, '', { ...adminCookieOptions(0), maxAge: 0 });
  return response;
}
