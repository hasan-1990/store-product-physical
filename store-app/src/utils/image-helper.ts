/**
 * Helper function برای حذف عکس
 * استفاده در تمام بخش‌های سایت (محصولات، بلاگ، بنر، اسلایدر، ...)
 */

interface DeleteImageOptions {
  imageUrl: string;
  type?: 'product' | 'blog' | 'banner' | 'slider' | 'category' | 'brand';
  documentId?: string;
}

interface DeleteImageResult {
  success: boolean;
  fileDeleted: boolean;
  databaseUpdated: boolean;
  relatedFilesDeleted?: number;
  message?: string;
  error?: string;
}

/**
 * حذف عکس از سرور و دیتابیس
 * @param options - تنظیمات حذف عکس
 * @returns نتیجه عملیات حذف
 */
export async function deleteImage(options: DeleteImageOptions): Promise<DeleteImageResult> {
  try {
    console.log('🗑️ شروع حذف عکس:', options);

    const response = await fetch('/api/delete-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ عکس با موفقیت حذف شد:', result);
      return result;
    } else {
      console.error('❌ خطا در حذف عکس:', result);
      return {
        success: false,
        fileDeleted: false,
        databaseUpdated: false,
        error: result.error || 'خطا در حذف عکس'
      };
    }
  } catch (error) {
    console.error('💥 خطای شبکه در حذف عکس:', error);
    return {
      success: false,
      fileDeleted: false,
      databaseUpdated: false,
      error: 'خطای شبکه در حذف عکس'
    };
  }
}

/**
 * حذف فایل از URL (فقط نام فایل)
 * برای استفاده قدیمی - این تابع فقط فایل را حذف می‌کند، دیتابیس را خیر
 */
export async function deleteImageFile(imageUrl: string): Promise<boolean> {
  try {
    const fileName = imageUrl.split('/').pop();
    if (!fileName) {
      console.error('❌ نام فایل نامعتبر');
      return false;
    }

    const response = await fetch(`/api/uploads/images/${fileName}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ فایل حذف شد:', fileName);
      return true;
    } else {
      console.error('❌ خطا در حذف فایل:', response.status);
      return false;
    }
  } catch (error) {
    console.error('💥 خطا در حذف فایل:', error);
    return false;
  }
}

/**
 * حذف چندین عکس به صورت همزمان
 */
export async function deleteMultipleImages(
  images: DeleteImageOptions[]
): Promise<{ success: number; failed: number; results: DeleteImageResult[] }> {
  const results: DeleteImageResult[] = [];
  let success = 0;
  let failed = 0;

  for (const img of images) {
    const result = await deleteImage(img);
    results.push(result);
    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed, results };
}
