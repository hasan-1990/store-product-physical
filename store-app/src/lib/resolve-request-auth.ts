import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyToken } from '@/lib/jwt';

export interface RequestAuth {
  userId?: string;
  role: string;
  email?: string;
}

function decodeLegacyToken(token: string): RequestAuth | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    if (!payload?.role && !payload?.email) return null;

    return {
      userId: payload.userId || payload.id,
      role: String(payload.role || '').toLowerCase(),
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export function isAdminRole(role?: string): boolean {
  return role?.toLowerCase() === 'admin';
}

export async function resolveRequestAuth(req: NextRequest): Promise<RequestAuth | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role) {
    return {
      userId: session.user.id,
      role: String(session.user.role).toLowerCase(),
      email: session.user.email || undefined,
    };
  }

  let token = req.headers.get('authorization')?.replace('Bearer ', '').trim();
  if (!token) {
    token = new URL(req.url).searchParams.get('token')?.trim() || '';
  }

  if (!token) return null;

  const verified = verifyToken(token);
  if (verified) {
    return {
      userId: verified.userId,
      role: verified.role.toLowerCase(),
      email: verified.email,
    };
  }

  return decodeLegacyToken(token);
}
