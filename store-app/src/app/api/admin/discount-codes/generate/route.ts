import { NextRequest, NextResponse } from 'next/server';
import { DiscountService } from '@/lib/discount-service';

// GET /api/admin/discount-codes/generate - Generate unique discount code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const length = parseInt(searchParams.get('length') || '8');
    
    if (length < 3 || length > 20) {
      return NextResponse.json(
        { success: false, error: 'طول کد باید بین 3 تا 20 کاراکتر باشد' },
        { status: 400 }
      );
    }

    const code = await DiscountService.generateUniqueCode(length);

    return NextResponse.json({
      success: true,
      code
    });

  } catch (error) {
    console.error('Error generating discount code:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در تولید کد تخفیف' },
      { status: 500 }
    );
  }
}