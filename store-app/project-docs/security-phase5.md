# فاز ۵ — امنیت و Production Hardening

آخرین به‌روزرسانی: ۱۴۰۴/۰۴/۰۱

## خلاصه

| مورد | وضعیت | فایل‌های کلیدی |
|------|--------|----------------|
| مسدودسازی debug/test API | ✅ | `middleware.ts`, `src/lib/dev-routes.ts` |
| Maintenance mode در middleware | ✅ | `middleware.ts` (ریشه پروژه) |
| حذف JWT fallback | ✅ | `src/lib/secrets.ts`, `src/lib/jwt.ts` |
| Auth ادمین wishlist | ✅ | `src/app/api/admin/wishlist/route.ts` |
| امن‌سازی Docker build | ✅ | `Dockerfile`, `.dockerignore`, `docker-compose.yml` |
| چک‌لیست deploy (خودکار) | ✅ | `src/lib/deploy-checks.ts`, `scripts/validate-deploy-env.js` |

---

## ۱. مسدودسازی `/api/debug/*` و `/api/test-*`

در `production` این مسیرها **404** برمی‌گردانند.

برای تست موقت در production (فقط اگر واقعاً لازم است):
```env
ALLOW_DEV_ROUTES=true
```

در `docker-compose.yml` مقدار پیش‌فرض: `ALLOW_DEV_ROUTES: "false"`

---

## ۲. Maintenance Mode در Middleware

وقتی cookie `maintenance_mode=true` باشد:
- کاربران عادی → redirect به `/maintenance`
- ادمین (NextAuth session) → دسترسی عادی
- مسیرهای معاف: `/maintenance`, `/admin`, `/api/*`, `/_next/*`, فایل‌های استاتیک

Cookie توسط `/api/maintenance/status` و تنظیمات ادمین ست می‌شود.

---

## ۳. مدیریت Secrets (بدون fallback در production)

ماژول مرکزی: `src/lib/secrets.ts` + اعتبارسنجی در `src/lib/deploy-checks.ts`

- حداقل **۳۲ کاراکتر**
- رد مقادیر پیش‌فرض/ضعیف (لیست در `WEAK_SECRET_VALUES`)
- در startup production (`instrumentation.ts`) اگر نامعتبر باشد سرور بالا نمی‌آید

---

## ۴. Auth در `/api/admin/wishlist`

`GET` و `DELETE` هر دو از `requireAdminFromRequest()` استفاده می‌کنند.

---

## ۵. Docker — بدون `.env` در image

- `.env` در `.dockerignore`
- secrets فقط runtime از `docker-compose.yml`
- `JWT_SECRET` + `ALLOW_DEV_ROUTES=false` در environment

---

## ۶. چک‌لیست deploy (تکمیل‌شده — خودکار)

| بررسی | نحوه اجرا | وضعیت |
|--------|-----------|--------|
| `JWT_SECRET` / `NEXTAUTH_SECRET` ≥ ۳۲ کاراکتر | `npm run deploy:check` | ✅ خودکار |
| `ALLOW_DEV_ROUTES` غیرفعال در production | `docker-compose` + deploy checks | ✅ خودکار |
| Rebuild image بعد از تغییر Dockerfile | `npm run deploy:rebuild` | ✅ اسکریپت |
| Maintenance settings قابل خواندن | `GET /api/health/deploy` | ✅ خودکار |
| Startup guard در production | `src/instrumentation.ts` | ✅ خودکار |

### قبل از deploy (روی سرور)

```bash
# 1. بررسی env
npm run deploy:check:prod

# 2. build و بالا آوردن
npm run deploy:rebuild
npm run deploy:up

# 3. تأیید runtime
curl -s http://localhost:3000/api/health/deploy | jq
```

### تست maintenance از پنل ادمین

1. `/admin/settings` → فعال کردن maintenance mode
2. در مرورگر incognito باید به `/maintenance` redirect شود
3. با حساب admin باید سایت عادی باز شود
4. غیرفعال کردن maintenance → cookie `maintenance_mode=false`

---

## ۷. API آمادگی deploy

`GET /api/health/deploy` — بدون افشای secret، وضعیت هر check را برمی‌گرداند.

```json
{
  "ready": true,
  "checks": [
    { "id": "jwt_secret", "ok": true, "message": "معتبر" },
    { "id": "nextauth_secret", "ok": true, "message": "معتبر" },
    { "id": "allow_dev_routes", "ok": true, "message": "مسیرهای debug/test غیرفعال" },
    { "id": "maintenance_settings", "ok": true, "message": "غیرفعال" }
  ]
}
```

---

## تاریخچه

| تاریخ | اقدام |
|-------|--------|
| ۱۴۰۴/۰۴/۰۱ | تکمیل موارد فاز ۵ archtech.md |
| ۱۴۰۴/۰۴/۰۱ | چک‌لیست deploy خودکار + اسکریپت‌ها |
