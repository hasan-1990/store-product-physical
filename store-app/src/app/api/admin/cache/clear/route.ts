import { NextRequest, NextResponse } from 'next/server';
import { CacheManager } from '@/lib/cache-manager';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Manual cache clear requested');
    
    // Clear users cache
    await CacheManager.invalidateUsers();
    
    console.log('✅ Users cache cleared successfully');
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully'
    });

  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear cache',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}