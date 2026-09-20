import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import { getJwtSecret } from '@/lib/secrets'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'برای دانلود فایل باید وارد شوید' },
        { status: 401 }
      )
    }

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'شناسه محصول الزامی است' },
        { status: 400 }
      )
    }

    const mongodb = await connectDB();

    // بررسی محصول
    const product = await mongodb.products.findOne({
      _id: new ObjectId(productId)
    })

    if (!product) {
      return NextResponse.json(
        { error: 'محصول پیدا نشد' },
        { status: 404 }
      )
    }

    if (product.productType !== 'DIGITAL') {
      return NextResponse.json(
        { error: 'این محصول قابل دانلود نیست' },
        { status: 400 }
      )
    }

    // بررسی خرید کاربر
    const orderItem = await mongodb.orderItems.findOne({
      productId: new ObjectId(productId),
      orderId: {
        $in: await mongodb.orders.find({
          userId: new ObjectId(user.id),
          paymentStatus: 'PAID'
        }).project({ _id: 1 }).toArray().then((orders: any) => orders.map((o: any) => o._id))
      }
    })

    if (!orderItem) {
      return NextResponse.json(
        { error: 'شما این محصول را خریداری نکرده‌اید' },
        { status: 403 }
      )
    }

    // بررسی محدودیت دانلود
    if (product.downloadLimit) {
      const downloadCount = await mongodb.downloads.countDocuments({
        userId: new ObjectId(user.id),
        productId: new ObjectId(productId)
      })

      if (downloadCount >= product.downloadLimit) {
        return NextResponse.json(
          { error: 'تعداد دانلودهای مجاز شما تمام شده است' },
          { status: 403 }
        )
      }
    }

    // ثبت دانلود
    await mongodb.downloads.insertOne({
      userId: new ObjectId(user.id),
      productId: new ObjectId(productId),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      createdAt: new Date()
    })

    // تولید توکن موقت برای دانلود (معتبر برای 1 ساعت)
    const downloadToken = jwt.sign(
      { 
        userId: user.id, 
        productId: productId,
        downloadUrl: (product as any).downloadUrl 
      },
      getJwtSecret(),
      { expiresIn: '1h' }
    )

    return NextResponse.json({
      success: true,
      downloadToken
    })

  } catch (error) {
    console.error('Error generating download link:', error)
    return NextResponse.json(
      { error: 'خطا در تولید لینک دانلود' },
      { status: 500 }
    )
  }
}
