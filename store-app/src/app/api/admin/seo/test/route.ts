import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/store-app';

export async function GET() {
  try {
    console.log('🔍 Testing MongoDB connection for SEO...');
    
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ MongoDB connected successfully');
    
    const db = client.db('store-app');
    
    // Test SEO collection
    const seoCollection = db.collection('seo_global_settings');
    const seoCount = await seoCollection.countDocuments();
    console.log('📊 SEO Global Settings count:', seoCount);
    
    // Test SEO pages collection
    const pagesCollection = db.collection('seo_pages');
    const pagesCount = await pagesCollection.countDocuments();
    console.log('📊 SEO Pages count:', pagesCount);
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection test successful',
      data: {
        globalSettingsCount: seoCount,
        pagesCount: pagesCount,
        connectionUri: uri
      }
    });
    
  } catch (error) {
    console.error('❌ MongoDB test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}