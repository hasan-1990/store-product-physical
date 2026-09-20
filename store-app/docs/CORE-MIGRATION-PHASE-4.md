# فاز ۴ — Hub UI روی Express

> مسیر: `docs/CORE-MIGRATION-PHASE-4.md`  
> پیش‌نیاز: فاز ۳c ✅

## هدف

صفحات HTML سبک هاب روی `core-server` — بدون Next.js در production.

## صفحات

| مسیر | توضیح |
|------|--------|
| `/` | صفحه اصلی + محصولات منتخب |
| `/products`, `/products/:id` | فروشگاه |
| `/cart` | سبد خرید (client JS) |
| `/login`, `/register` | احراز هویت JWT |
| `/templates` | قالب‌های managed-site |
| `/user/my-sites` | سایت‌های مشتری |
| `/admin/login`, `/admin` | پنل ادمین سبک |
| `/admin/site-instances`, `/admin/site-templates`, `/admin/products` | مدیریت |

## ساختار

```
packages/core-server/src/hub/ui/
  html.ts, pages.ts, routes.ts
  static.ts — public/
```

## استاتیک

فایل‌های `public/` (تصاویر، فونت‌ها) از همان origin سرو می‌شوند.

## تست

```powershell
npm run core:dev
# http://localhost:4000/
```

---

**وضعیت:** ✅ تکمیل شد
