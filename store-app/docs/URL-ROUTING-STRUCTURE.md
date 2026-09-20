# ساختار URL Routing - محصولات و دسته‌بندی‌ها

## نمای کلی

این پروژه از یک سیستم routing پیشرفته برای مدیریت URL های محصولات و دسته‌بندی‌ها استفاده می‌کند که هم از ساختارهای ساده و هم سلسله‌مراتبی پشتیبانی می‌کند.

## ساختارهای پشتیبانی شده

### 1. صفحات اصلی

```
/categories                    → لیست تمام دسته‌بندی‌های اصلی
/products                      → لیست تمام محصولات (با فیلتر)
/category/{slug}               → نمایش اطلاعات دسته‌بندی + زیردسته‌ها (فقط برای دسته‌های والد)
                                 لینک زیردسته‌ها به /products/{path} می‌روند
```

**نکته مهم:** صفحات `/category/{slug}` فقط برای نمایش اطلاعات دسته‌بندی و زیردسته‌های آن استفاده می‌شوند. برای نمایش محصولات یک دسته، از `/products/{category-path}` استفاده می‌شود.

### 2. محصولات - ساختارهای مختلف URL

سیستم از چندین فرمت URL برای دسترسی به محصولات پشتیبانی می‌کند:

#### الف) ID خالص
```
/products/123                  → محصول با sequential ID = 123
/products/507f1f77bcf86cd799439011 → محصول با ObjectId
```

#### ب) Slug خالص
```
/products/laptop-dell          → محصول با slug = laptop-dell
```

#### ج) Slug + ID
```
/products/laptop-dell-123      → محصول با slug = laptop-dell و ID = 123
```

#### د) Category Path + Product Slug
```
/products/electronics/laptop-dell
→ دسته: electronics
→ محصول: laptop-dell
```

#### ه) Multi-Level Category Path + Product Slug
```
/products/electronics/computers/laptops/dell-xps-13
→ دسته‌ها: electronics → computers → laptops
→ محصول: dell-xps-13
```

#### و) Multi-Level Category Path + Product Slug + ID
```
/products/plugin/test-seo/new-seo-price-456
→ دسته‌ها: plugin → test-seo
→ محصول: new-seo-price
→ ID: 456
```

## تشخیص هوشمند محصول vs دسته‌بندی

سیستم به صورت خودکار تشخیص می‌دهد که URL برای یک محصول است یا یک دسته‌بندی:

### منطق تشخیص:

1. **ابتدا جستجوی محصول:** سیستم همیشه ابتدا سعی می‌کند محصول را پیدا کند
2. **اگر محصول پیدا نشد:** URL به عنوان دسته‌بندی در نظر گرفته می‌شود و صفحه لیست محصولات آن دسته نمایش داده می‌شود

### مثال:

```bash
# محصول پیدا می‌شود → ProductDetailClient
/products/plugin/test-seo/laptop-dell-456

# محصول پیدا نمی‌شود → ProductsClient با فیلتر دسته "test-seo"
/products/plugin/test-seo
```

## فایل‌های کلیدی

### 1. `/src/app/products/[...slug]/page.tsx`
- مسئول handle کردن تمام URL های `/products/*`
- شامل `findProductBySlug()` برای جستجوی محصول
- تشخیص خودکار محصول vs دسته‌بندی

### 2. `/src/lib/url-server.ts`
- `parseProductUrl()`: پارس کردن slug ها و استخراج اطلاعات
- `generateProductUrl()`: تولید URL استاندارد برای محصول
- `generateSlug()`: تولید slug از متن فارسی/انگلیسی

### 3. `/src/lib/url-settings.ts`
- تنظیمات URL structure (id-only, product-only, category-product)
- تنظیمات separator، maxSlugLength، includeId

## نحوه استفاده در کد

### تولید URL برای محصول:

```typescript
import { generateProductUrl } from '@/lib/url-server';

const product = {
  _id: '507f1f77bcf86cd799439011',
  sequentialId: 123,
  name: 'لپ‌تاپ دل',
  slug: 'laptop-dell',
  categoryPath: [
    { slug: 'electronics' },
    { slug: 'computers' },
    { slug: 'laptops' }
  ]
};

const url = generateProductUrl(product);
// نتیجه (بسته به تنظیمات):
// /products/electronics/computers/laptops/laptop-dell-123
```

### پارس کردن URL:

```typescript
import { parseProductUrl } from '@/lib/url-server';

const slugs = ['plugin', 'test-seo', 'new-seo-price-456'];
const parsed = parseProductUrl(slugs);

console.log(parsed);
// {
//   categoryPath: ['plugin', 'test-seo'],
//   productSlug: 'new-seo-price',
//   productId: '456'
// }
```

## مزایای این معماری

### 1. SEO Friendly
- URL های خوانا و معنادار
- ساختار سلسله‌مراتبی واضح
- پشتیبانی از breadcrumb

### 2. انعطاف‌پذیری
- پشتیبانی از چندین فرمت URL
- قابلیت تغییر ساختار بدون شکستن لینک‌های قدیمی
- Canonical URL برای جلوگیری از duplicate content

### 3. تجربه کاربری
- URL های کوتاه و به یادماندنی
- امکان دسترسی سریع با ID یا slug
- نمایش مسیر دسته‌بندی در URL

## مثال‌های عملی

### سناریو 1: دسترسی مستقیم به محصول
```
کاربر: /products/456
سیستم: پیدا کردن محصول با ID=456 → نمایش ProductDetailClient
```

### سناریو 2: مرور دسته‌بندی
```
کاربر: /products/electronics/laptops
سیستم: محصول پیدا نشد → نمایش ProductsClient با فیلتر "laptops"
```

### سناریو 3: URL کامل با مسیر دسته‌بندی
```
کاربر: /products/electronics/laptops/dell-xps-13-789
سیستم: 
  1. categoryPath: ['electronics', 'laptops']
  2. productSlug: 'dell-xps-13'
  3. productId: '789'
  → پیدا کردن محصول → نمایش ProductDetailClient
```

### سناریو 4: دسته‌بندی آخر بدون محصول
```
کاربر: /products/plugin/wordpress
سیستم: 
  1. تلاش برای پیدا کردن محصول با slug="wordpress" → ناموفق
  2. تشخیص به عنوان دسته‌بندی
  → نمایش ProductsClient با فیلتر "wordpress"
```

### سناریو 5: کلیک روی زیردسته در صفحه /category
```
کاربر: در /category/plugin روی زیردسته "test-seo" کلیک می‌کند
سیستم:
  1. ساخت URL با categoryPath: /products/plugin/test-seo
  2. بارگذاری محصولات دسته "test-seo"
  → نمایش ProductsClient با محصولات فیلتر شده
```

### سناریو 6: دسترسی به محصول از طریق مسیر کامل دسته‌بندی
```
کاربر: /products/plugin/test-seo/new-seo-price
سیستم:
  1. categoryPath: ['plugin', 'test-seo']
  2. productSlug: 'new-seo-price'
  3. جستجوی محصول با slug
  → نمایش ProductDetailClient
```

## نکات مهم

### 1. تشخیص ID در slug
سیستم الگوهای زیر را به عنوان ID تشخیص می‌دهد:
- `\d+` → عدد خالص (sequential ID)
- `[a-f\d]{24}` → ObjectId (24 کاراکتر hex)

### 2. جداسازی slug و ID
در فرمت `slug-id`، آخرین بخش بعد از `-` به عنوان ID در نظر گرفته می‌شود:
- ✅ `laptop-dell-123` → slug: "laptop-dell", id: "123"
- ✅ `new-product-2024-456` → slug: "new-product-2024", id: "456"
- ❌ `123` → فقط ID (بدون slug)

### 3. اولویت جستجو
```
1. بر اساس ID (اگر موجود باشد)
2. بر اساس slug + categoryPath
3. بر اساس slug خالص
4. جستجوی فازی با نام محصول
```

## تنظیمات URL Structure

در فایل `url-settings.ts` می‌توانید ساختار URL را تنظیم کنید:

```typescript
{
  urlStructure: 'category-product',  // یا 'product-only' یا 'id-only'
  separatorType: '-',                // جداکننده کلمات در slug
  includeId: true,                   // افزودن ID به انتهای slug
  maxSlugLength: 100,                // حداکثر طول slug
  enableNestedCategories: true       // پشتیبانی از دسته‌بندی‌های تو در تو
}
```

---

**آخرین بروزرسانی:** 2026-01-07  
**نسخه:** 2.0.0
