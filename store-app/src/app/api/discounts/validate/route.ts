import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// POST - اعتبارسنجی کد تخفیف
export async function POST(request: NextRequest) {
  try {
    console.log('💰 Discount validation started');
    const body = await request.json();
    const { code, cartTotal, cartItems } = body;

    console.log('💰 Validating code:', code, 'Cart total:', cartTotal);

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'کد تخفیف الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    console.log('💰 Connected to database');

    // جستجوی کد تخفیف
    const now = new Date();
    const discount = await db.discountCodes.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now }
    });

    if (!discount) {
      return NextResponse.json(
        { success: false, error: 'کد تخفیف نامعتبر یا منقضی شده است' },
        { status: 404 }
      );
    }

    // بررسی تعداد استفاده
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return NextResponse.json(
        { success: false, error: 'این کد تخفیف به حد مجاز استفاده رسیده است' },
        { status: 400 }
      );
    }

    // بررسی حداقل مبلغ خرید
    if (discount.minOrderAmount && cartTotal < discount.minOrderAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `حداقل مبلغ خرید برای این کد ${discount.minOrderAmount.toLocaleString('fa-IR')} تومان است`
        },
        { status: 400 }
      );
    }

    // بررسی حداکثر مبلغ خرید (اگر فیلدی برای این منظور داشته باشیم)
    // در حال حاضر در schema این فیلد وجود ندارد

    // محاسبه مقدار تخفیف
    let discountAmount = 0;

    if (discount.type === 'percentage') {
      discountAmount = (cartTotal * discount.value) / 100;

      // اعمال حداکثر تخفیف
      if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
        discountAmount = discount.maxDiscountAmount;
      }
    } else if (discount.type === 'fixed') {
      discountAmount = discount.value;

      // تخفیف نباید بیشتر از مبلغ سبد خرید باشد
      if (discountAmount > cartTotal) {
        discountAmount = cartTotal;
      }
    }

    // بررسی محصولات مجاز (اگر تنظیم شده باشد)
    if (discount.applicableProducts && discount.applicableProducts.length > 0) {
      const applicableItems = cartItems.filter((item: any) =>
        discount.applicableProducts.includes(item.productId)
      );

      if (applicableItems.length === 0) {
        return NextResponse.json(
          { success: false, error: 'این کد تخفیف برای محصولات سبد خرید شما معتبر نیست' },
          { status: 400 }
        );
      }

      // محاسبه تخفیف فقط برای محصولات مجاز
      const applicableTotal = applicableItems.reduce(
        (sum: number, item: any) => sum + (item.price * item.quantity),
        0
      );

      if (discount.type === 'PERCENTAGE') {
        discountAmount = (applicableTotal * discount.value) / 100;
        if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
          discountAmount = discount.maxDiscount;
        }
      } else if (discount.type === 'FIXED') {
        discountAmount = Math.min(discount.value, applicableTotal);
      }
    }

    // بررسی دسته‌بندی‌های مجاز (اگر تنظیم شده باشد)
    if (discount.applicableCategories && discount.applicableCategories.length > 0) {
      // اینجا می‌توانید بررسی کنید که آیا محصولات در دسته‌بندی‌های مجاز هستند یا نه
      // برای سادگی، فرض می‌کنیم که این بررسی در سمت کلاینت انجام شده است
    }

    return NextResponse.json({
      success: true,
      discount: {
        code: discount.code,
        type: discount.type,
        value: discount.value,
        discountAmount: Math.round(discountAmount * 100) / 100, // گرد کردن به 2 رقم اعشار
        description: discount.description
      }
    });
  } catch (error) {
    console.error('Error validating discount:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در اعتبارسنجی کد تخفیف' },
      { status: 500 }
    );
  }
}
