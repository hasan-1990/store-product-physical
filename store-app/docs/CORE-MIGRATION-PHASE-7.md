# فاز ۷ — حذف Next.js از production

> مسیر: `docs/CORE-MIGRATION-PHASE-7.md`

## تغییرات

| قبل | بعد |
|-----|-----|
| `docker-compose.yml` → سرویس `app` (Next) | سرویس `core-server` |
| Nginx → `app:3000` | Nginx → `core-server:4000` |
| `npm run deploy:up` → Next | `deploy:up` → core-server + nginx |

## Next.js فقط برای توسعه

```powershell
# API + UI production-like
npm run core:dev

# Next hub (اختیاری — پنل پیشرفته قدیمی)
npm run dev

# Next در Docker (اختیاری)
npm run deploy:next-dev
```

فایل: `docker-compose.next-dev.yml`

## Dockerfile‌ها

| فایل | استفاده |
|------|---------|
| `Dockerfile.core-server` | **production** |
| `Dockerfile` | فقط next-dev / legacy |

## چک‌لیست production

- [x] `docker-compose.yml` بدون سرویس Next
- [x] Nginx بدون `/_next/static`
- [x] Hub UI روی Express
- [x] Tenant UI روی Express (shop-starter-v1)
- [ ] OTP / forgot-password (هنوز فقط در کد Next — در صورت نیاز مهاجرت API)

---

**وضعیت:** ✅ production بدون Next
