import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('🔍 Test Auth Debug:', {
      hasSession: !!session,
      userEmail: (session?.user as any)?.email,
      userRole: (session?.user as any)?.role,
      allUser: session?.user,
      allSession: session,
    });

    if (!session?.user) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session found',
        details: { session, user: session?.user }
      });
    }

    return NextResponse.json({
      authenticated: true,
      message: 'Session found',
      user: {
        email: (session.user as any).email,
        role: (session.user as any).role,
        name: (session.user as any).name,
      }
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      authenticated: false,
      error: String(error),
      message: 'Error checking auth'
    }, { status: 500 });
  }
}
