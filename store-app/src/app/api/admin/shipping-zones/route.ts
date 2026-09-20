import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const zoneSchema = z.object({
  name: z.string().min(1),
  cities: z.array(z.string()),
  provinces: z.array(z.string()),
  multiplier: z.number().min(0),
  pricePerKg: z.number().min(0),
});

export async function GET() {
  try {
    const db = await connectDB();
    const zones = await db.shippingZones.find({}).toArray();
    return NextResponse.json({ success: true, data: zones });
  } catch (error) {
    console.error('Error fetching shipping zones:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch zones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = zoneSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });
    }

    const db = await connectDB();
    const result = await db.shippingZones.insertOne({
      ...validation.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, data: { ...validation.data, _id: result.insertedId } });
  } catch (error) {
    console.error('Error creating shipping zone:', error);
    return NextResponse.json({ success: false, error: 'Failed to create zone' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const validation = zoneSchema.safeParse(data);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 });
    }

    const db = await connectDB();
    const result = await db.shippingZones.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...validation.data,
          updatedAt: new Date(),
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Zone not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { ...validation.data, _id: id } });
  } catch (error) {
    console.error('Error updating shipping zone:', error);
    return NextResponse.json({ success: false, error: 'Failed to update zone' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const db = await connectDB();
    const result = await db.shippingZones.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Zone not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shipping zone:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete zone' }, { status: 500 });
  }
}
