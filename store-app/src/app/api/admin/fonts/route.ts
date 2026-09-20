import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET - دریافت تمام فونت‌ها
export async function GET() {
  try {
    const mongodb = await connectDB();
    
    // فقط دریافت فونت‌های آپلود شده (بدون فونت‌های سیستم)
    const uploadedFonts = await mongodb.fonts.find({}).toArray();

    return NextResponse.json({
      success: true,
      fonts: uploadedFonts
    });
  } catch (error) {
    console.error('خطا در دریافت فونت‌ها:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت فونت‌ها' },
      { status: 500 }
    );
  }
}

// POST - آپلود فونت‌های جدید (چندتایی در یک مرحله)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // دریافت اطلاعات فونت
    const fontName = formData.get('fontName') as string;
    const fontFamily = formData.get('fontFamily') as string;
    
    if (!fontName || !fontFamily) {
      return NextResponse.json(
        { success: false, error: 'نام فونت و خانواده الزامی است' },
        { status: 400 }
      );
    }

    // دریافت تمام فایل‌ها
    const files: File[] = [];
    let index = 0;
    while (formData.get(`file_${index}`)) {
      const file = formData.get(`file_${index}`) as File;
      if (file) {
        files.push(file);
      }
      index++;
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'حداقل یک فایل فونت الزامی است' },
        { status: 400 }
      );
    }

    // اتصال به دیتابیس
    const mongodb = await connectDB();
    
    // ایجاد پوشه fonts اگر وجود ندارد
    const fontsDir = path.join(process.cwd(), 'public', 'fonts');
    try {
      await mkdir(fontsDir, { recursive: true });
    } catch (error) {
      // پوشه از قبل وجود دارد
    }

    // پردازش تمام فایل‌ها
    const fontWeights = [];
    
    for (const file of files) {
      // تشخیص خودکار وزن و استایل
      const weight = detectFontWeight(file.name);
      const style = detectFontStyle(file.name);
      
      // تولید نام فایل یکتا (بدون پسوند اضافه)
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `${fontFamily.replace(/\s+/g, '_')}_${weight}_${style}_${timestamp}_${randomStr}.${fileExtension}`;
      const filePath = path.join(fontsDir, fileName);
      
      // ذخیره فایل
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      
      // اضافه کردن اطلاعات وزن
      fontWeights.push({
        weight,
        style,
        filename: fileName,
        url: `/fonts/${fileName}`
      });
    }

    // بررسی وجود فونت با این نام
    const existingFont = await mongodb.fonts.findOne({ family: fontFamily });
    
    if (existingFont) {
      // اضافه کردن وزن‌های جدید به فونت موجود
      const updatedWeights = [...existingFont.weights];
      
      // حذف وزن‌های تکراری و اضافه کردن جدیدها
      fontWeights.forEach(newWeight => {
        const existingIndex = updatedWeights.findIndex(
          w => w.weight === newWeight.weight && w.style === newWeight.style
        );
        if (existingIndex >= 0) {
          updatedWeights[existingIndex] = newWeight; // جایگزینی
        } else {
          updatedWeights.push(newWeight); // اضافه کردن
        }
      });
      
      await mongodb.fonts.updateOne(
        { _id: existingFont._id },
        { 
          $set: { 
            weights: updatedWeights,
            updatedAt: new Date()
          }
        }
      );
    } else {
      // ایجاد فونت جدید
      await mongodb.fonts.insertOne({
        name: fontName,
        family: fontFamily,
        weights: fontWeights,
        isActive: false,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'فونت با موفقیت آپلود شد',
      fontFamily,
      weightsCount: fontWeights.length
    });
  } catch (error) {
    console.error('خطا در آپلود فونت:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در آپلود فونت' },
      { status: 500 }
    );
  }
}

// PUT - تغییر وضعیت فونت (با سیستم یک فونت فعال)
export async function PUT(request: NextRequest) {
  try {
    const { fontId, isActive, isDefault } = await request.json();
    
    console.log('🎨 درخواست تغییر فونت:', { fontId, isActive, isDefault });

    if (!fontId || typeof isActive !== 'boolean') {
      console.log('❌ خطا: پارامترهای نامعتبر');
      return NextResponse.json(
        { success: false, error: 'شناسه فونت و وضعیت الزامی است' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();

    // اگر فونت فعال یا پیش‌فرض می‌شود، ابتدا همه فونت‌ها را غیرفعال کن
    if (isActive || isDefault) {
      console.log('🔄 در حال غیرفعال کردن همه فونت‌ها...');
      
      // غیرفعال کردن همه فونت‌های آپلود شده
      const uploadedResult = await mongodb.fonts.updateMany(
        {},
        { $set: { isActive: false, isDefault: false, updatedAt: new Date() } }
      );
      console.log(`📁 فونت‌ها غیرفعال شدند: ${uploadedResult.modifiedCount} فونت`);
    }

    // فعال کردن فونت انتخابی
    console.log(`📁 در حال فعال کردن فونت: ${fontId}`);
      
    // فونت آپلود شده
    const result = await mongodb.fonts.updateOne(
      { _id: new ObjectId(fontId) },
      { 
        $set: { 
          isActive: isActive || isDefault,
          isDefault: isDefault || false,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      console.log(`❌ فونت یافت نشد: ${fontId}`);
      return NextResponse.json(
        { success: false, error: 'فونت مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    // دریافت اطلاعات فونت برای لاگ
    const updatedFont = await mongodb.fonts.findOne({ _id: new ObjectId(fontId) });
    console.log(`✅ فونت فعال شد: ${updatedFont?.name} (${fontId})`);
    console.log(`📊 وضعیت: فعال=${isActive || isDefault}, پیش‌فرض=${isDefault || false}`);

    return NextResponse.json({
      success: true,
      message: `فونت ${updatedFont?.name} فعال شد`
    });
  } catch (error) {
    console.error('❌ خطا در به‌روزرسانی فونت:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی فونت' },
      { status: 500 }
    );
  }
}

// DELETE - حذف فونت
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const fontId = url.searchParams.get('fontId');

    if (!fontId) {
      return NextResponse.json(
        { success: false, error: 'شناسه فونت الزامی است' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();
    
    // یافتن فونت
    const font = await mongodb.fonts.findOne({ _id: new ObjectId(fontId) });
    
    if (!font) {
      return NextResponse.json(
        { success: false, error: 'فونت مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی فونت پیش‌فرض
    if (font.isDefault) {
      return NextResponse.json(
        { success: false, error: 'فونت پیش‌فرض قابل حذف نیست' },
        { status: 400 }
      );
    }

    // حذف فونت از دیتابیس
    await mongodb.fonts.deleteOne({ _id: new ObjectId(fontId) });

    return NextResponse.json({
      success: true,
      message: 'فونت با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('خطا در حذف فونت:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف فونت' },
      { status: 500 }
    );
  }
}

// تشخیص وزن فونت از نام فایل
function detectFontWeight(filename: string): number {
  const lowerName = filename.toLowerCase();
  
  if (lowerName.includes('thin') || lowerName.includes('100')) return 100;
  if (lowerName.includes('extralight') || lowerName.includes('200')) return 200;
  if (lowerName.includes('light') || lowerName.includes('300')) return 300;
  if (lowerName.includes('regular') || lowerName.includes('normal') || lowerName.includes('400')) return 400;
  if (lowerName.includes('medium') || lowerName.includes('500')) return 500;
  if (lowerName.includes('semibold') || lowerName.includes('600')) return 600;
  if (lowerName.includes('bold') || lowerName.includes('700')) return 700;
  if (lowerName.includes('extrabold') || lowerName.includes('800')) return 800;
  if (lowerName.includes('black') || lowerName.includes('heavy') || lowerName.includes('900')) return 900;
  
  // بررسی اعداد مستقیم
  const weightMatch = lowerName.match(/[_\-\s]([1-9]00)[_\-\s\.]/);
  if (weightMatch) {
    const weight = parseInt(weightMatch[1]);
    if (weight >= 100 && weight <= 900 && weight % 100 === 0) {
      return weight;
    }
  }
  
  return 400; // پیش‌فرض
}

// تشخیص استایل فونت از نام فایل
function detectFontStyle(filename: string): 'normal' | 'italic' {
  const lowerName = filename.toLowerCase();
  return lowerName.includes('italic') || lowerName.includes('oblique') || lowerName.includes('slanted') ? 'italic' : 'normal';
}