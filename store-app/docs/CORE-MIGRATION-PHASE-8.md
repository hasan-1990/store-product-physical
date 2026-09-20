# فاز ۸ — جایگزینی کامل UI/API قدیمی Next

> پس از فاز ۷ (حذف Next از production Docker)

## هدف

بدون rewrite دستی ~۲۵۰ فایل `src/app/api/**/route.ts` و ~۱۴۶ صفحه `page.tsx`، همهٔ API و UI هاب روی **یک Express** (`core-server`) سرو شوند.

## پیاده‌سازی

### 1. Next API Bridge

| فایل | نقش |
|------|-----|
| `packages/core-server/src/hub/legacy/next-adapter.ts` | Express req → `NextRequest`، pipe `NextResponse` |
| `packages/core-server/src/hub/legacy/route-scanner.ts` | اسکن `src/app/api`، `[id]` → `:id` |
| `packages/core-server/src/hub/legacy/native-skip.ts` | جلوگیری از double-handler با native Express |
| `packages/core-server/src/hub/legacy/register-next-api-bridge.ts` | dynamic import + ثبت روی Express |

**ترتیب startup** (`server.ts`):

1. `registerHubRoutes()` — native API + UI + static
2. `registerNextApiBridge()` — ~۱۶۶ route، ~۲۷۰ method handler
3. `registerApiNotFound()` — 404 برای `/api/*` بدون match

### 2. Hub SPA (UI catch-all)

| فایل | نقش |
|------|-----|
| `packages/core-server/src/hub/ui/spa/page-scanner.ts` | اسکن `src/app/**/page.tsx` |
| `packages/core-server/src/hub/ui/spa/register.ts` | manifest + fallback HTML برای مسیرهای بدون صفحه native |

- صفحات native (خانه، محصولات، checkout، …) همچنان HTML اختصاصی دارند.
- بقیه مسیرها (مثلاً `/admin/seo`) → SPA با sidebar از همه صفحات + fetch خودکار API مرتبط.

`GET /api/hub/spa-manifest` — لیست صفحات اسکن‌شده.

### 3. Auth برای bridge

`src/lib/auth-helper.ts`:

- JWT از `Authorization: Bearer`
- کوکی `token` (hub Express)
- fallback: NextAuth session (اگر در context Next باشد)

## اجرا

```powershell
npm run core:dev
# http://localhost:4000
```

`npm run dev` (Next :3000) **دیگر برای production لازم نیست** — فقط برای توسعه UI React اختیاری است.

## محدودیت‌های شناخته‌شده

| مورد | وضعیت |
|------|--------|
| `multipart/form-data` (آپلود فایل) | ممکن است نیاز به `multer` در adapter داشته باشد |
| NextAuth session در bridge | ترجیح: JWT hub (`token` cookie یا Bearer) |
| UI SPA | نمایش داده + JSON؛ معادل کامل React/Next نیست |
| Routeهای tenant | همچنان `shop-starter-v1` روی Express tenant |

## تست

```powershell
npm run test
npm run core:dev
# GET http://localhost:4000/api/hub/info
# GET http://localhost:4000/api/hub/spa-manifest
# GET http://localhost:4000/admin/orders  (SPA)
```
