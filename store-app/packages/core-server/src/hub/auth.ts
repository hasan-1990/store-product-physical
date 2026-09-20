import jwt from 'jsonwebtoken';
import type { Request } from 'express';

export type HubUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export function getHubJwtSecret(): string {
  const value = process.env.JWT_SECRET?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  return 'dev-only-secret-do-not-use-in-production';
}

function getJwtSecret(): string {
  return getHubJwtSecret();
}

export function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  const cookieToken = req.cookies?.token;
  if (typeof cookieToken === 'string' && cookieToken) {
    return cookieToken;
  }
  return null;
}

export function generateHubToken(userId: string, role: string, email: string, name?: string): string {
  return jwt.sign({ userId, role, email, name: name || email }, getJwtSecret(), { expiresIn: '30d' });
}

export function verifyHubToken(token: string): HubUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      userId?: string;
      email?: string;
      name?: string;
      role?: string;
    };
    if (!decoded.userId) return null;
    return {
      id: decoded.userId,
      email: decoded.email || '',
      name: decoded.name || decoded.email || 'User',
      role: decoded.role || 'user',
    };
  } catch {
    return null;
  }
}

export function getHubUserFromRequest(req: Request): HubUser | null {
  const token = extractBearerToken(req);
  if (!token) return null;
  return verifyHubToken(token);
}
