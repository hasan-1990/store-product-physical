// Client-side URL utilities
'use client';
import { slugify } from '@/utils/helpers';

// کش تنظیمات برای بهبود عملکرد
let cachedSettings: any = null;
let settingsExpiry: number = 0;

// دریافت تنظیمات URL از API
async function getUrlSettings() {
  // بررسی کش
  if (cachedSettings && Date.now() < settingsExpiry) {
    return cachedSettings;
  }

  try {
    const response = await fetch('/api/admin/seo/url-settings');
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        cachedSettings = data.data;
        settingsExpiry = Date.now() + 5 * 60 * 1000; // 5 دقیقه کش
        return cachedSettings;
      }
    }
  } catch (error) {
    console.warn('خطا در دریافت تنظیمات URL:', error);
  }

  // تنظیمات پیش‌فرض در صورت خطا
  return {
    urlStructure: 'id-only',
    categoryPrefix: '',
    productPrefix: '',
    removeStopWords: false,
    slugLanguage: 'persian',
    maxSlugLength: 50,
    separatorType: '-',
    includeId: true,
    removeNumbers: false
  };
}

// تولید URL محصول بر اساس تنظیمات - نسخه client
export const generateProductUrl = (product: any, category?: any): string => {
  // اول از localStorage تنظیمات را بخوانیم اگر ممکن باشد
  let settings: { urlStructure: 'category-product' | 'product-only' | 'id-only'; includeId: boolean } = {
    urlStructure: 'category-product', // ساختار کامل: دسته‌ها + محصول + ID
    includeId: true
  };
  
  try {
    if (typeof window !== 'undefined' && localStorage.getItem('urlSettings')) {
      const stored = JSON.parse(localStorage.getItem('urlSettings') || '{}');
      // اطمینان از مقادیر ضروری
      settings = {
        urlStructure: stored.urlStructure || 'category-product',
        includeId: typeof stored.includeId === 'boolean' ? stored.includeId : true
      } as any;
    }
  } catch (e) {
    // ignore localStorage errors
  }

  // استفاده از sequential ID اگر موجود باشد، در غیر این صورت از _id استفاده کن
  const productId = product.sequentialId || product.id || product._id;
  
  // ایجاد category path از categoryPath یا category object
  let categoryPathStr = '';
  
  if (product.categoryPath && Array.isArray(product.categoryPath)) {
    // اگر categoryPath موجود است، از آن استفاده کن
    categoryPathStr = product.categoryPath.map((c: any) => c.slug).join('/');
  } else if (category && category.slug) {
    // اگر category داده شده، از آن استفاده کن
    categoryPathStr = category.slug;
  } else if (product.category && typeof product.category === 'object' && product.category.slug) {
    // اگر product.category object است
    categoryPathStr = product.category.slug;
  }
  
  switch (settings.urlStructure) {
    case 'category-product':
      if (categoryPathStr && product.slug) {
        return settings.includeId 
          ? `/products/${categoryPathStr}/${product.slug}-${productId}`
          : `/products/${categoryPathStr}/${product.slug}`;
      } else if (product.slug) {
        return settings.includeId
          ? `/products/${product.slug}-${productId}`
          : `/products/${product.slug}`;
      }
      // fallback به ID اگر slug موجود نباشد
      return `/products/${productId}`;
      
    case 'product-only':
      if (product.slug) {
        return settings.includeId
          ? `/products/${product.slug}-${productId}`
          : `/products/${product.slug}`;
      }
      // fallback به ID اگر slug موجود نباشد
      return `/products/${productId}`;
      
    case 'id-only':
    default:
      return `/products/${productId}`;
  }
};

// نسخه async برای استفاده در جاهایی که میتونیم منتظر بمونیم
export const generateProductUrlAsync = async (product: any, category?: any): Promise<string> => {
  const settings = await getUrlSettings();
  
  // استفاده از sequential ID اگر موجود باشد، در غیر این صورت از _id استفاده کن
  const productId = product.sequentialId || product.id || product._id;
  
  switch (settings.urlStructure) {
      case 'category-product': {
        let categorySlug: string;
        if (product.categoryPath && Array.isArray(product.categoryPath) && product.categoryPath.length) {
          categorySlug = product.categoryPath.map((c: any) => c.slug).join('/');
        } else if (category?.slug) {
          categorySlug = category.slug;
        } else if (category?.name) {
          categorySlug = slugify(category.name);
        } else {
          categorySlug = 'products';
        }
        const productSlug = product.slug ? slugify(product.slug) : slugify(product.name);
        return settings.includeId
          ? `/products/${categorySlug}/${productSlug}-${productId}`
          : `/products/${categorySlug}/${productSlug}`;
      }
      
    case 'product-only':
      case 'product-only': {
        const prodSlug = product.slug ? slugify(product.slug) : slugify(product.name);
        return settings.includeId ? `/products/${prodSlug}-${productId}` : `/products/${prodSlug}`;
      }
      
    case 'id-only':
    default:
      return `/products/${productId}`;
  }
};

// تولید slug از متن فارسی
export const generateSlug = (text: string): string => {
  if (!text) return '';
  
  let slug = text.toLowerCase();
  
  // تبدیل کاراکترهای فارسی
  slug = slug
    .replace(/[آا]/g, 'a')
    .replace(/[ب]/g, 'b')
    .replace(/[پ]/g, 'p')
    .replace(/[ت]/g, 't')
    .replace(/[ث]/g, 's')
    .replace(/[ج]/g, 'j')
    .replace(/[چ]/g, 'ch')
    .replace(/[ح]/g, 'h')
    .replace(/[خ]/g, 'kh')
    .replace(/[د]/g, 'd')
    .replace(/[ذ]/g, 'z')
    .replace(/[ر]/g, 'r')
    .replace(/[ز]/g, 'z')
    .replace(/[ژ]/g, 'zh')
    .replace(/[س]/g, 's')
    .replace(/[ش]/g, 'sh')
    .replace(/[ص]/g, 's')
    .replace(/[ض]/g, 'z')
    .replace(/[ط]/g, 't')
    .replace(/[ظ]/g, 'z')
    .replace(/[ع]/g, 'a')
    .replace(/[غ]/g, 'gh')
    .replace(/[ف]/g, 'f')
    .replace(/[ق]/g, 'gh')
    .replace(/[ک]/g, 'k')
    .replace(/[گ]/g, 'g')
    .replace(/[ل]/g, 'l')
    .replace(/[م]/g, 'm')
    .replace(/[ن]/g, 'n')
    .replace(/[و]/g, 'v')
    .replace(/[ه]/g, 'h')
    .replace(/[ی]/g, 'y')
    // حذف کاراکترهای خاص
    .replace(/[^\w\s-]/g, '')
    // تبدیل فاصله‌ها به خط تیره
    .replace(/\s+/g, '-')
    // حذف خط تیره‌های اضافی
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return slug;
};

// بررسی معتبر بودن ObjectId
export const isValidObjectId = (id: string): boolean => {
  return /^[a-f\d]{24}$/i.test(id);
};