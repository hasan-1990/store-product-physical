// Server-side URL utilities
import { getUrlSettings } from './url-settings';

// تولید slug از متن فارسی
export const generateSlug = (text: string, settings?: any): string => {
  if (!text) return '';
  
  const urlSettings = settings || getUrlSettings();
  let slug = text.toLowerCase();
  
  // حذف کاراکترهای خاص (حفظ خط فاصله -)
  slug = slug.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s\-]/g, '');
  
  // جایگزینی فاصله‌ها با خط تیره (حفظ خط فاصله‌های موجود)
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
  const cat = category || product.category;

  // استفاده از sequential ID با پیشوند tst- یا fallback به _id
  const productId = product.sequentialId
    ? `tst-${product.sequentialId}`
    : product.id || product._id;

  switch (settings.urlStructure) {
    case 'category-product':
      // استفاده از categoryPath برای پشتیبانی از دسته‌بندی‌های تودرتو
      if (product.categoryPath && Array.isArray(product.categoryPath) && product.categoryPath.length > 0) {
        const categorySlugPath = product.categoryPath.map((c: any) => c.slug).join('/');
        return `/products/${categorySlugPath}/${productId}`;
      } else if (cat && cat.slug) {
        return `/products/${cat.slug}/${productId}`;
      } else if (product.slug) {
        return settings.includeId
          ? `/products/${product.slug}/${productId}`
          : `/products/${product.slug}`;
      }
      break;

    case 'product-only':
      if (product.slug) {
        return settings.includeId
          ? `/products/${product.slug}/${productId}`
          : `/products/${product.slug}`;
      }
      break;

    case 'id-only':
    default:
      return `/products/${productId}`;
  }

  // fallback به ID اگر slug موجود نباشد
  return `/products/${productId}`;
};

// پارس URL و استخراج اطلاعات
export const parseProductUrl = (slugs: string[]): { productSlug?: string, categorySlug?: string, productId?: string } => {
  const settings = getUrlSettings();
  
  if (slugs.length === 1) {
    const slug = slugs[0];
    
    // اگر فقط ID باشد
    if (/^[a-f\d]{24}$/i.test(slug)) {
      return { productId: slug };
    }
    
    // اگر slug + ID باشد
    if (settings.includeId && slug.includes('-')) {
      const parts = slug.split('-');
      const potentialId = parts[parts.length - 1];
      if (/^[a-f\d]{24}$/i.test(potentialId)) {
        return {
          productSlug: parts.slice(0, -1).join('-'),
          productId: potentialId
        };
      }
    }
    
    return { productSlug: slug };
  }
  
  if (slugs.length === 2) {
    const [categorySlug, productPart] = slugs;
    
    // اگر ID در انتها باشد
    if (settings.includeId && productPart.includes('-')) {
      const parts = productPart.split('-');
      const potentialId = parts[parts.length - 1];
      if (/^[a-f\d]{24}$/i.test(potentialId)) {
        return {
          categorySlug,
          productSlug: parts.slice(0, -1).join('-'),
          productId: potentialId
        };
      }
    }
    
    return {
      categorySlug,
      productSlug: productPart
    };
  }
  
  return {};
};

// بررسی معتبر بودن ObjectId
export const isValidObjectId = (id: string): boolean => {
  return /^[a-f\d]{24}$/i.test(id);
};

// اصافه کردن تابع‌های قدیمی برای سازگاری
export { getUrlSettings } from './url-settings';

// URL و Slug Utilities
export class URLUtils {
  /**
   * تولید slug از متن فارسی/انگلیسی
   */
  static generateSlug(text: string, format: 'kebab-case' | 'camelCase' | 'snake_case' = 'kebab-case'): string {
    // حذف کاراکترهای غیرضروری
    const slug = text
      .trim()
      .toLowerCase()
      // تبدیل کاراکترهای فارسی
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
      // تبدیل فاصله‌ها
      .replace(/\s+/g, '-')
      // حذف خط تیره‌های اضافی
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // اعمال فرمت
    switch (format) {
      case 'camelCase':
        return slug.replace(/-(.)/g, (_, letter) => letter.toUpperCase());
      case 'snake_case':
        return slug.replace(/-/g, '_');
      case 'kebab-case':
      default:
        return slug;
    }
  }

  /**
   * تولید URL canonical
   */
  static generateCanonicalURL(baseURL: string, path: string): string {
    const cleanBase = baseURL.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return `${cleanBase}/${cleanPath}`;
  }

  /**
   * بررسی معتبر بودن URL
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * استخراج domain از URL
   */
  static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  /**
   * بررسی لینک داخلی بودن
   */
  static isInternalLink(url: string, siteURL: string): boolean {
    if (url.startsWith('/')) return true;
    if (url.startsWith('#')) return true;
    if (url.startsWith('mailto:')) return false;
    if (url.startsWith('tel:')) return false;
    
    try {
      const urlDomain = this.extractDomain(url);
      const siteDomain = this.extractDomain(siteURL);
      return urlDomain === siteDomain;
    } catch {
      return false;
    }
  }

  /**
   * تولید breadcrumb از URL
   */
  static generateBreadcrumb(url: string, siteURL: string, pageTitle?: string): Array<{name: string, url: string}> {
    const breadcrumb = [];
    
    // صفحه اصلی
    breadcrumb.push({
      name: 'خانه',
      url: siteURL
    });

    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      
      let currentPath = siteURL;
      
      pathParts.forEach((part, index) => {
        currentPath += `/${part}`;
        
        // اگر آخرین قسمت است و عنوان صفحه داریم
        if (index === pathParts.length - 1 && pageTitle) {
          breadcrumb.push({
            name: pageTitle,
            url: currentPath
          });
        } else {
          // تبدیل slug به نام قابل خواندن
          const name = part
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
          
          breadcrumb.push({
            name,
            url: currentPath
          });
        }
      });
    } catch (error) {
      console.error('خطا در تولید breadcrumb:', error);
    }

    return breadcrumb;
  }

  /**
   * بررسی و اصلاح مسیر redirect
   */
  static validateRedirectPath(from: string, to: string): { isValid: boolean; error?: string } {
    // بررسی خالی نبودن
    if (!from || !to) {
      return { isValid: false, error: 'مسیر مبدأ و مقصد نمی‌تواند خالی باشد' };
    }

    // بررسی یکسان نبودن
    if (from === to) {
      return { isValid: false, error: 'مسیر مبدأ و مقصد نمی‌تواند یکسان باشد' };
    }

    // بررسی loop redirect
    // این قسمت در implement واقعی باید پیچیده‌تر باشد
    
    return { isValid: true };
  }

  /**
   * تولید URL برای انواع مختلف محتوا
   */
  static generateContentURL(
    type: 'blog' | 'product' | 'category' | 'page',
    slug: string,
    baseURL: string
  ): string {
    const urlMaps = {
      blog: '/blog',
      product: '/products',
      category: '/categories',
      page: ''
    };

    const prefix = urlMaps[type];
    return this.generateCanonicalURL(baseURL, `${prefix}/${slug}`);
  }

  /**
   * پاکسازی و استاندارسازی URL
   */
  static cleanURL(url: string): string {
    return url
      .toLowerCase()
      .replace(/\/+/g, '/') // حذف slash های اضافی
      .replace(/\/$/, '') // حذف slash انتهایی
      .replace(/\?.*$/, '') // حذف query parameters
      .replace(/#.*$/, ''); // حذف fragments
  }
}