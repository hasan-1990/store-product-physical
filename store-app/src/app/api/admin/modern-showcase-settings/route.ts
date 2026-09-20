import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const mongodb = await connectDB();
    
    const settings = await mongodb.settings.findOne({ 
      key: 'modern_showcase_settings' 
    });

    // Default settings if none exist
    const defaultSettings = {
      active: true,
      title: 'محصولات برتر',
      subtitle: 'کیفیت برتر، قیمت مناسب',
      showStatistics: true,
      statisticsData: {
        rating: { value: '۴.۸/۵', label: 'امتیاز رضایت' },
        support: { value: '۴۸ هزار+', label: 'دانلود' },
        customers: { value: '۲۰,۰۰۰+', label: 'مشتری راضی' },
        products: { value: '۵۰۰+', label: 'محصول دیجیتال' }
      },
      tabs: [
        {
          id: 'latest',
          label: 'جدیدترین محصولات',
          apiType: 'latest',
          active: true,
          color: '#ff6b35',
          promo: {
            title: 'جدیدترین',
            subtitle: 'تازه‌ترین محصولات',
            buttonText: 'مشاهده بیشتر',
            link: '/products',
            backgroundColor: '#ff6b35'
          }
        },
        {
          id: 'best-selling',
          label: 'پرفروش‌ترین',
          apiType: 'best_selling',
          active: true,
          color: '#4f46e5',
          promo: {
            title: 'پرفروش‌ها',
            subtitle: 'محبوب‌ترین محصولات',
            buttonText: 'مشاهده بیشتر',
            link: '/products',
            backgroundColor: '#4f46e5'
          }
        },
        {
          id: 'top-rating',
          label: 'بالاترین امتیاز',
          apiType: 'highest_rated',
          active: true,
          color: '#059669',
          promo: {
            title: 'بهترین امتیاز',
            subtitle: 'بالاترین کیفیت',
            buttonText: 'مشاهده بیشتر',
            link: '/products',
            backgroundColor: '#059669'
          }
        },
        {
          id: 'featured',
          label: 'پربازدیدترین',
          apiType: 'most_viewed',
          active: true,
          color: '#7c3aed',
          promo: {
            title: 'پربازدید',
            subtitle: 'محصولات پربیننده',
            buttonText: 'مشاهده بیشتر',
            link: '/products',
            backgroundColor: '#7c3aed'
          }
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: settings?.data || defaultSettings
    });

  } catch (error) {
    console.error('Error fetching modern showcase settings:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری تنظیمات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const mongodb = await connectDB();
    const data = await request.json();

    const result = await mongodb.settings.updateOne(
      { key: 'modern_showcase_settings' },
      { 
        $set: { 
          key: 'modern_showcase_settings',
          data: data,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شد'
    });

  } catch (error) {
    console.error('Error saving modern showcase settings:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره تنظیمات' },
      { status: 500 }
    );
  }
}