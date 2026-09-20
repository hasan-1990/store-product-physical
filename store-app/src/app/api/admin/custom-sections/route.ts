import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const mongodb = await connectDB();
    
    const settings = await mongodb.settings.findOne({ key: 'custom_sections' });
    
    return NextResponse.json({
      success: true,
      sections: settings?.sections || []
    });
  } catch (error) {
    console.error('Error fetching custom sections:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در دریافت بخش‌های سفارشی'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sections } = await request.json();
    
    const mongodb = await connectDB();
    
    await mongodb.settings.updateOne(
      { key: 'custom_sections' },
      { 
        $set: { 
          sections,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'بخش‌های سفارشی با موفقیت ذخیره شد',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error saving custom sections:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در ذخیره بخش‌های سفارشی'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sectionId } = await request.json();
    
    const mongodb = await connectDB();
    
    const settings = await mongodb.settings.findOne({ key: 'custom_sections' });
    
    if (settings?.sections) {
      const updatedSections = settings.sections.filter((section: any) => section.id !== sectionId);
      
      await mongodb.settings.updateOne(
        { key: 'custom_sections' },
        { 
          $set: { 
            sections: updatedSections,
            updatedAt: new Date()
          } 
        }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'بخش سفارشی با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting custom section:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در حذف بخش سفارشی'
    }, { status: 500 });
  }
}
