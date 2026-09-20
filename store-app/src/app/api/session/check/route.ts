import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('🔍 Session Check API Response:', {
      hasSession: !!session,
      user: session?.user,
      timestamp: new Date().toISOString()
    });

    if (!session?.user) {
      return NextResponse.json({
        authenticated: false,
        message: 'Not authenticated'
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role
      }
    });
  } catch (error) {
    console.error('❌ Session check error:', error);
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Session check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
