import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'فایل انتخاب نشده است' },
        { status: 400 }
      )
    }

    // بررسی فرمت فایل
    const allowedFormats = ['.pdf', '.zip', '.rar', '.exe', '.apk', '.ipa', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx']
    const fileExtension = path.extname(file.name).toLowerCase()
    
    if (!allowedFormats.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'فرمت فایل پشتیبانی نمی‌شود' },
        { status: 400 }
      )
    }

    // بررسی حجم فایل (حداکثر 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'حجم فایل نباید بیشتر از 100 مگابایت باشد' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ایجاد پوشه uploads/digital-products
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'digital-products')
    await mkdir(uploadsDir, { recursive: true })

    // تولید نام فایل منحصربه‌فرد
    const uniqueId = uuidv4()
    const fileName = `${uniqueId}${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    // ذخیره فایل
    await writeFile(filePath, buffer)

    // URL فایل
    const fileUrl = `/uploads/digital-products/${fileName}`

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileFormat: fileExtension
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'خطا در آپلود فایل' },
      { status: 500 }
    )
  }
}
