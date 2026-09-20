// Server-side URL utilities
import { getUrlSettings } from './url-settings';

// تولید slug از متن فارسی
export const generateSlug = (text: string, settings?: any): string => {
  if (!text) return '';
  
  const urlSettings = settings || getUrlSettings();
  let slug = text.toLowerCase();
  
  // حذف کاراکترهای خاص
  slug = slug.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s\-]/g, '');
  
  // جایگزینی فاصله‌ها با خط تیره
  slug = slug.replace(/\s+/g, urlSettings.separatorType || '-');
  
  // حذف فقط خط تیره‌های بیش از 2 تا متوالی (می‌تونی 1 یا 2 خط فاصله بزاری)
  slug = slug.replace(/\-{3,}/g, '-');
  
  // حذف خط تیره از ابتدا و انتها
  slug = slug.replace(/^-+|-+$/g, '');
  
  // محدود کردن طول
  if (urlSettings.maxSlugLength && slug.length > urlSettings.maxSlugLength) {
    slug = slug.substring(0, urlSettings.maxSlugLength);
    slug = slug.replace(/\-[^\-]*$/, ''); // حذف کلمه نیمه کاره در انتها
  }
  
  return slug;
};

// تولید URL محصول بر اساس تنظیمات
export const generateProductUrl = (product: any, category?: any): string => {
  const settings = getUrlSettings();
  
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
        if (settings.includeId) {
          return `/products/${categoryPathStr}/${product.slug}-${productId}`;
        } else {
          return `/products/${categoryPathStr}/${product.slug}`;
        }
      } else if (product.slug) {
        if (settings.includeId) {
          return `/products/${product.slug}-${productId}`;
        } else {
          return `/products/${product.slug}`;
        }
      }
      break;
      
    case 'product-only':
      const prodSlug = product.slug || generateSlug(product.name);
      if (settings.includeId) {
        return `/products/${prodSlug}-${productId}`;
      } else {
        return `/products/${prodSlug}`;
      }
      
    case 'id-only':
    default:
      return `/products/${productId}`;
  }
  
  // fallback
  return `/products/${productId}`;
};

// پارس URL و استخراج اطلاعات برای nested categories
export const parseProductUrl = (slugs: string[]): { productSlug?: string, categoryPath?: string[], productId?: string } => {
  // استراتژی پارس کردن URL برای ساختارهای مختلف:
  // 1. /products/{id} → productId فقط
  // 2. /products/{slug} → productSlug فقط
  // 3. /products/{slug}-{id} → productSlug + productId
  // 4. /products/{cat1}/{cat2}/{slug} → categoryPath + productSlug
  // 5. /products/{cat1}/{cat2}/{slug}-{id} → categoryPath + productSlug + productId
  
  console.log('🔍 parseProductUrl - Input slugs:', slugs);
  
  if (slugs.length === 0) return {};

  const detectSlugId = (segment: string) => {
    if (!segment.includes('-')) return null;
    const parts = segment.split('-');
    if (parts.length < 2) return null;
    const potentialId = parts[parts.length - 1];
    
    // تشخیص ID: هر عدد (1 رقمی یا بیشتر) یا ObjectId
    if (/^\d+$/.test(potentialId) || /^[a-f\d]{24}$/i.test(potentialId)) {
      const base = parts.slice(0, -1).join('-');
      // اگر base خالی است، یعنی فقط عدد داریم مثل "1" یا "2"
      // در این صورت null برمی‌گردانیم تا به عنوان ID خالص در نظر گرفته شود
      if (!base) return null;
      return { base, id: potentialId };
    }
    return null;
  };

  // ✅ Single segment: ممکن است ID خالص، slug خالص، یا slug-id باشد
  if (slugs.length === 1) {
    const seg = slugs[0];
    
    // بررسی ID خالص (فقط عدد یا ObjectId)
    if (/^\d+$/.test(seg) || /^[a-f\d]{24}$/i.test(seg)) {
      console.log('✅ Detected pure ID:', seg);
      return { productId: seg };
    }
    
    // بررسی slug-id pattern
    const parsed = detectSlugId(seg);
    if (parsed) {
      console.log('✅ Detected slug-id:', parsed.base, parsed.id);
      return { productSlug: parsed.base, productId: parsed.id };
    }
    
    // در غیر این صورت، slug خالص است
    console.log('✅ Detected pure slug:', seg);
    return { productSlug: seg };
  }

  // ✅ Multiple segments: ساختار سلسله‌مراتبی
  // فرمت: /products/cat1/cat2/.../catN/product-slug یا product-slug-id
  const last = slugs[slugs.length - 1];
  const catSegs = slugs.slice(0, -1);
  
  console.log('✅ Multi-level detected - Categories:', catSegs, 'Last segment:', last);
  
  // بررسی آیا آخرین segment شامل ID است
  const parsed = detectSlugId(last);
  if (parsed) {
    console.log('✅ Last segment has ID - Slug:', parsed.base, 'ID:', parsed.id);
    return { categoryPath: catSegs, productSlug: parsed.base, productId: parsed.id };
  }
  
  // بررسی آیا آخرین segment فقط ID است
  if (/^\d+$/.test(last) || /^[a-f\d]{24}$/i.test(last)) {
    console.log('✅ Last segment is pure ID:', last);
    return { categoryPath: catSegs, productId: last };
  }
  
  // در غیر این صورت، آخرین segment یک slug خالص است
  console.log('✅ Last segment is pure slug:', last);
  return { categoryPath: catSegs, productSlug: last };
};

// بررسی معتبر بودن ObjectId یا sequential ID
export const isValidObjectId = (id: string): boolean => {
  return /^[a-f\d]{24}$/i.test(id);
};

// بررسی معتبر بودن sequential ID
export const isValidSequentialId = (id: string): boolean => {
  return /^\d+$/.test(id);
};

// بررسی معتبر بودن هر نوع ID محصول
export const isValidProductId = (id: string): boolean => {
  return isValidObjectId(id) || isValidSequentialId(id);
};

// اصافه کردن تابع‌های قدیمی برای سازگاری
export { getUrlSettings } from './url-settings';