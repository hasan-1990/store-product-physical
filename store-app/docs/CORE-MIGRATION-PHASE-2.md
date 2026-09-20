# فاز ۲ — مهاجرت API قالب shop-starter-v1 به Express

> مسیر: `docs/CORE-MIGRATION-PHASE-2.md`  
> مرتبط با: [MANAGED-SITE-ARCHITECTURE.md](./MANAGED-SITE-ARCHITECTURE.md)

## هدف

همه APIهای عمومی و ادمین قالب `shop-starter-v1` روی **Express core-server** با **DB جدا per tenant** (`getTenantDb`) کار کنند — بدون Next.js جدا per مشتری.

## ساختار کد

```
site-templates/shop-starter-v1/
  register.ts                 # re-export
  express/
    routes.ts                 # ثبت همه routeها
    middleware.ts             # withTenant + templateSlug check
    auth.ts                   # JWT admin cookie
    session.ts                # cart_session cookie
    shop-db.ts                # collection accessors
    services/
      catalog.ts              # products, siteContent
      commerce.ts             # cart, orders, promo, admin lookup
```

## چک‌لیست APIها

### عمومی (فروشگاه)

| Route | Method | وضعیت |
|-------|--------|--------|
| `/api/products` | GET | ✅ |
| `/api/products` | POST (admin) | ✅ |
| `/api/products/:slug` | GET | ✅ |
| `/api/site-content` | GET | ✅ |
| `/api/promo` | GET | ✅ |
| `/api/cart` | GET, POST, DELETE | ✅ |
| `/api/cart/:id` | PATCH, DELETE | ✅ |
| `/api/orders` | GET, POST | ✅ |

### ادمین

| Route | Method | وضعیت |
|-------|--------|--------|
| `/api/auth/admin/login` | GET, POST, DELETE | ✅ |
| `/api/admin/orders` | GET, PATCH | ✅ |
| `/api/admin/stats` | GET | ✅ |

### هنوز روی Next (فاز بعدی همین قالب)

| Route | توضیح |
|-------|--------|
| `/api/health` | در core-server سراسری است |
| `/api/seed` | فقط dev — بعداً در provisioning |
| UI صفحات (`/`, `/products`, …) | فاز ۲b — SSR/static |

## وابستگی‌های core-server

- `cookie-parser` — برای `cart_session` و `admin_token`
- `@core-shared` — `getTenantDb` per request

## تست محلی

```powershell
cd D:\hasan\79\site\store-app
npm run core:dev

# hub
curl http://localhost:4000/api/health

# tenant (نیاز به siteInstances active + Host header)
curl -H "Host: your-domain.com" http://localhost:4000/api/products
curl -H "Host: your-domain.com" http://localhost:4000/api/site-content
```

برای تست tenant بدون DNS واقعی، یک رکورد `siteInstances` با `domain: localhost` یا دامنه تست در hub DB بسازید (فقط اگر hub domain نباشد).

## یادداشت معماری

- منطق DB در `express/services/*` تکرار شده تا از alias `@/` قالب Next جدا بماند.
- در آینده می‌توان `src/lib/request-db.ts` + AsyncLocalStorage اضافه کرد و سرویس‌ها را یکپارچه کرد.
- dev قالب همچنان با `cd site-templates/shop-starter-v1 && npm run dev` روی Next است.

## گام بعدی (فاز ۳)

مهاجرت APIهای هاب — [CORE-MIGRATION-INDEX.md](./CORE-MIGRATION-INDEX.md)

---

**آخرین به‌روزرسانی:** فاز ۲ API — تکمیل شد ✅ (UI → فاز ۲b)
