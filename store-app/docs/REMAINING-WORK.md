# وضعیت باقی‌مانده — پس از فاز ۸

> آخرین به‌روزرسانی: جایگزینی API Bridge + SPA UI

## ✅ روی Express (`npm run core:dev`)

| بخش | وضعیت |
|-----|--------|
| فروشگاه + checkout + payment | native Express |
| managed-site + provisioning | native Express |
| ~۱۶۶ Next API route | **Next API Bridge** (~۲۷۰ handler) |
| ~۱۴۶ صفحه UI | native HTML + **SPA catch-all** |
| OTP/SMS، ایمیل، چت‌بات API | از bridge (همان `route.ts` قدیمی) |
| tenant managed-site | `shop-starter-v1` روی Express |

## ⏳ اختیاری / بهبود

| بخش | توضیح |
|-----|--------|
| UI React کامل | SPA فعلاً JSON + sidebar؛ بازنویسی تدریجی صفحات پرکاربرد در `hub/ui/pages.ts` |
| آپلود فایل در bridge | `multipart` — افزودن raw body / multer به `next-adapter` |
| `npm run dev` | فقط برای توسعه محلی React؛ production = `core-server` |
| NextAuth | در bridge ترجیح JWT hub (`token` / Bearer) |

## تست لوکال

```powershell
npm run core:dev
# http://localhost:4000
```

راهنما: [LOCAL-DEV-CORE.md](./LOCAL-DEV-CORE.md) · فاز ۸: [CORE-MIGRATION-PHASE-8.md](./CORE-MIGRATION-PHASE-8.md)

---

**جمع‌بندی:** API و UI هاب دیگر به `next start` وابسته نیستند. Express + bridge + SPA همه مسیرهای قدیمی را پوشش می‌دهند.
