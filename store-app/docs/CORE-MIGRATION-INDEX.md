# فهرست مهاجرت core-server

> مسیر: `docs/CORE-MIGRATION-INDEX.md`  
> سند اصلی: [MANAGED-SITE-ARCHITECTURE.md](./MANAGED-SITE-ARCHITECTURE.md)

## وضعیت فازها

| فاز | عنوان | سند | وضعیت |
|-----|--------|-----|--------|
| ۰ | مستندات معماری | [MANAGED-SITE-ARCHITECTURE.md](./MANAGED-SITE-ARCHITECTURE.md) | ✅ |
| ۱ | core-server + core-shared | [packages/core-server/README.md](../packages/core-server/README.md) | ✅ |
| ۲ | API tenant shop-starter-v1 | [CORE-MIGRATION-PHASE-2.md](./CORE-MIGRATION-PHASE-2.md) | ✅ |
| ۲b | UI tenant + static uploads | [CORE-MIGRATION-PHASE-2B.md](./CORE-MIGRATION-PHASE-2B.md) | ✅ |
| ۳ | hub API → Express (دسته ۱: managed + public) | [CORE-MIGRATION-PHASE-3.md](./CORE-MIGRATION-PHASE-3.md) | ✅ |
| ۳b | hub auth + shop + payment | [CORE-MIGRATION-PHASE-3B.md](./CORE-MIGRATION-PHASE-3B.md) | ✅ |
| ۳c | hub API باقی‌مانده (categories, mega-menu) | [CORE-MIGRATION-PHASE-3C.md](./CORE-MIGRATION-PHASE-3C.md) | ✅ |
| ۴ | hub UI → Express | [CORE-MIGRATION-PHASE-4.md](./CORE-MIGRATION-PHASE-4.md) | ✅ |
| ۵ | provisioning جدید | [CORE-MIGRATION-PHASE-5.md](./CORE-MIGRATION-PHASE-5.md) | ✅ |
| ۶ | Nginx + Docker | [CORE-MIGRATION-PHASE-6.md](./CORE-MIGRATION-PHASE-6.md) | ✅ |
| ۷ | حذف Next از production | [CORE-MIGRATION-PHASE-7.md](./CORE-MIGRATION-PHASE-7.md) | ✅ |
| ۸ | جایگزینی API/UI Next (bridge + SPA) | [CORE-MIGRATION-PHASE-8.md](./CORE-MIGRATION-PHASE-8.md) | ✅ |

## دستورات سریع

```powershell
cd D:\hasan\79\site\store-app
npm run core:dev          # بک‌اند Express :4000
npm run dev               # فرانت Next :3000 — [راهنما](./LOCAL-DEV-SPLIT.md)
npm run deploy:up         # production: core-server + nginx
```

## env کلیدی

| متغیر | پیش‌فرض |
|--------|---------|
| `CORE_SERVER_PORT` | `4000` |
| `HUB_DOMAINS` | `localhost,127.0.0.1,example.com,...` |
| `MONGODB_URI` | hub DB |
| `TENANT_ADMIN_EMAIL` | `admin@muse.local` |
| `TENANT_ADMIN_PASSWORD` | برای seed tenant |
| `SERVER_PUBLIC_IP` | بررسی DNS |

## باقی‌مانده

جزئیات صادقانه: [REMAINING-WORK.md](./REMAINING-WORK.md)

---

**آخرین به‌روزرسانی:** فاز ۸ — Next API Bridge + SPA UI catch-all
