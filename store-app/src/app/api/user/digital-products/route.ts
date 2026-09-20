import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const db = await connectDB()
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'احراز هویت مورد نیاز است' },
        { status: 401 }
      )
    }

    if (!ObjectId.isValid(user.id)) {
      return NextResponse.json(
        { error: 'شناسه کاربر نامعتبر است' },
        { status: 400 }
      )
    }

    // دریافت سفارش‌های پرداخت شده کاربر
    const orders = await db.orders.find({
      userId: new ObjectId(user.id),
      paymentStatus: 'PAID'
    }).toArray()

    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // دریافت آیتم‌های سفارش
    const orderIds = orders.map(order => order._id)
    const orderItems = await db.orderItems.find({
      orderId: { $in: orderIds }
    }).toArray()

    // دریافت محصولات دیجیتال
    const productIds = orderItems.map(item => item.productId)
    const products = await db.products.find({
      _id: { $in: productIds },
      productType: 'DIGITAL'
    }).toArray()

    // دریافت لایسنس‌های کاربر برای هر محصول
    const userLicenses = await db.licenses.find({
      userId: new ObjectId(user.id)
    }).toArray()

    // ترکیب داده‌ها با اطلاعات لایسنس
    const digitalProducts = products.map((product: any) => {
      const orderItem = orderItems.find(item => 
        item.productId.toString() === product._id.toString()
      )
      const order = orders.find(o => 
        o._id.toString() === orderItem?.orderId.toString()
      )

      // یافتن لایسنس‌های مربوط به این محصول
      const productLicenses = userLicenses.filter(license => 
        license.productId.toString() === product._id.toString()
      )

      return {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        fileSize: product.fileSize || 0,
        fileFormat: product.fileFormat || '',
        downloadLimit: product.downloadLimit || 5,
        originalFileUrl: product.fileUrl, // فایل اصلی
        purchaseDate: order?.createdAt || new Date(),
        licenses: productLicenses.map(license => ({
          id: license._id.toString(),
          domain: license.domain,
          licenseKey: license.licenseKey,
          isActive: license.isActive,
          expiresAt: license.expiresAt,
          createdAt: license.createdAt,
          usageCount: license.usageCount || 0,
          lastUsed: license.lastUsed
        })),
        hasActiveLicense: productLicenses.some(license => 
          license.isActive && (!license.expiresAt || new Date(license.expiresAt) > new Date())
        )
      }
    })

    // حذف محصولات تکراری
    const uniqueProducts = digitalProducts.reduce((acc: any[], product) => {
      const existing = acc.find(p => p.id === product.id)
      if (!existing) {
        acc.push(product)
      }
      return acc
    }, [])

    return NextResponse.json({
      success: true,
      data: uniqueProducts
    })

  } catch (error) {
    console.error('Error fetching user digital products:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت محصولات دیجیتال' },
      { status: 500 }
    )
  }
}
