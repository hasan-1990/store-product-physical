import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'

export async function GET() {
  try {
    const mongodb = await connectDB();
    const provinces = await mongodb.provinces.find({
      enabled: true
    }).sort({ province: 1 }).toArray();

    return NextResponse.json({ 
      success: true,
      provinces: provinces
    })
  } catch (error) {
    console.error('Error fetching provinces:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست استان‌ها' },
      { status: 500 }
    )
  }
}
