import { NextRequest, NextResponse } from 'next/server';
import { AdvancedSchemaGenerator } from '@/lib/advanced-schema';
import { getGlobalSEOSettings } from '@/lib/seo-helpers';

// POST - تولید Schema های پیشرفته
export async function POST(request: NextRequest) {
  try {
    const { schemaType, data } = await request.json();
    
    if (!schemaType) {
      return NextResponse.json({ 
        success: false,
        error: 'نوع Schema مشخص نشده است' 
      }, { status: 400 });
    }

    // دریافت تنظیمات عمومی
    const globalSettings = await getGlobalSEOSettings();
    
    if (!globalSettings) {
      return NextResponse.json({ 
        success: false,
        error: 'تنظیمات عمومی SEO یافت نشد' 
      }, { status: 404 });
    }

    let schema;

    switch (schemaType) {
      case 'website':
        schema = AdvancedSchemaGenerator.generateWebSiteSchema(globalSettings);
        break;

      case 'organization':
        schema = AdvancedSchemaGenerator.generateOrganizationSchema(globalSettings);
        break;

      case 'localbusiness':
        schema = AdvancedSchemaGenerator.generateLocalBusinessSchema(
          globalSettings,
          data?.businessType || 'Store',
          data?.coordinates,
          data?.openingHours,
          data?.priceRange
        );
        break;

      case 'faq':
        if (!data?.faqs || !Array.isArray(data.faqs)) {
          return NextResponse.json({ 
            success: false,
            error: 'داده‌های FAQ معتبر نیست' 
          }, { status: 400 });
        }
        schema = AdvancedSchemaGenerator.generateFAQSchema(data.faqs);
        break;

      case 'breadcrumb':
        if (!data?.breadcrumbs || !Array.isArray(data.breadcrumbs)) {
          return NextResponse.json({ 
            success: false,
            error: 'داده‌های Breadcrumb معتبر نیست' 
          }, { status: 400 });
        }
        schema = AdvancedSchemaGenerator.generateBreadcrumbSchema(data.breadcrumbs);
        break;

      case 'event':
        if (!data?.name || !data?.description || !data?.startDate) {
          return NextResponse.json({ 
            success: false,
            error: 'داده‌های Event کامل نیست' 
          }, { status: 400 });
        }
        schema = AdvancedSchemaGenerator.generateEventSchema(
          data.name,
          data.description,
          data.startDate,
          data.endDate,
          data.location || globalSettings.contact?.address || 'آنلاین',
          data.organizer || globalSettings.siteName,
          data.offers
        );
        break;

      case 'review':
        if (!data?.reviewText || !data?.rating || !data?.authorName || !data?.itemName) {
          return NextResponse.json({ 
            success: false,
            error: 'داده‌های Review کامل نیست' 
          }, { status: 400 });
        }
        schema = AdvancedSchemaGenerator.generateReviewSchema(
          data.reviewText,
          data.rating,
          data.authorName,
          data.itemName,
          data.itemUrl || globalSettings.siteUrl,
          data.datePublished || new Date().toISOString()
        );
        break;

      default:
        return NextResponse.json({ 
          success: false,
          error: 'نوع Schema پشتیبانی نمی‌شود' 
        }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      schema,
      jsonLD: JSON.stringify(schema, null, 2)
    });

  } catch (error) {
    console.error('خطا در تولید Schema:', error);
    return NextResponse.json({ 
      success: false,
      error: 'خطا در تولید Schema',
      details: error instanceof Error ? error.message : 'خطای ناشناخته'
    }, { status: 500 });
  }
}

// GET - دریافت لیست Schema های موجود
export async function GET() {
  try {
    const availableSchemas = [
      {
        type: 'website',
        name: 'WebSite Schema',
        description: 'Schema اصلی وب‌سایت با قابلیت جستجو',
        required: [],
        optional: []
      },
      {
        type: 'organization',
        name: 'Organization Schema',
        description: 'اطلاعات سازمان/شرکت',
        required: [],
        optional: ['socialMedia', 'contact']
      },
      {
        type: 'localbusiness',
        name: 'Local Business Schema',
        description: 'کسب و کار محلی با موقعیت جغرافیایی',
        required: [],
        optional: ['coordinates', 'openingHours', 'priceRange', 'businessType']
      },
      {
        type: 'faq',
        name: 'FAQ Schema',
        description: 'سوالات متداول',
        required: ['faqs'],
        optional: [],
        example: {
          faqs: [
            {
              question: 'سوال نمونه',
              answer: 'پاسخ نمونه'
            }
          ]
        }
      },
      {
        type: 'breadcrumb',
        name: 'Breadcrumb Schema',
        description: 'مسیر صفحه',
        required: ['breadcrumbs'],
        optional: [],
        example: {
          breadcrumbs: [
            { name: 'خانه', url: '/' },
            { name: 'محصولات', url: '/products' },
            { name: 'محصول نمونه' }
          ]
        }
      },
      {
        type: 'event',
        name: 'Event Schema',
        description: 'رویداد یا تخفیف',
        required: ['name', 'description', 'startDate'],
        optional: ['endDate', 'location', 'organizer', 'offers'],
        example: {
          name: 'تخفیف ویژه',
          description: 'تخفیف ۵۰ درصدی محصولات',
          startDate: '2025-09-20T09:00:00',
          endDate: '2025-09-25T23:59:59',
          offers: [
            { price: '100000', currency: 'IRR' }
          ]
        }
      },
      {
        type: 'review',
        name: 'Review Schema',
        description: 'نظر و امتیاز',
        required: ['reviewText', 'rating', 'authorName', 'itemName'],
        optional: ['itemUrl', 'datePublished'],
        example: {
          reviewText: 'محصول عالی',
          rating: 5,
          authorName: 'احمد رضایی',
          itemName: 'محصول نمونه'
        }
      }
    ];

    return NextResponse.json({ 
      success: true, 
      schemas: availableSchemas 
    });

  } catch (error) {
    console.error('خطا در دریافت Schema ها:', error);
    return NextResponse.json({ 
      success: false,
      error: 'خطا در دریافت Schema ها' 
    }, { status: 500 });
  }
}