import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';

export const CART_SESSION_COOKIE = 'cart_session';

export function getCartSessionFromRequest(req: Request): string | null {
  return req.cookies?.[CART_SESSION_COOKIE] ?? null;
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

export function resolveCartSessionId(req: Request): string {
  return getCartSessionFromRequest(req) || randomUUID();
}

export function ensureCartSessionCookie(req: Request, res: Response, sessionId: string): void {
  if (!getCartSessionFromRequest(req)) {
    res.cookie(CART_SESSION_COOKIE, sessionId, cartSessionCookieOptions());
  }
}
