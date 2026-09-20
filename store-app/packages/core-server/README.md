# Core Server (Express)

وب‌سرور چندمستاجری managed sites — یک process برای همه دامنه‌ها.

## اجرا

از ریشه `store-app`:

```bash
npm run core:dev
```

## env

```env
CORE_SERVER_PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/store-app
HUB_DOMAINS=localhost,127.0.0.1,fathemes.com,www.fathemes.com
```

## Production (Docker)

```bash
docker compose build core-server
docker compose up -d core-server nginx
```

Image: `Dockerfile.core-server` — بدون Next.js.

## تست محلی

```bash
# health
curl http://localhost:4000/api/health

# hub UI
curl -H "Host: localhost" http://localhost:4000/

# hub API
curl http://localhost:4000/api/public-settings
curl http://localhost:4000/api/health/hub
```

مستندات: [CORE-MIGRATION-INDEX.md](../../docs/CORE-MIGRATION-INDEX.md)

## ساختار

```
packages/core-server/src/
  server.ts
  hub/                  # API + UI هاب
    ui/                 # HTML shell (فاز ۴)
  middleware/
  routes/health.ts, tenant.ts
```

مرجع: [docs/MANAGED-SITE-ARCHITECTURE.md](../../docs/MANAGED-SITE-ARCHITECTURE.md)
