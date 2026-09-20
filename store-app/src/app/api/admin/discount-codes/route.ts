import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { DiscountService } from '@/lib/discount-service';
import { DiscountCode, CreateDiscountRequest, UpdateDiscountRequest, DiscountFilters } from '@/types/discount';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

// Schema validation for creating discount codes
const createDiscountSchema = z.object({
  code: z.string().min(3, 'کد تخفیف باید حداقل 3 کاراکتر باشد').max(20, 'کد تخفیف باید حداکثر 20 کاراکتر باشد'),
  type: z.enum(['percentage', 'fixed'], { message: 'نوع تخفیف باید درصدی یا مبلغ ثابت باشد' }),
  value: z.number().min(0, 'مقدار تخفیف نمی‌تواند منفی باشد'),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  usageLimit: z.number().min(1).optional(),
  usageLimitPerUser: z.number().min(1).optional(),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'فرمت تاریخ شروع نامعتبر است'),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'فرمت تاریخ پایان نامعتبر است'),
  isActive: z.boolean(),
  applicableProducts: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
  excludedProducts: z.array(z.string()).optional(),
  excludedCategories: z.array(z.string()).optional(),
  firstTimeUserOnly: z.boolean().optional(),
  description: z.string().optional(),
});

// GET /api/admin/discount-codes - Get all discount codes with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: DiscountFilters = {
      search: searchParams.get('search') || '',
      type: searchParams.get('type') as any || 'all',
      status: searchParams.get('status') as any || 'all',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
      sortBy: searchParams.get('sortBy') as any || 'createdAt',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const db = await connectDB();

    // Build query
    const query: any = {};

    // Search filter
    if (filters.search) {
      query.$or = [
        { code: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    // Type filter
    if (filters.type && filters.type !== 'all') {
      query.type = filters.type;
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      const now = new Date();
      switch (filters.status) {
        case 'active':
          query.isActive = true;
          query.validUntil = { $gte: now };
          break;
        case 'inactive':
          query.isActive = false;
          break;
        case 'expired':
          query.validUntil = { $lt: now };
          break;
      }
    }

    // Date range filter
    if (filters.dateFrom && filters.dateTo) {
      query.createdAt = {
        $gte: new Date(filters.dateFrom),
        $lte: new Date(filters.dateTo)
      };
    }

    // Build sort
    const sort: any = {};
    if (filters.sortBy) {
      sort[filters.sortBy] = filters.sortOrder === 'asc' ? 1 : -1;
    }

    // Get total count
    const total = await db.discountCodes.countDocuments(query);

    // Get discount codes
    const discountCodes = await db.discountCodes
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Transform data for frontend
    const transformedCodes = discountCodes.map((code: any) => ({
      ...code,
      id: code._id.toString(),
      _id: undefined
    }));

    return NextResponse.json({
      success: true,
      data: transformedCodes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching discount codes:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت کدهای تخفیف' },
      { status: 500 }
    );
  }
}

// POST /api/admin/discount-codes - Create new discount code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createDiscountSchema.parse(body);
    
    const db = await connectDB();

    // Check if code already exists
    const existingCode = await db.discountCodes.findOne({ 
      code: validatedData.code.toUpperCase() 
    });

    if (existingCode) {
      return NextResponse.json(
        { success: false, error: 'این کد تخفیف قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    // Validate dates
    const validFrom = new Date(validatedData.validFrom);
    const validUntil = new Date(validatedData.validUntil);

    if (validFrom >= validUntil) {
      return NextResponse.json(
        { success: false, error: 'تاریخ پایان باید بعد از تاریخ شروع باشد' },
        { status: 400 }
      );
    }

    // Validate percentage value
    if (validatedData.type === 'percentage' && validatedData.value > 100) {
      return NextResponse.json(
        { success: false, error: 'درصد تخفیف نمی‌تواند بیشتر از 100 باشد' },
        { status: 400 }
      );
    }

    // Create discount code
    const discountCode: any = {
      code: validatedData.code.toUpperCase(),
      type: validatedData.type,
      value: validatedData.value,
      minOrderAmount: validatedData.minOrderAmount,
      maxDiscountAmount: validatedData.maxDiscountAmount,
      usageLimit: validatedData.usageLimit,
      usageLimitPerUser: validatedData.usageLimitPerUser,
      usedCount: 0,
      validFrom,
      validUntil,
      isActive: validatedData.isActive,
      applicableProducts: validatedData.applicableProducts || [],
      applicableCategories: validatedData.applicableCategories || [],
      excludedProducts: validatedData.excludedProducts || [],
      excludedCategories: validatedData.excludedCategories || [],
      firstTimeUserOnly: validatedData.firstTimeUserOnly || false,
      description: validatedData.description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin' // TODO: Get from session
    };

    const result = await db.discountCodes.insertOne(discountCode);

    return NextResponse.json({
      success: true,
      data: {
        ...discountCode,
        id: result.insertedId.toString(),
        _id: undefined
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating discount code:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد کد تخفیف' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/discount-codes - Update discount code
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'شناسه کد تخفیف الزامی است' },
        { status: 400 }
      );
    }

    // Validate input (partial)
    const updateData: Partial<CreateDiscountRequest> = {};
    
    if (body.code) updateData.code = body.code;
    if (body.type) updateData.type = body.type;
    if (body.value !== undefined) updateData.value = body.value;
    if (body.minOrderAmount !== undefined) updateData.minOrderAmount = body.minOrderAmount;
    if (body.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = body.maxDiscountAmount;
    if (body.usageLimit !== undefined) updateData.usageLimit = body.usageLimit;
    if (body.usageLimitPerUser !== undefined) updateData.usageLimitPerUser = body.usageLimitPerUser;
    if (body.validFrom) updateData.validFrom = body.validFrom;
    if (body.validUntil) updateData.validUntil = body.validUntil;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.applicableProducts) updateData.applicableProducts = body.applicableProducts;
    if (body.applicableCategories) updateData.applicableCategories = body.applicableCategories;
    if (body.excludedProducts) updateData.excludedProducts = body.excludedProducts;
    if (body.excludedCategories) updateData.excludedCategories = body.excludedCategories;
    if (body.firstTimeUserOnly !== undefined) updateData.firstTimeUserOnly = body.firstTimeUserOnly;
    if (body.description !== undefined) updateData.description = body.description;

    const db = await connectDB();

    // Check if discount code exists
    const existingCode = await db.discountCodes.findOne({ 
      _id: new ObjectId(body.id) 
    });

    if (!existingCode) {
      return NextResponse.json(
        { success: false, error: 'کد تخفیف یافت نشد' },
        { status: 404 }
      );
    }

    // Check for duplicate code if code is being updated
    if (updateData.code && updateData.code !== existingCode.code) {
      const duplicateCode = await db.discountCodes.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: new ObjectId(body.id) }
      });

      if (duplicateCode) {
        return NextResponse.json(
          { success: false, error: 'این کد تخفیف قبلاً ثبت شده است' },
          { status: 400 }
        );
      }
    }

    // Validate dates if provided
    if (updateData.validFrom && updateData.validUntil) {
      const validFrom = new Date(updateData.validFrom);
      const validUntil = new Date(updateData.validUntil);

      if (validFrom >= validUntil) {
        return NextResponse.json(
          { success: false, error: 'تاریخ پایان باید بعد از تاریخ شروع باشد' },
          { status: 400 }
        );
      }
    }

    // Prepare update object
    const updateObject: any = {
      ...updateData,
      updatedAt: new Date()
    };

    if (updateData.code) {
      updateObject.code = updateData.code.toUpperCase();
    }

    if (updateData.validFrom) {
      updateObject.validFrom = new Date(updateData.validFrom);
    }

    if (updateData.validUntil) {
      updateObject.validUntil = new Date(updateData.validUntil);
    }

    // Update discount code
    const result = await db.discountCodes.updateOne(
      { _id: new ObjectId(body.id) },
      { $set: updateObject }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'کد تخفیف یافت نشد' },
        { status: 404 }
      );
    }

    // Get updated discount code
    const updatedCode = await db.discountCodes.findOne({ 
      _id: new ObjectId(body.id) 
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedCode,
        id: updatedCode?._id.toString(),
        _id: undefined
      }
    });

  } catch (error) {
    console.error('Error updating discount code:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی کد تخفیف' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/discount-codes - Delete discount codes
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.getAll('id');
    
    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'شناسه کد تخفیف الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Convert string IDs to ObjectIds
    const objectIds = ids.map(id => new ObjectId(id));

    // Delete discount codes
    const result = await db.discountCodes.deleteMany({
      _id: { $in: objectIds }
    });

    // Also delete related usage records
    await db.discountUsages.deleteMany({
      discountCodeId: { $in: ids }
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting discount codes:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف کدهای تخفیف' },
      { status: 500 }
    );
  }
}