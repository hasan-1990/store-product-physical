# فاز Q3 2026 — Polish (تکمیل)

آخرین به‌روزرسانی: ژوئن ۲۰۲۶

## خلاصه

| مورد | وضعیت | فایل‌ها / دستور |
|------|--------|------------------|
| Next Rocket v1 | ✅ | `src/lib/next-rocket-init.ts`, `instrumentation.ts` |
| Performance audit | ✅ | `scripts/perf-audit.ts`, `npm run perf:audit` |
| SMS یکپارچه | ✅ | `sms-service.ts` → facade روی `sms.ts` |
| DiscountSections | ✅ | `PositionedDiscountSections` → SSR → Fallback → Client |
| Email automation | ✅ | BUG-007 (قبلاً) |
| Test coverage پایه | ✅ | `tests/*.test.ts`, `npm run test` |
| Legacy cleanup | ✅ | backup/route-new + ۵ variant حذف‌شده |

---

## ۱. Next Rocket v1

فعال‌سازی در startup سرور:

```env
NEXT_ROCKET_ENABLED=true
# یا
NEXT_PUBLIC_NEXT_ROCKET_ENABLED=true
```

- تنظیمات از MongoDB (`nextRocketSettings`) یا `DEFAULT_SETTINGS`
- داشبورد: `/admin/modules/next-rocket`
- API: `/api/admin/next-rocket/*`

---

## ۲. Performance Audit

```bash
npm run build
npm run perf:audit
# تحلیل تعاملی:
ANALYZE=true npm run build
```

خروجی: اندازه top-10 chunkهای JS + آستانه‌های LCP/FCP/CLS از Next Rocket.

---

## ۳. SMS یکپارچه

| مصرف‌کننده | import |
|------------|--------|
| Auth routes | `SMSService` از `@/lib/sms-service` |
| `/api/sms` | `smsService` از `@/lib/sms` |

هر دو به یک implementation (`sms.ts`) متصل‌اند.

---

## ۴. Tests

```bash
npm run test
```

| فایل | پوشش |
|------|------|
| `tests/auth-security.test.ts` | dev-routes، JWT secrets |
| `tests/payment-utils.test.ts` | Zarinpal status messages |
| `tests/sms-facade.test.ts` | SMS facade + mobile format |

---

## ۵. تأیید خودکار

```bash
npm run verify:polish
```

چک‌ها: Next Rocket init، SMS facade، tests، perf script، DiscountSections chain.

---

## باقی‌مانده (Q4)

- `reactStrictMode: true`
- Redis اجباری production
- Sentry + backup روزانه
- OpenAPI docs
