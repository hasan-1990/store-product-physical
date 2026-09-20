import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { PaymentGateway } from '@/types/payment-gateway';

/**
 * GET - دریافت لیست درگاه‌های پرداخت
 */
export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    const gateways = await db.paymentGateways.find({}).toArray();
    
    return NextResponse.json({
      success: true,
      gateways: gateways.map(g => ({
        ...g,
        id: g._id?.toString(),
        _id: g._id?.toString()
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching payment gateways:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در دریافت درگاه‌های پرداخت'
    }, { status: 500 });
  }
}

/**
 * POST - افزودن درگاه پرداخت جدید
 */
export async function POST(request: NextRequest) {
  try {
    const body: PaymentGateway = await request.json();
    
    // Validation
    if (!body.name || !body.type || !body.merchantId) {
      return NextResponse.json({
        success: false,
        error: 'اطلاعات ناقص است'
      }, { status: 400 });
    }

    const db = await connectDB();
    
    const newGateway = {
      name: body.name,
      type: body.type,
      merchantId: body.merchantId,
      apiKey: body.apiKey || '',
      active: body.active !== undefined ? body.active : false,
      commissionRate: body.commissionRate || 0,
      testMode: body.testMode !== undefined ? body.testMode : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.paymentGateways.insertOne(newGateway);
    
    return NextResponse.json({
      success: true,
      gateway: {
        ...newGateway,
        id: result.insertedId.toString(),
        _id: result.insertedId.toString()
      }
    });
  } catch (error) {
    console.error('❌ Error creating payment gateway:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در ایجاد درگاه پرداخت'
    }, { status: 500 });
  }
}

/**
 * PUT - به‌روزرسانی درگاه پرداخت
 */
export async function PUT(request: NextRequest) {
  try {
    const body: PaymentGateway = await request.json();
    
    console.log('📝 PUT Request body:', JSON.stringify(body));
    
    if (!body._id && !body.id) {
      console.log('❌ No ID provided');
      return NextResponse.json({
        success: false,
        error: 'شناسه درگاه مشخص نشده است'
      }, { status: 400 });
    }

    const db = await connectDB();
    const idString = body._id || body.id;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(idString || '')) {
      console.log('❌ Invalid ObjectId:', idString);
      return NextResponse.json({
        success: false,
        error: 'شناسه درگاه نامعتبر است'
      }, { status: 400 });
    }
    
    const gatewayId = new ObjectId(idString);
    console.log('✅ Valid gateway ID:', gatewayId.toString());
    
    const updateData = {
      name: body.name,
      type: body.type,
      merchantId: body.merchantId,
      apiKey: body.apiKey || '',
      active: body.active,
      commissionRate: body.commissionRate,
      testMode: body.testMode,
      updatedAt: new Date()
    };

    console.log('📦 Update data:', updateData);

    const result = await db.paymentGateways.updateOne(
      { _id: gatewayId },
      { $set: updateData }
    );

    console.log('📊 Update result:', result);

    if (result.matchedCount === 0) {
      console.log('❌ Gateway not found in database');
      return NextResponse.json({
        success: false,
        error: 'درگاه پرداخت یافت نشد'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'درگاه پرداخت با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('❌ Error updating payment gateway:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در به‌روزرسانی درگاه پرداخت'
    }, { status: 500 });
  }
}

/**
 * DELETE - حذف درگاه پرداخت
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('🗑️ DELETE Request - ID:', id);
    
    if (!id) {
      console.log('❌ No ID provided');
      return NextResponse.json({
        success: false,
        error: 'شناسه درگاه مشخص نشده است'
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      console.log('❌ Invalid ObjectId:', id);
      return NextResponse.json({
        success: false,
        error: 'شناسه درگاه نامعتبر است'
      }, { status: 400 });
    }

    const db = await connectDB();
    const gatewayId = new ObjectId(id);
    
    console.log('🔍 Attempting to delete gateway with ID:', gatewayId.toString());
    
    const result = await db.paymentGateways.deleteOne({ _id: gatewayId });

    console.log('📊 Delete result:', result);

    if (result.deletedCount === 0) {
      console.log('❌ Gateway not found in database');
      return NextResponse.json({
        success: false,
        error: 'درگاه پرداخت یافت نشد'
      }, { status: 404 });
    }

    console.log('✅ Gateway deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'درگاه پرداخت با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('❌ Error deleting payment gateway:', error);
    return NextResponse.json({
      success: false,
      error: 'خطا در حذف درگاه پرداخت'
    }, { status: 500 });
  }
}
