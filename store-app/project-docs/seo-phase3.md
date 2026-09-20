# فاز ۳ — SEO (تکمیل)

آخرین به‌روزرسانی: ۱۴۰۴/۰۴/۰۱

## خلاصه

| مورد | وضعیت | فایل‌های کلیدی |
|------|--------|----------------|
| باگ لینک زیردسته | ✅ | `src/components/CategoryCard.tsx` |
| Fallback SEO ↔ MongoDB | ✅ | `src/lib/seo-helpers.ts`, `seo-fallback-storage.ts` |
| API عمومی SEO | ✅ | `src/app/api/seo/route.ts` |
| Homepage SEO cache | ✅ | `src/lib/homepage-data.ts` |
| حذف فایل‌های قدیمی | ✅ | ۱۴ فایل `.backup` / `*_new` / `route-new` |
| SEO قالب MUSE | ✅ | `site-templates/shop-starter-v1/src/lib/seo.ts` |

---

## ۱. باگ لینک زیردسته (`CategoryCard`)

**مشکل:** لینک‌های leaf به `?category={name}` می‌رفتند و pillهای زیردسته از `sub.name` به‌جای `sub.slug` استفاده می‌کردند.

**رفع:**
- دسته با زیردسته → `/categories/{path}/{slug}`
- دسته leaf → `/products/{path}/{slug}`
- pill زیردسته → `/categories/{parentPath}/{sub.slug}`

---

## ۲. یکپارچه‌سازی Fallback SEO

### خواندن (MongoDB → JSON)
`getSEODataByUrl()` ابتدا MongoDB را می‌خواند؛ در صورت خطا یا نبود رکورد، از `data/seo-fallback-storage.json` استفاده می‌کند.

مصرف‌کنندگان:
- `src/lib/homepage-data.ts` → `getSEODataForUrl`
- `src/app/api/seo/route.ts`
- Admin و سایر مسیرهایی که `getSEODataByUrl` را صدا می‌زنند

### نوشتن (write-through)
`upsertSEOPage()` و `deleteSEOPage()` پس از موفقیت در DB، fallback JSON را هم به‌روز می‌کنند.

توابع جدید در `seo-fallback-storage.ts`:
- `getFallbackPageByUrl(url)`
- `deleteFallbackPageByUrl(url)`

---

## ۳. فایل‌های حذف‌شده

```
src/app/admin/mega-menu-settings/page.tsx.backup
src/app/products/page.tsx.backup
src/app/products/page-old-backup.tsx
src/app/api/admin/security/settings/route.ts.backup
src/components/admin/SEOPagesManager.tsx.backup
src/components/admin/SEOPagesManager_backup.tsx.bak
src/app/admin/products/edit/page_new.tsx
src/app/admin/products/page_new.tsx
src/components/admin/SingleSMSForm_new.tsx
src/app/admin/content/unified-products/page_new.tsx
src/app/api/admin/seo/pages/manage/route-new.ts
src/app/api/user/profile/route-new.ts
src/app/api/products/[id]/route_backup.ts
src/components/MultipleDiscountSections.backup.tsx
```

---

## ۴. SEO قالب `shop-starter-v1`

| قابلیت | مسیر |
|--------|------|
| `metadataBase`, OpenGraph, Twitter | `src/app/layout.tsx` |
| `generateMetadata` صفحه اصلی | `src/app/page.tsx` |
| `generateMetadata` محصول | `src/app/products/[slug]/page.tsx` |
| JSON-LD (Organization, WebSite, Product) | `src/components/seo/JsonLd.tsx` |
| Sitemap | `src/app/sitemap.ts` |
| Robots | `src/app/robots.ts` |
| Helpers | `src/lib/seo.ts` |

**متغیر محیطی:** `LICENSED_DOMAIN` یا `NEXT_PUBLIC_SITE_URL` برای URL کانونیکال.

---

## ۵. کارهای بعدی (خارج از فاز ۳) — ✅ تکمیل

- [x] ادغام `seo-fallback-manager.ts` و `seo-fallback-storage.ts` (manager → wrapper روی storage)
- [x] `toggleSEOPage` → همگام‌سازی fallback
- [x] `generateMetadata` برای `/products` در قالب `shop-starter-v1` (`buildProductsListingMetadata` + JSON-LD ItemList)
- [x] ثبت قالب در پنل admin (`template-registry.ts`, `POST /api/admin/site-templates/sync`, `npm run templates:sync`)

### ثبت قالب shop-starter-v1

```bash
# از CLI (نیاز به MongoDB)
npm run templates:sync

# یا از پنل admin
/admin/site-templates → «همگام‌سازی از دیسک»
```

فایل منبع: `site-templates/shop-starter-v1/template.config.json`

---

## تاریخچه

| تاریخ | اقدام |
|-------|--------|
| ۱۴۰۴/۰۴/۰۱ | generateMetadata لیست محصولات قالب + ثبت قالب در admin |
| ۱۴۰۴/۰۴/۰۱ | ادغام fallback SEO + toggleSEOPage sync |
