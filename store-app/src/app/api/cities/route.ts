import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provinceId = searchParams.get('provinceId')

    if (!provinceId) {
      return NextResponse.json(
        { error: 'Province ID is required' },
        { status: 400 }
      )
    }

    const mongodb = await connectDB();
    const cities = await mongodb.cities.find({
      provinceId: provinceId,
      active: true
    }).sort({ order: 1 }).project({
      _id: 1,
      name: 1,
      slug: 1
    }).toArray();

    return NextResponse.json({ cities })
  } catch (error) {
    console.error('Error fetching cities:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
