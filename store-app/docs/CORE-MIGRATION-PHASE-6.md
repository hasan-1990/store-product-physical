# فاز ۶ — Nginx + Docker (core-server)

> مسیر: `docs/CORE-MIGRATION-PHASE-6.md`  
> پیش‌نیاز: فاز ۴ و ۵ ✅

## هدف

Production با **یک سرویس Express** + Nginx reverse proxy + MongoDB + Redis.

## فایل‌ها

| فایل | نقش |
|------|-----|
| `Dockerfile.core-server` | image production (multi-stage, user غیر-root) |
| `docker-compose.yml` | `core-server` + nginx + mongo + redis |
| `nginx/conf.d/default.conf` | هاب → `core-server:4000` |
| `nginx/conf.d/tenant-sites.conf` | include vhost مشتریان |
| `nginx/proxy-params.conf` | هدرهای proxy مشترک |
| `nginx/sites/` | vhost per tenant (provisioning) |

## استقرار

```powershell
cd D:\hasan\79\site\store-app
npm run deploy:check:prod
docker compose build core-server
docker compose up -d core-server nginx
```

## env کلیدی (Docker)

```env
CORE_SERVER_PORT=4000
HUB_DOMAINS=fathemes.com,www.fathemes.com
SERVER_PUBLIC_IP=...
JWT_SECRET=...
MONGODB_URI=...
```

## tenant domains

Provisioning فایل `nginx/sites/{slug}.conf` می‌سازد → `proxy_pass` به `:4000`.

---

**وضعیت:** ✅ تکمیل شد
