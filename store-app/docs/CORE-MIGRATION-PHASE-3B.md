# فاز ۳b — auth + فروشگاه + payment هاب

> مسیر: `docs/CORE-MIGRATION-PHASE-3B.md`  
> پیش‌نیاز: [CORE-MIGRATION-PHASE-3.md](./CORE-MIGRATION-PHASE-3.md) ✅

## چک‌لیست APIهای منتقل‌شده

### احراز هویت

| Route | Method | وضعیت |
|-------|--------|--------|
| `/api/auth/login` | POST | ✅ |
| `/api/auth/register` | POST | ✅ |
| `/api/auth/check` | GET | ✅ |
| `/api/user/profile` | GET | ✅ |

### فروشگاه

| Route | Method | وضعیت |
|-------|--------|--------|
| `/api/products` | GET | ✅ |
| `/api/products/:id` | GET | ✅ |
| `/api/cart` | GET, POST, DELETE | ✅ |
| `/api/orders` | GET, POST | ✅ |

### پرداخت

| Route | Method | وضعیت |
|-------|--------|--------|
| `/api/payment/request` | POST | ✅ |
| `/api/payment/verify` | GET | ✅ (redirect) |

## ساختار کد

```
packages/core-server/src/hub/
  routes/auth.ts, shop.ts, payment.ts
  services/auth-users.ts, products.ts, cart.ts, orders.ts, payment-gateways.ts
```

## تست

```powershell
npm run core:dev

# ثبت‌نام / ورود
curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"...\",\"password\":\"...\"}"

# محصولات
curl http://localhost:4000/api/products?limit=5

# با توکن
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/user/profile
```

## محدودیت‌ها

- OTP / forgot-password هنوز روی Next
- POST `/api/orders` فقط با JWT (کاربر لاگین)
- Admin shop APIs (CRUD محصول) هنوز Next
- Cache (Redis) در Express فعلاً غیرفعال — مستقیم MongoDB

## گام بعدی

- **فاز ۴:** UI هاب روی Express
- **فاز ۵:** provisioning جدید
- یا **فاز ۳c:** categories, mega-menu, admin shop — ✅ [جزئیات](./CORE-MIGRATION-PHASE-3C.md)

---

**آخرین به‌روزرسانی:** فاز ۳b — تکمیل شد ✅
