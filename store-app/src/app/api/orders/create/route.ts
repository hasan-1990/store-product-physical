import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import emailService from '@/lib/email';
import { 
  validateEmail, 
  validateFirstName, 
  validateLastName, 
  validateAddress, 
  validateIranianPostalCode 
} from '@/utils';

export async function POST(request: NextRequest) {
  try {
    console.log('🛍️ Creating new order...');
    const body = await request.json();
    console.log('📝 Order data received:', { 
      userId: body.userId, 
      itemsCount: body.items?.length, 
      totalAmount: body.totalAmount,
      paymentStatus: body.paymentStatus 
    });
    
    const {
      userId,
      items,
      contactInfo,
      shippingAddress,
      shippingMethod,
      paymentMethod,
      paymentStatus,
      totalAmount,
      discountAmount,
      discountCode
    } = body;

    // Server-side Validation
    if (contactInfo) {
      // اعتبارسنجی ایمیل
      if (contactInfo.email) {
        const emailResult = validateEmail(contactInfo.email, { allowTempEmails: false });
        if (!emailResult.isValid) {
          return NextResponse.json(
            { success: false, error: `ایمیل: ${emailResult.error}` },
            { status: 400 }
          );
        }
      }
      
      // اعتبارسنجی نام
      if (contactInfo.firstName) {
        const firstNameResult = validateFirstName(contactInfo.firstName);
        if (!firstNameResult.isValid) {
          return NextResponse.json(
            { success: false, error: `نام: ${firstNameResult.error}` },
            { status: 400 }
          );
        }
      }
      
      // اعتبارسنجی نام خانوادگی
      if (contactInfo.lastName) {
        const lastNameResult = validateLastName(contactInfo.lastName);
        if (!lastNameResult.isValid) {
          return NextResponse.json(
            { success: false, error: `نام خانوادگی: ${lastNameResult.error}` },
            { status: 400 }
          );
        }
      }
    }
    
    // اعتبارسنجی آدرس (فقط برای محصولات فیزیکی)
    if (shippingAddress) {
      // اعتبارسنجی آدرس
      if (shippingAddress.address) {
        const addressResult = validateAddress(shippingAddress.address, { minLength: 15 });
        if (!addressResult.isValid) {
          return NextResponse.json(
            { success: false, error: `آدرس: ${addressResult.error}` },
            { status: 400 }
          );
        }
      }
      
      // اعتبارسنجی کد پستی
      if (shippingAddress.zipCode) {
        const zipResult = validateIranianPostalCode(shippingAddress.zipCode);
        if (!zipResult.isValid) {
          return NextResponse.json(
            { success: false, error: `کد پستی: ${zipResult.error}` },
            { status: 400 }
          );
        }
      }
    }

    const mongodb = await connectDB();
    console.log('✅ Connected to MongoDB');

    // ایجاد سفارش جدید
    const order = {
      userId: userId ? new ObjectId(userId) : null,
      items: items.map((item: any) => ({
        productId: new ObjectId(item.productId),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        productType: item.productType || 'PHYSICAL',
        downloadUrl: item.downloadUrl || null,
        fileSize: item.fileSize || null,
        fileFormat: item.fileFormat || null,
        provisioningType: item.provisioningType || 'download',
        templateSlug: item.templateSlug || null,
        templateId: item.templateId || null,
        siteDomain: item.provisioningType === 'managed-site' ? (item.siteDomain || body.siteDomain || null) : null,
      })),
      contactInfo,
      shippingAddress,
      shippingMethod,
      paymentMethod,
      paymentStatus, // 'pending', 'completed', 'failed'
      totalAmount,
      discountAmount: discountAmount || 0,
      discountCode: discountCode || null,
      orderNumber: `ORD-${Date.now()}`,
      status: paymentStatus === 'completed' ? 'completed' : 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await mongodb.orders.insertOne(order);
    console.log('✅ Order created successfully:', {
      orderId: result.insertedId.toString(),
      orderNumber: order.orderNumber,
      itemsCount: order.items.length
    });

    // اگر پرداخت تکمیل شده (تخفیف 100%), کارت را خالی کن
    if (paymentStatus === 'completed' && userId) {
      await mongodb.cartItems.deleteMany({
        userId: new ObjectId(userId)
      });
      console.log('🛒 Cart cleared for user:', userId);

      try {
        const { triggerProvisioningForOrder } = await import('@/lib/provisioning/run-provision');
        await triggerProvisioningForOrder(result.insertedId.toString());
      } catch (provisionError) {
        console.error('Provisioning after order create:', provisionError);
      }
    }

    // ارسال ایمیل تأیید سفارش (به صورت async - بدون انتظار)
    if (contactInfo?.email) {
      const orderWithId = {
        ...order,
        _id: result.insertedId
      };

      // ارسال ایمیل در بکگراند (بدون await تا سریع‌تر پاسخ برگردد)
      Promise.resolve().then(async () => {
        try {
          const emailSent = await emailService.sendOrderConfirmation(orderWithId);
          if (emailSent) {
            console.log('✅ Order confirmation email sent to:', contactInfo.email);
          } else {
            console.warn('⚠️ Failed to send order confirmation email');
          }
        } catch (emailError) {
          console.error('❌ Email sending error (non-critical):', emailError);
        }

        // ارسال لینک‌های دانلود برای محصولات دیجیتال
        const digitalProducts = items.filter((item: any) => item.productType === 'DIGITAL' && item.downloadUrl);
        if (digitalProducts.length > 0 && paymentStatus === 'completed') {
          try {
            const downloadLinks = digitalProducts.map((item: any) => ({
              productName: item.name,
              downloadUrl: item.downloadUrl,
              fileSize: item.fileSize,
              fileFormat: item.fileFormat,
              expiresIn: '7 روز',
              maxDownloads: '5'
            }));

            const digitalEmailSent = await emailService.sendDigitalProductEmail(orderWithId, downloadLinks);
            if (digitalEmailSent) {
              console.log('✅ Digital product email sent with download links');
            }
          } catch (emailError) {
            console.error('❌ Digital product email error (non-critical):', emailError);
          }
        }
      });
      
      console.log('📧 Email sending queued in background');
    }

    return NextResponse.json({
      success: true,
      orderId: result.insertedId.toString(),
      orderNumber: order.orderNumber,
      message: 'سفارش با موفقیت ثبت شد'
    });

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت سفارش' },
      { status: 500 }
    );
  }
}

// GET order by ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    const userId = searchParams.get('userId');

    if (!orderId && !userId) {
      return NextResponse.json(
        { success: false, error: 'orderId یا userId الزامی است' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();

    if (orderId) {
      // Get single order
      const order = await mongodb.orders.findOne({
        _id: new ObjectId(orderId)
      });

      if (!order) {
        return NextResponse.json(
          { success: false, error: 'سفارش یافت نشد' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        order
      });
    } else if (userId) {
      // Get all orders for user
      const orders = await mongodb.orders
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray();

      return NextResponse.json({
        success: true,
        orders
      });
    }

    // Fallback اگر هیچ شرطی برقرار نبود
    return NextResponse.json(
      { success: false, error: 'پارامترهای نامعتبر' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت سفارش' },
      { status: 500 }
    );
  }
}
