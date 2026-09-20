import { NextRequest, NextResponse } from 'next/server';
import { DiscountService } from '@/lib/discount-service';
import { z } from 'zod';

// Schema validation for discount validation
const validateDiscountSchema = z.object({
  code: z.string().min(1, 'کد تخفیف الزامی است'),
  userId: z.string().min(1, 'شناسه کاربر الزامی است'),
  orderAmount: z.number().min(0, 'مبلغ سفارش نمی‌تواند منفی باشد'),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
});

// POST /api/admin/discount-codes/validate - Validate discount code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = validateDiscountSchema.parse(body);
    
    // Validate discount code
    const result = await DiscountService.validateDiscountCode(
      validatedData.code,
      validatedData.userId,
      validatedData.orderAmount,
      validatedData.productIds || [],
      validatedData.categoryIds || []
    );

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Error validating discount code:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در اعتبارسنجی کد تخفیف' },
      { status: 500 }
    );
  }
}