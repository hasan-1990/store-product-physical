# Debug Log — باگ‌ها، ریشه‌یابی و پیشگیری

> هر باگ برطرف‌شده یا شناخته‌شده را با قالب زیر ثبت کن.  
> آخرین به‌روزرسانی: ژوئن ۲۰۲۶

---

## قالب ثبت باگ جدید

```markdown
### [BUG-XXX] عنوان کوتاه
- **وضعیت:** باز | در حال بررسی | برطرف شده
- **شدت:** Critical | High | Medium | Low
- **محل:** مسیر فایل
- **علائم:** کاربر چه می‌بیند؟
- **ریشه:** چرا رخ داد؟
- **راه‌حل:** چه کردیم؟
- **روش رفع:** describe/debug/fix/verify
- **پیشگیری:** چطور دوباره تکرار نشود؟
```

---

## باگ‌های شناخته‌شده (باز)

_هیچ باگ باز با شماره BUG-001 تا BUG-007 باقی نمانده._

---

## باگ‌های برطرف‌شده

### [BUG-001] لینک اشتباه زیردسته در صفحه `/categories`

| مورد | جزئیات |
|------|--------|
| **وضعیت** | ✅ برطرف شده |
| **شدت** | High (SEO + UX) |
| **محل** | `CategoryCard.tsx`, `categories/page.tsx`, `categories/[...slug]/page.tsx` |
| **علائم** | کلیک روی زیردسته → مسیر اشتباه (`?category=name` یا `/category/`) |
| **ریشه** | `categoryPath` والد پاس داده نمی‌شد؛ pillها از `sub.name` به‌جای slug و مسیر products استفاده می‌کردند |
| **راه‌حل** | leaf → `/products/{path}`؛ pill → `/products/{parentPath}/{sub.slug}`؛ `currentPath` در صفحه parent؛ redirect leaf در `[...slug]` |
| **پیشگیری** | چک‌لیست URL قبل از merge؛ تست manual `/categories` → زیردسته → محصولات |

---

### [BUG-002] Maintenance Mode پیاده‌سازی نشده

| مورد | جزئیات |
|------|--------|
| **وضعیت** | ✅ برطرف شده |
| **شدت** | Medium |
| **محل** | `middleware.ts` |
| **علائم** | maintenance فعال بود ولی سایت برای همه باز می‌ماند |
| **ریشه** | فقط کامنت stub بود؛ logic نوشته نشده بود |
| **راه‌حل** | redirect به `/maintenance` با cookie `maintenance_mode` + env `MAINTENANCE_MODE=true`؛ استثنا admin و `/api/*` |
| **پیشگیری** | تست از پنل admin + env در deploy checklist |

---

### [BUG-003] Admin API بدون احراز هویت — Wishlist

| مورد | جزئیات |
|------|--------|
| **وضعیت** | ✅ برطرف شده |
| **شدت** | High (امنیت) |
| **محل** | `src/app/api/admin/wishlist/route.ts` |
| **ریشه** | TODO رها شده بدون `requireAdmin` |
| **راه‌حل** | `requireAdminFromRequest()` در GET و DELETE |
| **پیشگیری** | PR checklist برای `/api/admin/*` |

---

### [BUG-004] JWT Secret Fallback ناامن

| مورد | جزئیات |
|------|--------|
| **وضعیت** | ✅ برطرف شده |
| **شدت** | Critical |
| **محل** | `src/lib/secrets.ts`, `src/lib/jwt.ts` |
| **ریشه** | fallback ثابت در dev به production نشت می‌کرد |
| **راه‌حل** | `getJwtSecret()` — در production بدون env خطا؛ اعتبارسنجی در `instrumentation.ts` و `deploy-checks.ts` |
| **پیشگیری** | `npm run deploy:check` قبل از deploy |

---

### [BUG-005] Debug/Test API در Production

| مورد | جزئیات |
|------|--------|
| **وضعیت** | ✅ برطرف شده |
| **شدت** | High |
| **محل** | `middleware.ts`, `src/lib/dev-routes.ts` |
| **مسیرها** | `/api/debug/*`, `/api/test-*`, `/api/simple-test` |
| **راه‌حل** | 404 در production مگر `ALLOW_DEV_ROUTES=true` |
| **پیشگیری** | `ALLOW_DEV_ROUTES=false` در docker-compose |

---

### [BUG-006] اسکریپت seed گم‌شده

| مورد | جزئیات |
|------|--------|
| **وضعیت** | ✅ برطرف شده |
| **شدت** | Low |
| **محل** | `package.json` → `db:seed` |
| **ریشه** | `seed-mongodb.ts` حذف شده؛ script قدیمی مانده بود |
| **راه‌حل** | `db:seed` → `node scripts/seed-dynamic-content.js` |
| **پیشگیری** | scriptهای package.json در CI smoke test |

---

### [BUG-007] Cron Email ناقص

| مورد | جزئیات |
|------|--------|
| **وضعیت** | ✅ برطرف شده |
| **شدت** | Medium |
| **محل** | `lib/cron/tasks/email-queue.ts`, `abandoned-cart.ts` |
| **ریشه** | TODO scaffold بدون اتصال به سرویس ایمیل |
| **راه‌حل** | اتصال به `emailService.send()`؛ ثبت `messageId` / خطا در queue؛ `lastAbandonedCartEmailAt` برای جلوگیری از spam |
| **پیشگیری** | `EMAIL_ENABLED=true` در production + تست cron از پنل admin |

---

### [BUG-RESOLVED-001] لینک زیردسته در `/category/[slug]` — Redirect Logic

| مورد | جزئیات |
|------|--------|
| **وضعیت** | ✅ برطرف شده |
| **محل** | `src/app/category/[slug]/page.tsx` |
| **راه‌حل** | `if (!hasSubcategories) redirect(/products/${categoryPath})` |

---

### [BUG-RESOLVED-002] Cache دسته‌بندی بعد از حذف Admin

| مورد | جزئیات |
|------|--------|
| **وضعیت** | ✅ برطرف شده |
| **محل** | `middleware.ts` |
| **راه‌حل** | `no-store, no-cache` برای `/api/categories` |

---

## الگوهای رایج ریشه باگ در این پروژه

| الگو | مثال | پیشگیری |
|------|------|---------|
| TODO رها شده | admin wishlist auth | PR checklist |
| Dev endpoint در prod | `/api/debug` | env guard |
| URL inconsistency | categories sub-links | SEO audit قبل از release |
| Duplicate services | sms.ts × 3 | یک canonical file |
| Fallback خطرناک | JWT secret default | env validation در startup |
| Server/Client confusion | hydration mismatch | جداسازی واضح *Server/*Client |
| Cache بعد از mutation | categories API | no-cache برای admin mutations |

---

## روش Debug استاندارد

### ۱. Reproduce — مراحل دقیق + env، role، URL
### ۲. Isolate — Network tab، Winston log، MongoDB query
### ۳. Root Cause — چرا نه فقط چه
### ۴. Fix — کمترین تغییر ممکن
### ۵. Verify — reproduce → pass + regression
### ۶. Document — این فایل + `archtech.md` در صورت نیاز

---

## ابزارهای Debug پروژه

| ابزار | مسیر | استفاده |
|-------|------|---------|
| Health check | `GET /api/health` | uptime monitoring |
| Deploy checks | `GET /api/health/deploy` | آمادگی production |
| Test DB | `/api/test-db` | ⚠️ فقط dev |
| Test Redis | `/api/test-redis` | ⚠️ فقط dev |
| Debug session | `/api/debug/session` | ⚠️ فقط dev |
| Admin URL test | `/admin/url-test` | تست routing |
| Winston logs | container stdout | production debug |
| Uptime Kuma | docker-compose | alerting |

---

## Checklist قبل از Close کردن باگ

- [x] BUG-001 تا BUG-007 در این فایل ثبت و بسته شدند
- [x] fix در کد merge شد
- [x] تأیید خودکار: `npm run verify:bugs` (URL دسته‌بندی، auth، JWT، dev routes، seed، cron email + smoke MongoDB اختیاری)
- [x] امنیتی → `security-phase5.md` مرتبط است

```bash
npm run verify:bugs
```
