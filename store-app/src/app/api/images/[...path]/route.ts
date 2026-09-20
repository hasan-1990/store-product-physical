import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * API برای سرو کردن تصاویر با fallback به placeholder
 * این API وقتی تصویر اصلی پیدا نشد، placeholder را برمی‌گرداند
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const imagePath = path.join('/');
    const fullPath = join(process.cwd(), 'public', 'uploads', imagePath);
    const placeholderPath = join(process.cwd(), 'public', 'placeholder.jpg');

    // اگر فایل وجود دارد، آن را برگردان
    if (existsSync(fullPath)) {
      const fileBuffer = await readFile(fullPath);
      const ext = imagePath.split('.').pop()?.toLowerCase();
      
      let contentType = 'image/jpeg';
      if (ext === 'png') contentType = 'image/png';
      else if (ext === 'gif') contentType = 'image/gif';
      else if (ext === 'webp') contentType = 'image/webp';
      else if (ext === 'svg') contentType = 'image/svg+xml';

      return new NextResponse(fileBuffer as any, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // اگر فایل وجود ندارد، placeholder را برگردان
    if (existsSync(placeholderPath)) {
      const placeholderBuffer = await readFile(placeholderPath);
      return new NextResponse(placeholderBuffer as any, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // اگر placeholder هم نبود، یک SVG خالی برگردان
    const svgPlaceholder = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#e5e7eb"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="16">
          تصویر یافت نشد
        </text>
      </svg>
    `;

    return new NextResponse(svgPlaceholder, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Image not found', { status: 404 });
  }
}
