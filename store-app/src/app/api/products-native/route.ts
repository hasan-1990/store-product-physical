// مثال API route با MongoDB Native
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'

export async function GET() {
  try {
    // اتصال به دیتابیس
    const db = await connectDB()
    
    // دریافت محصولات
    const products = await db.products.find({
      active: true,
      featured: true
    }).toArray()

    return NextResponse.json({
      success: true,
      products
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    
    const body = await request.json()
    
    const product = await db.products.insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true
    })

    return NextResponse.json({
      success: true,
      product: {
        id: product.insertedId.toString(),
        ...body
      }
    })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
