import { jwtVerify } from 'jose';
import type { AdminTokenPayload } from '@/lib/auth';

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || 'shop-starter-dev-secret-change-me');
}

export async function verifyAdminTokenEdge(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== 'admin' || typeof payload.email !== 'string' || typeof payload.sub !== 'string') {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: 'admin',
    };
  } catch {
    return null;
  }
}
