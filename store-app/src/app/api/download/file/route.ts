import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import jwt from 'jsonwebtoken'
import { getJwtSecret } from '@/lib/secrets'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'توکن دانلود مورد نیاز است' },
        { status: 400 }
      )
    }

    // تایید توکن
    let decoded: any
    try {
      decoded = jwt.verify(token, getJwtSecret())
    } catch (error) {
      return NextResponse.json(
        { error: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      )
    }

    const { downloadUrl } = decoded

    if (!downloadUrl) {
      return NextResponse.json(
        { error: 'آدرس فایل یافت نشد' },
        { status: 404 }
      )
    }

    // مسیر فایل
    const filePath = path.join(process.cwd(), 'public', downloadUrl)

    try {
      const file = await readFile(filePath)
      const fileName = path.basename(downloadUrl)
      const fileExtension = path.extname(fileName)

      // تعیین نوع فایل
      let contentType = 'application/octet-stream'
      if (fileExtension === '.pdf') contentType = 'application/pdf'
      else if (fileExtension === '.zip') contentType = 'application/zip'
      else if (fileExtension === '.rar') contentType = 'application/x-rar-compressed'

      return new NextResponse(file as any, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': file.length.toString(),
        },
      })

    } catch (fileError) {
      console.error('File read error:', fileError)
      return NextResponse.json(
        { error: 'فایل یافت نشد' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'خطا در دانلود فایل' },
      { status: 500 }
    )
  }
}
