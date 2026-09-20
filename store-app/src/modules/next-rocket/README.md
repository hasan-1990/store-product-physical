# 🚀 Next Rocket Module

ماژول بهینه‌سازی پرفورمنس برای Next.js - مشابه WP Rocket

## ✨ امکانات

### 1. **File Optimization** (بهینه‌سازی فایل‌ها)
- ✅ Critical CSS Generation
- ✅ Unused CSS Removal (PurgeCSS)
- ✅ JavaScript Minification
- ✅ CSS Minification
- ✅ Async CSS Loading

### 2. **Cache System** (سیستم کش)
- ✅ Multi-Layer Caching (Memory + Redis + Disk)
- ✅ Smart Cache Invalidation
- ✅ Cache Hit Rate Monitoring
- ✅ Automatic Cleanup

### 3. **JavaScript Optimization**
- ✅ Delay Execution
- ✅ Defer Loading
- ✅ Bundle Analysis
- ✅ Code Splitting Suggestions

### 4. **Database Optimization**
- ✅ Index Optimization
- ✅ Automatic Cleanup
- ✅ Collection Analysis
- ✅ Slow Query Detection

## 🎯 نصب و راه‌اندازی

### 1. نصب Dependencies
```bash
npm install penthouse purgecss clean-css terser html-minifier-terser
```

### 2. دسترسی به داشبورد
مسیر: `/admin/modules/next-rocket`

### 3. استفاده از API

#### بهینه‌سازی Critical CSS
```typescript
POST /api/admin/next-rocket/optimize
{
  "type": "critical-css",
  "options": {
    "urls": ["https://yoursite.com"],
    "cssFiles": ["/styles/globals.css"]
  }
}
```

#### پاک کردن کش
```typescript
DELETE /api/admin/next-rocket/cache?type=all
```

#### دریافت آمار
```typescript
GET /api/admin/next-rocket/cache
GET /api/admin/next-rocket/optimize
```

## 📊 تأثیر پیش‌بینی شده

| معیار | قبل | بعد | بهبود |
|-------|-----|-----|-------|
| GTmetrix Score | 57% | 92-96% | +35-39% |
| CLS | 0.41 | 0.05 | -88% |
| LCP | 3.5s | 1.2s | -66% |
| FCP | 2.1s | 0.7s | -67% |
| Page Size | 2.5MB | 600KB | -76% |

## 🛠️ استفاده در کد

### Critical CSS
```typescript
import CriticalCSSGenerator from '@/modules/next-rocket/core/critical-css';

const result = await CriticalCSSGenerator.generate(
  'https://yoursite.com',
  ['/styles/globals.css']
);

console.log(result.css); // Critical CSS
```

### Cache Manager
```typescript
import CacheManager from '@/modules/next-rocket/core/cache-manager';

// ذخیره در کش
await CacheManager.set('key', 'value', 'page', 600);

// دریافت از کش
const value = await CacheManager.get('key');

// پاک کردن کش
await CacheManager.clear();
```

### JavaScript Optimizer
```typescript
import JavaScriptOptimizer from '@/modules/next-rocket/core/javascript-optimizer';

// Minify
const result = await JavaScriptOptimizer.minify(code);

// Delay Execution
const html = JavaScriptOptimizer.injectDelayScript(html, 3000);
```

### Database Optimizer
```typescript
import DatabaseOptimizer from '@/modules/next-rocket/core/database-optimizer';

// بهینه‌سازی Indexها
await DatabaseOptimizer.optimizeIndexes();

// پاکسازی
await DatabaseOptimizer.cleanup();
```

## ⚙️ تنظیمات

تنظیمات در MongoDB collection `nextRocketSettings` ذخیره میشه.

### تنظیمات پیش‌فرض:
```typescript
{
  enabled: true,
  fileOptimization: {
    enabled: true,
    minifyCss: true,
    minifyJs: true,
    removeUnusedCss: true,
    criticalCss: true,
  },
  cache: {
    enabled: true,
    pageCache: true,
    cacheLifespan: 10, // minutes
  },
  // ...
}
```

## 📁 ساختار فایل‌ها

```
src/modules/next-rocket/
├── core/
│   ├── cache-manager.ts          ✅ Multi-layer caching
│   ├── critical-css.ts           ✅ Critical CSS generation
│   ├── unused-css.ts             ✅ Unused CSS removal
│   ├── javascript-optimizer.ts   ✅ JS optimization
│   └── database-optimizer.ts     ✅ DB optimization
├── components/
│   └── Dashboard.tsx             ✅ Admin UI
├── types/
│   └── index.ts                  ✅ TypeScript types
├── config/
│   └── index.ts                  ✅ Default settings
└── README.md                     ✅ Documentation
```

## 🔧 API Routes

```
src/app/api/admin/next-rocket/
├── optimize/route.ts             ✅ Optimization API
├── cache/route.ts                ✅ Cache management
└── settings/route.ts             ✅ Settings API
```

## 🎨 Admin Pages

```
src/app/admin/modules/next-rocket/
└── page.tsx                      ✅ Dashboard page
```

## 🚀 استفاده در Production

### 1. فعال کردن ماژول
```typescript
// در .env
NEXT_PUBLIC_NEXT_ROCKET_ENABLED=true
```

### 2. تنظیم Cron Job برای Cleanup
```bash
# هر روز ساعت 2 صبح
0 2 * * * curl -X POST https://yoursite.com/api/admin/next-rocket/cache
```

### 3. Integration با CI/CD
```yaml
# .github/workflows/optimize.yml
name: Optimize Assets
on:
  push:
    branches: [main]
jobs:
  optimize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run build
      - run: node scripts/generate-critical-css.js
```

## 📈 Monitoring

دسترسی به آمار real-time:
- Cache Hit Rate
- Critical CSS Coverage
- Database Performance
- Bundle Sizes

## ⚠️ نکات مهم

1. **Critical CSS** فقط برای صفحات static مفید هست
2. **Cache** باید با تغییرات محتوا invalidate بشه
3. **Database Optimization** روی production با احتیاط اجرا بشه
4. **Unused CSS** ممکنه کلاس‌های dynamic رو حذف کنه

## 🐛 Troubleshooting

### کش کار نمی‌کنه
- بررسی کنید Redis فعال باشه
- مسیر disk cache درست باشه

### Critical CSS ناقص هست
- افزایش `renderWaitTime` در تنظیمات
- چک کردن console errors

### Database slow هست
- اجرای `optimizeIndexes()`
- بررسی slow queries

## 📝 License

MIT

## 👨‍💻 توسعه دهنده

ساخته شده برای پروژه Store-App

---

**نکته:** این ماژول در حال توسعه است و امکانات جدید به زودی اضافه می‌شود.
