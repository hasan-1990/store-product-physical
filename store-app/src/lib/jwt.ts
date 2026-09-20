import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/secrets';

export const TOKEN_EXPIRY = '30d';

export function generateToken(userId: string, role: string, email: string): string {
  return jwt.sign(
    { userId, role, email },
    getJwtSecret(),
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): { userId: string; role: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      userId: string;
      role: string;
      email: string;
    };
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function decodeToken(token: string): { userId: string; role: string; email: string } | null {
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded;
  } catch (error) {
    console.error('Token decode failed:', error);
    return null;
  }
}
