import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🧪 [TEST-DB] Starting database connection test...');
    const mongodb = await connectDB();
    console.log('✅ [TEST-DB] MongoDB connected successfully');
    
    // Test categories collection
    console.log('📊 [TEST-DB] Testing categories collection...');
    const categoriesCount = await mongodb.categories.countDocuments();
    console.log(`✅ [TEST-DB] Categories count: ${categoriesCount}`);
    
    const oneCategory = await mongodb.categories.findOne();
    console.log('✅ [TEST-DB] Sample category:', oneCategory?.name);
    
    // Test aggregate (like the real API)
    console.log('🔄 [TEST-DB] Testing aggregate query...');
    const aggResult = await mongodb.categories.aggregate([
      { $match: {} },
      { $limit: 1 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products'
        }
      }
    ]).toArray();
    console.log(`✅ [TEST-DB] Aggregate works: ${aggResult.length > 0}`);
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection test successful ✅',
      data: {
        categoriesCount,
        sampleCategory: oneCategory ? {
          id: oneCategory.sequentialId || oneCategory._id?.toString(),
          name: oneCategory.name,
          slug: oneCategory.slug
        } : null,
        aggregateWorks: aggResult.length > 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ [TEST-DB] MongoDB test error:', error);
    console.error('❌ [TEST-DB] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
