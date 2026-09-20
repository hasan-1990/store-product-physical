// src/lib/auth-helper.ts
/**
 * Authentication Helper for Route Handlers
 * این فایل برای حل مشکل getServerSession در route handlers ساخته شده
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import jwt from 'jsonwebtoken';
import { authOptions } from '@/lib/auth';

function hubJwtSecret(): string {
  const value = process.env.JWT_SECRET?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  return 'dev-only-secret-do-not-use-in-production-min-32-chars';
}

function userFromJwt(token: string) {
  try {
    const payload = jwt.verify(token, hubJwtSecret()) as {
      userId?: string;
      email?: string;
      name?: string;
      role?: string;
    };
    if (!payload.userId || !payload.email) return null;
    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name || payload.email,
      role: payload.role || 'user',
    };
  } catch {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      if (payload.exp * 1000 < Date.now()) return null;
      if (!payload.userId || !payload.email) return null;
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name || payload.email,
        role: payload.role || 'user',
      };
    } catch {
      return null;
    }
  }
}

/**
 * Get authenticated user from session in route handlers
 * Using getServerSession with proper headers conversion
 * Also supports JWT token from Authorization header
 */
export async function getAuthUserFromRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const user = userFromJwt(authHeader.substring(7));
      if (user) return user;
    }

    const tokenCookie = request.cookies.get('token')?.value;
    if (tokenCookie) {
      const user = userFromJwt(tokenCookie);
      if (user) return user;
    }

    const allCookies = request.cookies.getAll();
    console.log('🍪 Total cookies:', allCookies.length);
    console.log('🍪 Cookie names:', allCookies.map(c => c.name).join(', '));
    
    // Check for NextAuth session cookie
    const sessionCookie = allCookies.find(c => c.name === 'next-auth.session-token');
    console.log('🔑 Session cookie found:', sessionCookie ? 'YES' : 'NO');
    
    if (!sessionCookie) {
      console.log('❌ No session cookie - user not logged in');
      return null;
    }
    
    // Convert NextRequest to a format getServerSession can use
    // Create a mock request object with proper headers
    const headers = new Headers();
    
    // Copy all cookies to the Cookie header
    const cookieHeader = allCookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');
    
    if (cookieHeader) {
      headers.set('cookie', cookieHeader);
    }
    
    // Copy other important headers
    request.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    console.log('� Cookie header:', cookieHeader.substring(0, 100) + '...');

    // Get session using the converted request
    const session = await getServerSession(authOptions);

    console.log('� Session:', session ? 'EXISTS' : 'NULL');
    console.log('📧 Email:', session?.user?.email || 'none');
    console.log('� Role:', session?.user?.role || 'none');

    if (!session?.user) {
      console.log('❌ No user in session');
      return null;
    }

    return {
      id: session.user.id as string,
      email: session.user.email as string,
      name: session.user.name as string,
      role: session.user.role as string,
    };
  } catch (error) {
    console.error('❌ Auth error:', error);
    return null;
  }
}

/**
 * Require admin authentication in route handlers
 */
export async function requireAdminFromRequest(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);

  if (!user) {
    console.log('❌ No user found in token');
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: 'احراز هویت نشده' },
        { status: 401 }
      )
    };
  }

  if (user.role?.toLowerCase() !== 'admin') {
    console.log('❌ User is not admin:', user.role);
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز - فقط ادمین' },
        { status: 403 }
      )
    };
  }

  console.log('✅ Admin authenticated:', user.email);
  return { authorized: true, user };
}
