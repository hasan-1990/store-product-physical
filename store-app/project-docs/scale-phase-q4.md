# فاز Q4 2026 — Scale (تکمیل)

آخرین به‌روزرسانی: ژوئن ۲۰۲۶

## خلاصه

| مورد | وضعیت | فایل / دستور |
|------|--------|----------------|
| Redis اجباری production | ✅ | `deploy-checks.ts`, `docker-compose.yml` |
| CDN static/uploads | ✅ | `src/lib/cdn.ts`, Nginx `/uploads/` |
| Monitoring | ✅ | Uptime Kuma + Sentry اختیاری |
| Backup/restore | ✅ | `mongodb-backup.ts`, cron, `db:backup` |
| OpenAPI | ✅ | `data/openapi.json`, `GET /api/openapi` |
| Health Scale | ✅ | `GET /api/health/scale` |

---

## ۱. Redis در Production

`docker-compose.yml` از قبل `REDIS_ENABLED=true` دارد.

چک‌ها:
- `npm run deploy:check` — REDIS_ENABLED + REDIS_URL
- `GET /api/health/deploy` — redis ping
- `GET /api/health/scale` — scale readiness

---

## ۲. CDN

### Edge (پیش‌فرض)
Nginx مستقیم `/uploads/` را از volume سرو می‌کند با cache 1 سال.

### CDN خارجی (اختیاری)
```env
CDN_URL=https://cdn.yourdomain.com
CDN_UPLOADS_URL=https://static.yourdomain.com
```

کد: `cdnUrl()`, `uploadsUrl()` در `src/lib/cdn.ts`  
Next.js: `assetPrefix` از `CDN_URL` در `next.config.ts`

---

## ۳. Monitoring

| ابزار | نحوه |
|--------|------|
| **Uptime Kuma** | `docker compose` → پورت `3001` |
| **Sentry** | `SENTRY_DSN=...` → `error-monitoring.ts` در startup |
| **Health** | `GET /api/health`, `/api/health/scale` |

---

## ۴. Backup / Restore

### دستی
```bash
npm run db:backup
```

### Cron روزانه (02:00)
```bash
npm run scale:seed   # یک‌بار — job بک‌آپ در MongoDB
```

خروجی: `database-backup/backup-{timestamp}/`  
فرمت: JSON per collection + `backup-metadata.json`

### Restore
```bash
node scripts/restore-mongodb.js "MONGODB_URI" "database-backup/backup-..."
```

---

## ۵. OpenAPI

- Spec: `data/openapi.json`
- Endpoint: `GET /api/openapi`
- Swagger UI: می‌توانید spec را در https://editor.swagger.io import کنید

---

## ۶. تأیید

```bash
npm run verify:scale
curl http://localhost:3000/api/health/scale
```

---

## باقی‌مانده (بعد از Scale)

- `reactStrictMode: true`
- گسترش OpenAPI به همه admin APIها
- CDN واقعی Cloudflare R2 / Bunny (در صورت نیاز)
