import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// GET - دریافت محتوای صفحه اصلی
export async function GET() {
  try {
    const db = await connectDB();
    const collection = db.getCollection('homepage_content');
    
    let content = await collection.findOne({});
    
    // اگر محتوای پیش‌فرض وجود نداشت، ایجاد کن
    if (!content) {
      const defaultContent = {
        introSection: {
          title: "معرفی فروشگاه - پیشرو در عرضه محصولات باکیفیت",
          content: "فروشگاه ما با بیش از چندین سال تجربه در زمینه فروش آنلاین، یکی از معتبرترین و محبوب‌ترین فروشگاه‌های اینترنتی کشور محسوب می‌شود. ما با هدف ارائه بهترین محصولات با کیفیت، قیمت مناسب و خدمات پس از فروش بی‌نظیر، همواره در تلاش برای رضایت مشتریان عزیز هستیم.\n\nدر فروشگاه ما طیف گسترده‌ای از محصولات شامل لوازم خانگی, پوشاک و مد, لوازم الکترونیکی, کتاب و لوازم التحریر, محصولات بهداشتی و آرایشی, اسباب بازی و صدها دسته‌بندی دیگر را می‌توانید پیدا کنید. تمامی محصولات ما از برندهای معتبر داخلی و خارجی تهیه شده و دارای گارانتی معتبر می‌باشند.",
          showButtons: true,
          active: true
        },
        servicesSection: {
          title: "خدمات جامع فروشگاه",
          subtitle: "مجموعه کاملی از خدمات برای تجربه خرید بهتر شما",
          services: [
            {
              title: "ارسال سراسری",
              description: "ارسال به تمام نقاط کشور با بهترین شرکت‌های حمل‌ونقل",
              icon: "🚚"
            },
            {
              title: "مشاوره تخصصی", 
              description: "تیم مشاوران متخصص آماده راهنمایی شما",
              icon: "👥"
            },
            {
              title: "پرداخت امن",
              description: "سیستم پرداخت کاملاً امن با رمزگذاری SSL",
              icon: "🔒"
            }
          ],
          showStats: true,
          active: true
        },
        faqSection: {
          title: "سوالات متداول",
          subtitle: "پاسخ سوالات رایج مشتریان در مورد خرید و خدمات ما",
          faqs: [
            {
              question: "چطور می‌توانم سفارش خود را پیگیری کنم؟",
              answer: "پس از ثبت سفارش، کد پیگیری به شماره موبایل و ایمیل شما ارسال می‌شود."
            },
            {
              question: "آیا امکان پرداخت در محل وجود دارد؟",
              answer: "بله، برای سفارش‌های داخل شهر امکان پرداخت در محل فراهم است."
            }
          ],
          active: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await collection.insertOne(defaultContent);
      content = await collection.findOne({});
    }
    
    return NextResponse.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching homepage content:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در دریافت محتوای صفحه اصلی'
    }, { status: 500 });
  }
}

// PUT - بروزرسانی محتوای صفحه اصلی
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const db = await connectDB();
    const collection = db.getCollection('homepage_content');
    
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    const result = await collection.findOneAndUpdate(
      {},
      { $set: updateData },
      { 
        upsert: true,
        returnDocument: 'after'
      }
    );
    
    return NextResponse.json({
      success: true,
      message: 'محتوای صفحه اصلی با موفقیت بروزرسانی شد',
      data: result || updateData
    });
  } catch (error) {
    console.error('Error updating homepage content:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در بروزرسانی محتوای صفحه اصلی'
    }, { status: 500 });
  }
}