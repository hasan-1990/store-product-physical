import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('🔍 Auth Check API:');
    console.log('   Session exists:', !!session);
    console.log('   User:', session?.user?.email || 'none');
    console.log('   Role:', session?.user?.role || 'none');
    console.log('   Full session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false, 
          authenticated: false,
          message: 'Not authenticated' 
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        id: session.user.id
      }
    });
  } catch (error) {
    console.error('❌ Auth check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        authenticated: false,
        error: 'Internal error' 
      },
      { status: 500 }
    );
  }
}
