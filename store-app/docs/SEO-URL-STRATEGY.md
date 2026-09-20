# استراتژی SEO برای URL ها

## مشکل: تغییر ناگهانی URL

وقتی ساختار URL تغییر می‌کند، می‌تواند مشکلات SEO ایجاد کند:

### ❌ مشکلات احتمالی:
1. **404 Errors** - لینک‌های قدیمی که index شده‌اند
2. **Lost Rankings** - از دست دادن رتبه صفحات
3. **Broken Internal Links** - لینک‌های داخلی شکسته
4. **Duplicate Content** - محتوای تکراری در URL های مختلف

## ✅ راه‌حل پیاده‌سازی شده

### 1. استراتژی Redirect (301 Permanent)

```typescript
// در /src/app/category/[slug]/page.tsx

if (!hasSubcategories && hasProducts) {
  // دسته‌ای که فقط محصول دارد (بدون زیردسته)
  // → Redirect به /products/{path}
  const categoryPath = await buildCategoryPath(categoryData._id, db);
  const redirectPath = `/products/${categoryPath.map(c => c.slug).join('/')}`;
  redirect(redirectPath); // 301 Permanent Redirect
}
```

### 2. جدول Redirect

| از این URL | به این URL | نوع | دلیل |
|-----------|-----------|------|------|
| `/category/test-seo` | `/products/plugin/test-seo` | 301 | دسته بدون زیردسته (فقط محصول) |
| `/category/plugin` | نمایش زیردسته‌ها | 200 | دسته با زیردسته |

### 3. مزایای این روش

#### ✅ SEO Friendly
- **301 Redirect** به موتورهای جستجو می‌گوید URL دائماً تغییر کرده
- **Link Juice** حفظ می‌شود
- رتبه‌بندی قدیمی منتقل می‌شود

#### ✅ User Experience
- کاربر به محتوای درست هدایت می‌شود
- لینک‌های bookmark شده کار می‌کنند
- پیام‌های خطای 404 وجود ندارد

#### ✅ ساختار منطقی
```
/category/{slug}     → فقط برای دسته‌هایی که زیردسته دارند
/products/{path}     → برای نمایش محصولات یک دسته
```

## نمونه‌های عملی

### مثال 1: دسته با زیردسته
```
URL: /category/plugin
نتیجه: نمایش زیردسته‌ها (test-seo, wordpress, etc.)
Status: 200 OK
```

### مثال 2: دسته بدون زیردسته (فقط محصول)
```
URL: /category/test-seo
Redirect: 301 → /products/plugin/test-seo
نتیجه: نمایش محصولات دسته test-seo
```

### مثال 3: لینک مستقیم به محصول
```
URL: /products/plugin/test-seo/new-seo-price
نتیجه: نمایش جزئیات محصول
Status: 200 OK
```

## Canonical URLs

برای جلوگیری از duplicate content، canonical URLs تنظیم شده:

```html
<!-- در /category/plugin -->
<link rel="canonical" href="http://example.com/category/plugin" />

<!-- در /products/plugin/test-seo -->
<link rel="canonical" href="http://example.com/products/plugin/test-seo" />
```

## Internal Linking Strategy

### 1. لینک‌های صفحه categories
```typescript
// /src/app/categories/page.tsx
<Link href="/category/{slug}">  ✅ درست - به صفحه category
```

### 2. لینک‌های زیردسته در CategoryClient
```typescript
// /src/components/CategoryClient.tsx
const subcatUrl = subcat.categoryPath
  ? `/products/${subcat.categoryPath.map(c => c.slug).join('/')}`
  : `/products/${subcat.slug}`;

<Link href={subcatUrl}>  ✅ درست - به /products
```

### 3. لینک‌های breadcrumb
```tsx
خانه > دسته‌بندی‌ها > Plugin > Test SEO
 ↓         ↓           ↓         ↓
 /    /categories  /category  /products/plugin/test-seo
```

## Sitemap.xml

در فایل sitemap باید هر دو نوع URL درج شوند:

```xml
<!-- دسته‌های با زیردسته -->
<url>
  <loc>https://example.com/category/plugin</loc>
  <priority>0.8</priority>
</url>

<!-- صفحات محصولات دسته -->
<url>
  <loc>https://example.com/products/plugin/test-seo</loc>
  <priority>0.9</priority>
</url>
```

## Google Search Console

### توصیه‌ها:

1. **Submit Redirects**
   - در GSC، redirect های 301 را رصد کنید
   - اطمینان حاصل کنید که Google آنها را شناسایی کرده

2. **Request Re-indexing**
   - برای URL های جدید، re-indexing درخواست دهید
   - URL Inspection Tool را استفاده کنید

3. **Monitor 404s**
   - Coverage Report را بررسی کنید
   - اطمینان حاصل کنید که 404 جدیدی ایجاد نشده

## Best Practices

### ✅ انجام دهید:
- از 301 redirect برای تغییرات دائمی استفاده کنید
- canonical URLs را تنظیم کنید
- internal links را consistent نگه دارید
- sitemap را به‌روز کنید

### ❌ انجام ندهید:
- از 302 redirect استفاده نکنید (temporary)
- chain redirects ایجاد نکنید (A→B→C)
- canonical به URL های redirect شده اشاره نکند
- لینک‌های داخلی به URL های redirect شده نزنید

## نتیجه‌گیری

با استراتژی redirect 301:
- ✅ SEO حفظ می‌شود
- ✅ لینک‌های قدیمی کار می‌کنند  
- ✅ تجربه کاربری بهبود می‌یابد
- ✅ ساختار URL منطقی‌تر می‌شود

---

**آخرین بروزرسانی:** 2026-01-07  
**نسخه:** 1.0.0
