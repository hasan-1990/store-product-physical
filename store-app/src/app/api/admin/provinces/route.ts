import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { provincesData } from '@/data/provinces';

interface Province {
  _id?: string;
  province: string;
  cities: string[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// GET - دریافت لیست استان‌ها و شهرها
export async function GET() {
  try {
    const mongodb = await connectDB();
    
    const provinces = await mongodb.provinces.find({}).sort({ province: 1 }).toArray();
    
    return NextResponse.json({
      success: true,
      provinces: provinces
    });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست استان‌ها' },
      { status: 500 }
    );
  }
}

// POST - افزودن/به‌روزرسانی استان‌ها و شهرها
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, provinces: provincesList, provinceId, updateData } = body;
    
    const mongodb = await connectDB();
    const collection = mongodb.provinces;

    switch (action) {
      case 'seed': {
        // پاک کردن داده‌های قبلی و بارگذاری داده‌های جدید
        await collection.deleteMany({});
        
        const dataToInsert = provincesList || provincesData;
        const provincesWithMeta = dataToInsert.map((province: any) => ({
          ...province,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        const result = await collection.insertMany(provincesWithMeta);
        
        return NextResponse.json({
          success: true,
          message: `${result.insertedCount} استان با موفقیت ذخیره شد`,
          insertedCount: result.insertedCount
        });
      }

      case 'update': {
        if (!provinceId) {
          return NextResponse.json(
            { success: false, error: 'شناسه استان الزامی است' },
            { status: 400 }
          );
        }

        const result = await collection.updateOne(
          { _id: provinceId },
          { 
            $set: { 
              ...updateData,
              updatedAt: new Date()
            }
          }
        );

        if (result.matchedCount === 0) {
          return NextResponse.json(
            { success: false, error: 'استان یافت نشد' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'استان با موفقیت به‌روزرسانی شد'
        });
      }

      case 'toggle': {
        if (!provinceId) {
          return NextResponse.json(
            { success: false, error: 'شناسه استان الزامی است' },
            { status: 400 }
          );
        }

        const province = await collection.findOne({ _id: provinceId });
        if (!province) {
          return NextResponse.json(
            { success: false, error: 'استان یافت نشد' },
            { status: 404 }
          );
        }

        const result = await collection.updateOne(
          { _id: provinceId },
          { 
            $set: { 
              enabled: !province.enabled,
              updatedAt: new Date()
            }
          }
        );

        return NextResponse.json({
          success: true,
          message: `استان ${province.enabled ? 'غیرفعال' : 'فعال'} شد`,
          enabled: !province.enabled
        });
      }

      case 'add-city': {
        const { provinceName, cityName } = body;
        
        if (!provinceName || !cityName) {
          return NextResponse.json(
            { success: false, error: 'نام استان و شهر الزامی است' },
            { status: 400 }
          );
        }

        const result = await collection.updateOne(
          { province: provinceName },
          { 
            $addToSet: { cities: cityName },
            $set: { updatedAt: new Date() }
          }
        );

        if (result.matchedCount === 0) {
          return NextResponse.json(
            { success: false, error: 'استان یافت نشد' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'شهر با موفقیت اضافه شد'
        });
      }

      case 'remove-city': {
        const { provinceName, cityName } = body;
        
        if (!provinceName || !cityName) {
          return NextResponse.json(
            { success: false, error: 'نام استان و شهر الزامی است' },
            { status: 400 }
          );
        }

        const result = await collection.updateOne(
          { province: provinceName },
          { 
            $pull: { cities: cityName },
            $set: { updatedAt: new Date() }
          }
        );

        if (result.matchedCount === 0) {
          return NextResponse.json(
            { success: false, error: 'استان یافت نشد' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'شهر با موفقیت حذف شد'
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'عملیات نامعتبر' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in provinces API:', error);
    return NextResponse.json(
      { success: false, error: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}

// DELETE - حذف استان
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get('id');
    
    if (!provinceId) {
      return NextResponse.json(
        { success: false, error: 'شناسه استان الزامی است' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();
    
    const result = await mongodb.provinces.deleteOne({ _id: new ObjectId(provinceId) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'استان یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'استان با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting province:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف استان' },
      { status: 500 }
    );
  }
}