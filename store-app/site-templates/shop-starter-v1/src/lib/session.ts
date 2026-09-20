import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

export const CART_SESSION_COOKIE = 'cart_session';

export async function getOrCreateCartSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_SESSION_COOKIE)?.value;
  if (existing) return existing;
  return randomUUID();
}

export function getCartSessionFromRequest(request: NextRequest): string | null {
  return request.cookies.get(CART_SESSION_COOKIE)?.value ?? null;
}

export function cartSessionCookieOptions(maxAge = 60 * 60 * 24 * 30) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
