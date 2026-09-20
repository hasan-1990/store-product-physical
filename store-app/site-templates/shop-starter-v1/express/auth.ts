import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'shop-starter-dev-secret-change-me';
export const ADMIN_COOKIE_NAME = 'admin_token';

export type AdminTokenPayload = {
  sub: string;
  email: string;
  role: 'admin';
};

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
  } catch {
    return null;
  }
}

export function getAdminFromRequest(req: Request): AdminTokenPayload | null {
  const token = req.cookies?.[ADMIN_COOKIE_NAME];
  if (!token) return null;
  return verifyAdminToken(token);
}

export function adminCookieOptions(maxAge = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function setAdminCookie(res: Response, token: string): void {
  const opts = adminCookieOptions();
  res.cookie(ADMIN_COOKIE_NAME, token, opts);
}

export function clearAdminCookie(res: Response): void {
  res.clearCookie(ADMIN_COOKIE_NAME, { path: '/', httpOnly: true, sameSite: 'lax' });
}
