# Site Templates

قالب‌های فروشگاه managed-site اینجا قرار می‌گیرند.

## ساختار

```
site-templates/
  shop-starter-v1/
    template.config.json
    register.ts              # ثبت routes در Express core-server (فاز ۲+)
    docs/
      fullstack-architecture.md
    scripts/
      seed.ts                # داده اولیه tenant DB
    src/                     # UI — dev با Next؛ production از Express
```

## معماری production

- **یک Express** (`store-app/packages/core-server`) همه دامنه‌های مشتری را handle می‌کند.
- هر مشتری: **DB جدا** + پوشه uploads سبک — **بدون** `next start` جدا.
- قالب = پکیج (API + UI static + seed) — نه اپ مستقل روی سرور.

مرجع کامل: [`docs/MANAGED-SITE-ARCHITECTURE.md`](../docs/MANAGED-SITE-ARCHITECTURE.md)

## قوانین توسعه

1. **قبل از کدنویسی** `docs/fullstack-architecture.md` همان قالب را بخوان.
2. هر فیچر = **UI + API + MongoDB** — mock فقط در seed.
3. منطق DB در `lib/db/*` — قابل انتقال به `packages/core-shared`.
4. به `store-app/src/` (هاب Next) دست نزن مگر درخواست صریح.
5. قالب جدید: کپی سند معماری از `shop-starter-v1/docs/`.

## ثبت قالب

```bash
npm run templates:sync
# یا پنل /admin/site-templates
```

مرجع معماری قالب: [`shop-starter-v1/docs/fullstack-architecture.md`](./shop-starter-v1/docs/fullstack-architecture.md)
