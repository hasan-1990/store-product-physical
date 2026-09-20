import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

/**
 * API فایل منیجر برای مدیریت فایل‌های دیجیتال
 * GET - لیست فایل‌ها و پوشه‌ها
 * POST - آپلود فایل
 * PUT - تغییر نام فایل/پوشه
 * DELETE - حذف فایل/پوشه
 */

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'digital-products');

// اطمینان از وجود پوشه اصلی
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * لیست فایل‌ها و پوشه‌ها
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || '';
    
    const targetDir = path.join(UPLOAD_DIR, folder);

    // بررسی امنیت - جلوگیری از دسترسی به خارج از پوشه مجاز
    if (!targetDir.startsWith(UPLOAD_DIR)) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    if (!fs.existsSync(targetDir)) {
      return NextResponse.json(
        { success: false, error: 'پوشه یافت نشد' },
        { status: 404 }
      );
    }

    const items = fs.readdirSync(targetDir);
    const files: any[] = [];
    const folders: any[] = [];

    items.forEach((item) => {
      const itemPath = path.join(targetDir, item);
      const stats = fs.statSync(itemPath);
      const relativePath = path.relative(UPLOAD_DIR, itemPath);

      if (stats.isDirectory()) {
        folders.push({
          name: item,
          path: relativePath,
          type: 'folder',
          size: 0,
          modified: stats.mtime,
          itemCount: fs.readdirSync(itemPath).length
        });
      } else {
        files.push({
          name: item,
          path: relativePath,
          type: 'file',
          size: stats.size,
          modified: stats.mtime,
          extension: path.extname(item).toLowerCase(),
          url: `/uploads/digital-products/${relativePath.replace(/\\/g, '/')}`
        });
      }
    });

    return NextResponse.json({
      success: true,
      currentPath: folder,
      folders: folders.sort((a, b) => a.name.localeCompare(b.name)),
      files: files.sort((a, b) => a.name.localeCompare(b.name))
    });
  } catch (error) {
    console.error('❌ خطا در لیست فایل‌ها:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری فایل‌ها' },
      { status: 500 }
    );
  }
}

/**
 * آپلود فایل
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || '';
    const action = formData.get('action') as string;

    // ایجاد پوشه جدید
    if (action === 'create-folder') {
      const folderName = formData.get('folderName') as string;
      if (!folderName) {
        return NextResponse.json(
          { success: false, error: 'نام پوشه الزامی است' },
          { status: 400 }
        );
      }

      const newFolderPath = path.join(UPLOAD_DIR, folder, folderName);
      
      if (fs.existsSync(newFolderPath)) {
        return NextResponse.json(
          { success: false, error: 'پوشه با این نام وجود دارد' },
          { status: 400 }
        );
      }

      await mkdir(newFolderPath, { recursive: true });
      
      return NextResponse.json({
        success: true,
        message: 'پوشه با موفقیت ایجاد شد',
        folder: {
          name: folderName,
          path: path.relative(UPLOAD_DIR, newFolderPath)
        }
      });
    }

    // آپلود فایل
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'فایلی انتخاب نشده' },
        { status: 400 }
      );
    }

    const targetDir = path.join(UPLOAD_DIR, folder);
    
    if (!fs.existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // نام فایل منحصر به فرد
    const ext = path.extname(file.name);
    const nameWithoutExt = path.basename(file.name, ext);
    let fileName = file.name;
    let filePath = path.join(targetDir, fileName);
    let counter = 1;

    while (fs.existsSync(filePath)) {
      fileName = `${nameWithoutExt}-${counter}${ext}`;
      filePath = path.join(targetDir, fileName);
      counter++;
    }

    await writeFile(filePath, buffer);

    const stats = fs.statSync(filePath);
    const relativePath = path.relative(UPLOAD_DIR, filePath);

    return NextResponse.json({
      success: true,
      message: 'فایل با موفقیت آپلود شد',
      file: {
        name: fileName,
        path: relativePath,
        type: 'file',
        size: stats.size,
        modified: stats.mtime,
        extension: ext.toLowerCase(),
        url: `/uploads/digital-products/${relativePath.replace(/\\/g, '/')}`
      }
    });
  } catch (error) {
    console.error('❌ خطا در آپلود فایل:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در آپلود فایل' },
      { status: 500 }
    );
  }
}

/**
 * تغییر نام فایل/پوشه، کپی یا انتقال
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { oldPath, newName, action, targetPath } = body;

    // عملیات تغییر نام
    if (action === 'rename') {
      if (!oldPath || !newName) {
        return NextResponse.json(
          { success: false, error: 'اطلاعات ناقص است' },
          { status: 400 }
        );
      }

      const oldFullPath = path.join(UPLOAD_DIR, oldPath);
      const newFullPath = path.join(path.dirname(oldFullPath), newName);

      if (!fs.existsSync(oldFullPath)) {
        return NextResponse.json(
          { success: false, error: 'فایل یافت نشد' },
          { status: 404 }
        );
      }

      if (fs.existsSync(newFullPath)) {
        return NextResponse.json(
          { success: false, error: 'فایل با این نام وجود دارد' },
          { status: 400 }
        );
      }

      fs.renameSync(oldFullPath, newFullPath);

      return NextResponse.json({
        success: true,
        message: 'نام با موفقیت تغییر کرد',
        newPath: path.relative(UPLOAD_DIR, newFullPath)
      });
    }

    // عملیات کپی
    if (action === 'copy') {
      if (!oldPath || !targetPath) {
        return NextResponse.json(
          { success: false, error: 'اطلاعات ناقص است' },
          { status: 400 }
        );
      }

      const sourcePath = path.join(UPLOAD_DIR, oldPath);
      const fileName = newName || path.basename(sourcePath);
      const targetDir = path.join(UPLOAD_DIR, targetPath);
      let destPath = path.join(targetDir, fileName);

      if (!fs.existsSync(sourcePath)) {
        return NextResponse.json(
          { success: false, error: 'فایل مبدا یافت نشد' },
          { status: 404 }
        );
      }

      if (!fs.existsSync(targetDir)) {
        return NextResponse.json(
          { success: false, error: 'پوشه مقصد یافت نشد' },
          { status: 404 }
        );
      }

      // اگر فایل وجود دارد، نام جدید بده
      let counter = 1;
      const ext = path.extname(fileName);
      const nameWithoutExt = path.basename(fileName, ext);
      
      while (fs.existsSync(destPath)) {
        destPath = path.join(targetDir, `${nameWithoutExt}_copy${counter}${ext}`);
        counter++;
      }

      // کپی فایل یا پوشه
      const stats = fs.statSync(sourcePath);
      if (stats.isDirectory()) {
        copyRecursiveSync(sourcePath, destPath);
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }

      return NextResponse.json({
        success: true,
        message: 'کپی با موفقیت انجام شد',
        newPath: path.relative(UPLOAD_DIR, destPath)
      });
    }

    // عملیات انتقال (Move)
    if (action === 'move') {
      if (!oldPath || !targetPath) {
        return NextResponse.json(
          { success: false, error: 'اطلاعات ناقص است' },
          { status: 400 }
        );
      }

      const sourcePath = path.join(UPLOAD_DIR, oldPath);
      const fileName = newName || path.basename(sourcePath);
      const targetDir = path.join(UPLOAD_DIR, targetPath);
      const destPath = path.join(targetDir, fileName);

      if (!fs.existsSync(sourcePath)) {
        return NextResponse.json(
          { success: false, error: 'فایل مبدا یافت نشد' },
          { status: 404 }
        );
      }

      if (!fs.existsSync(targetDir)) {
        return NextResponse.json(
          { success: false, error: 'پوشه مقصد یافت نشد' },
          { status: 404 }
        );
      }

      if (fs.existsSync(destPath)) {
        return NextResponse.json(
          { success: false, error: 'فایل با این نام در مقصد وجود دارد' },
          { status: 400 }
        );
      }

      fs.renameSync(sourcePath, destPath);

      return NextResponse.json({
        success: true,
        message: 'انتقال با موفقیت انجام شد',
        newPath: path.relative(UPLOAD_DIR, destPath)
      });
    }

    return NextResponse.json(
      { success: false, error: 'عملیات نامعتبر است' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ خطا در عملیات:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در انجام عملیات' },
      { status: 500 }
    );
  }
}

// تابع کمکی برای کپی بازگشتی پوشه‌ها
function copyRecursiveSync(src: string, dest: string) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

/**
 * حذف فایل/پوشه
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemPath = searchParams.get('path');

    if (!itemPath) {
      return NextResponse.json(
        { success: false, error: 'مسیر فایل الزامی است' },
        { status: 400 }
      );
    }

    const fullPath = path.join(UPLOAD_DIR, itemPath);

    if (!fullPath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { success: false, error: 'فایل یافت نشد' },
        { status: 404 }
      );
    }

    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }

    return NextResponse.json({
      success: true,
      message: stats.isDirectory() ? 'پوشه حذف شد' : 'فایل حذف شد'
    });
  } catch (error) {
    console.error('❌ خطا در حذف:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف' },
      { status: 500 }
    );
  }
}
