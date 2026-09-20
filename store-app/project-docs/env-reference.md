# مرجع Environment Variables

خلاصه متغیرهای محیطی — جزئیات کامل در `.env.example`.

## الزامی (Production)

| متغیر | توضیح | نحوه تولید |
|-------|--------|------------|
| `MONGODB_URI` | اتصال MongoDB | Atlas connection string |
| `NEXTAUTH_SECRET` | رمز NextAuth | `openssl rand -base64 64` |
| `NEXTAUTH_URL` | URL عمومی سایت | `https://yourdomain.com` |
| `JWT_SECRET` | رمز JWT API | `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | URL برای لینک‌های client | همان دامنه عمومی |

## پرداخت (حداقل یکی)

| متغیر | سرویس |
|-------|--------|
| `ZARINPAL_MERCHANT_ID` | زرین‌پال |
| `ZARINPAL_SANDBOX` | `true` برای تست |
| `ZIBAL_MERCHANT` | زیبال |
| `ZIBAL_API_KEY` | زیبال |

## اختیاری ولی توصیه‌شده

| متغیر | پیش‌فرض | توضیح |
|-------|---------|--------|
| `REDIS_ENABLED` | `false` | فعال‌سازی کش Redis |
| `REDIS_URL` | — | `redis://host:6379` |
| `EMAIL_ENABLED` | — | فعال‌سازی ایمیل |
| `SMSIR_API_KEY` | — | پیامک |
| `RATE_LIMIT_ENABLED` | — | محدودیت درخواست |
| `MAINTENANCE_MODE` | `false` | حالت تعمیر (نیاز به تکمیل middleware) |
| `LOG_LEVEL` | `info` | `error` در production |

## Feature Flags

| متغیر | Feature |
|-------|---------|
| `FEATURE_WISHLIST` | علاقه‌مندی‌ها |
| `FEATURE_REVIEWS` | نظرات |
| `FEATURE_BLOG` | بلاگ |
| `FEATURE_DISCOUNT_CODES` | کد تخفیف |
| `FEATURE_AB_TESTING` | A/B test |

## AI / Chatbot

| متغیر | Provider |
|-------|----------|
| `GEMINI_API_KEY` | Google Gemini |
| `OPENAI_API_KEY` | OpenAI |
| `GOOGLE_API_KEY` | Google APIs |

## Docker Compose

| متغیر | توضیح |
|-------|--------|
| `MONGO_ROOT_USER` | کاربر root MongoDB |
| `MONGO_ROOT_PASSWORD` | رمز MongoDB |
| `MONGO_DB_NAME` | نام دیتابیس (`store-app`) |
| `DOMAIN_NAME` | دامنه برای Nginx/Certbot |
| `NODE_VERSION` | نسخه Node در image |

## فایل‌های env

| فایل | محیط | commit؟ |
|------|------|---------|
| `.env.example` | نمونه | ✅ بله |
| `.env.local` | development | ❌ خیر |
| `.env.production` | production | ❌ خیر |

## Validation در Startup (پیشنهاد)

این متغیرها اگر در production نباشند باید **fail fast** کنند:

```typescript
const required = ['MONGODB_URI', 'NEXTAUTH_SECRET', 'JWT_SECRET', 'NEXT_PUBLIC_SITE_URL'];
if (process.env.NODE_ENV === 'production') {
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing required env: ${key}`);
  }
}
```

## نکات امنیتی

- API key واقعی در `.env.example` نگذار
- `GEMINI_API_KEY` در example اگر واقعی است → rotate کن
- Docker: env را در **runtime** inject کن، نه COPY در Dockerfile
