import type { Express } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { withTenant, tenantDb, SHOP_STARTER_SLUG } from './middleware';
import {
  listProducts,
  getProductBySlug,
  createProduct,
  getSiteContent,
  countProducts,
  getLowStockProducts,
} from './services/catalog';
import {
  getCartItemsForSession,
  addToCart,
  clearCart,
  updateCartItemQuantity,
  removeCartItem,
  createOrder,
  listOrders,
  listOrdersBySession,
  updateOrderStatus,
  getPromoDiscount,
  getCartSubtotal,
  getOrderStats,
  getSalesChartData,
  findAdminByEmail,
} from './services/commerce';
import {
  getAdminFromRequest,
  verifyPassword,
  signAdminToken,
  setAdminCookie,
  clearAdminCookie,
} from './auth';
import {
  getCartSessionFromRequest,
  resolveCartSessionId,
  ensureCartSessionCookie,
} from './session';
import { registerShopStarterStatic } from './static';
import { registerShopStarterUi } from './ui/routes';

const categoryLabels: Record<string, string> = {
  skincare: 'مراقبت پوست',
  'face-makeup': 'آرایش صورت',
  'eye-makeup': 'آرایش چشم',
  'lip-makeup': 'آرایش لب',
  fragrance: 'عطر و ادکلن',
  hair: 'مراقبت از مو',
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    .replace(/-+/g, '-');
}

const createProductSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0).default(0),
  category: z.string(),
  brand: z.string(),
  image: z.string().optional(),
  active: z.boolean().default(true),
  skinTypes: z.array(z.string()).optional(),
});

const addCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
});

const patchCartSchema = z.object({
  quantity: z.coerce.number().int().min(1),
});

const createOrderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(10),
  customerEmail: z.string().email().optional(),
  address: z.string().min(5),
  paymentMethod: z.enum(['online', 'cod']),
  promoCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const patchOrderSchema = z.object({
  orderNumber: z.string(),
  status: z.enum(['processing', 'shipped', 'cancelled', 'delivered']),
});

function zodError(res: import('express').Response, error: z.ZodError, message = 'داده‌های ورودی نامعتبر') {
  res.status(400).json({ success: false, error: message, details: error.issues });
}

export function registerShopStarterApi(app: Express): void {
  app.get(
    '/api/products',
    withTenant(async (req, res) => {
      const db = await tenantDb(req);
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const activeOnly = req.query.all !== 'true';
      const products = await listProducts(db, { category, activeOnly });
      res.json({ success: true, data: products });
    }),
  );

  app.get(
    '/api/products/:slug',
    withTenant(async (req, res) => {
      const db = await tenantDb(req);
      const product = await getProductBySlug(db, req.params.slug);
      if (!product) {
        return res.status(404).json({ success: false, error: 'محصول یافت نشد' });
      }
      res.json({ success: true, data: product });
    }),
  );

  app.post(
    '/api/products',
    withTenant(async (req, res) => {
      const admin = getAdminFromRequest(req);
      if (!admin) {
        return res.status(401).json({ success: false, error: 'دسترسی غیرمجاز' });
      }

      try {
        const data = createProductSchema.parse(req.body);
        const db = await tenantDb(req);
        const category = data.category;
        const slug = data.slug || slugify(data.name);
        const categoryLabel = categoryLabels[category] || data.category;

        const id = await createProduct(db, {
          slug,
          name: data.name,
          category,
          categoryLabel,
          categorySlug: category,
          price: data.price,
          image: data.image || '/images/products/serum-main.jpg',
          badge: 'جدید',
          skinTypes: data.skinTypes || ['combination'],
          brand: data.brand,
          stock: data.stock,
          active: data.active,
          featured: false,
          gallery: [data.image || '/images/products/serum-main.jpg'],
          rating: 4.5,
          reviewCount: 0,
          shortDescription: data.description || data.name,
          description: { title: data.name, body: data.description || '', benefits: [] },
          ingredients: [],
          howToUse: [],
          highlights: [],
          reviews: [],
          related: [],
        });

        res.json({ success: true, id, slug });
      } catch (error) {
        if (error instanceof z.ZodError) return zodError(res, error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطا در ایجاد محصول',
        });
      }
    }),
  );

  app.get(
    '/api/site-content',
    withTenant(async (req, res) => {
      const db = await tenantDb(req);
      const content = await getSiteContent(db);
      if (!content) {
        return res.json({ success: true, data: null, message: 'No site content — run seed' });
      }
      res.json({ success: true, data: content });
    }),
  );

  app.get(
    '/api/promo',
    withTenant(async (req, res) => {
      const code = typeof req.query.code === 'string' ? req.query.code : '';
      if (!code.trim()) {
        return res.json({ valid: false, discount: 0 });
      }
      const db = await tenantDb(req);
      const discount = await getPromoDiscount(db, code);
      res.json({ valid: discount > 0, discount });
    }),
  );

  app.get(
    '/api/cart',
    withTenant(async (req, res) => {
      const sessionId = getCartSessionFromRequest(req);
      if (!sessionId) {
        return res.json({ success: true, data: [] });
      }
      const db = await tenantDb(req);
      const items = await getCartItemsForSession(db, sessionId);
      res.json({ success: true, data: items });
    }),
  );

  app.post(
    '/api/cart',
    withTenant(async (req, res) => {
      try {
        const data = addCartSchema.parse(req.body);
        const sessionId = resolveCartSessionId(req);
        const db = await tenantDb(req);
        await addToCart(db, sessionId, data.productId, data.quantity);
        ensureCartSessionCookie(req, res, sessionId);
        res.json({ success: true, message: 'به سبد اضافه شد' });
      } catch (error) {
        if (error instanceof z.ZodError) return zodError(res, error);
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطا در افزودن به سبد',
        });
      }
    }),
  );

  app.delete(
    '/api/cart',
    withTenant(async (req, res) => {
      const sessionId = getCartSessionFromRequest(req);
      if (sessionId) {
        const db = await tenantDb(req);
        await clearCart(db, sessionId);
      }
      res.json({ success: true });
    }),
  );

  app.patch(
    '/api/cart/:id',
    withTenant(async (req, res) => {
      const sessionId = getCartSessionFromRequest(req);
      if (!sessionId) {
        return res.status(400).json({ success: false, error: 'سبد خرید یافت نشد' });
      }
      try {
        const { quantity } = patchCartSchema.parse(req.body);
        const db = await tenantDb(req);
        await updateCartItemQuantity(db, sessionId, req.params.id, quantity);
        res.json({ success: true });
      } catch (error) {
        if (error instanceof z.ZodError) return zodError(res, error);
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطا در بروزرسانی سبد',
        });
      }
    }),
  );

  app.delete(
    '/api/cart/:id',
    withTenant(async (req, res) => {
      const sessionId = getCartSessionFromRequest(req);
      if (!sessionId) {
        return res.status(400).json({ success: false, error: 'سبد خرید یافت نشد' });
      }
      const db = await tenantDb(req);
      await removeCartItem(db, sessionId, req.params.id);
      res.json({ success: true });
    }),
  );

  app.get(
    '/api/orders',
    withTenant(async (req, res) => {
      const db = await tenantDb(req);
      const admin = getAdminFromRequest(req);
      if (admin) {
        const orders = await listOrders(db, 50);
        return res.json({ success: true, data: orders });
      }
      const sessionId = getCartSessionFromRequest(req);
      if (!sessionId) {
        return res.json({ success: true, data: [] });
      }
      const orders = await listOrdersBySession(db, sessionId);
      res.json({ success: true, data: orders });
    }),
  );

  app.post(
    '/api/orders',
    withTenant(async (req, res) => {
      try {
        const data = createOrderSchema.parse(req.body);
        const sessionId = getCartSessionFromRequest(req) || resolveCartSessionId(req);
        const db = await tenantDb(req);
        const cartItems = await getCartItemsForSession(db, sessionId);

        if (cartItems.length === 0) {
          return res.status(400).json({ success: false, error: 'سبد خرید خالی است' });
        }

        const subtotal = getCartSubtotal(cartItems);
        const discount = data.promoCode ? await getPromoDiscount(db, data.promoCode) : 0;
        const shippingCost = 0;
        const total = Math.max(0, subtotal + shippingCost - discount);

        const result = await createOrder(db, {
          sessionId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          address: data.address,
          paymentMethod: data.paymentMethod,
          items: cartItems.map((item) => ({
            productId: item.productId,
            slug: item.slug,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          subtotal,
          discount,
          shippingCost,
          total,
        });

        ensureCartSessionCookie(req, res, sessionId);
        res.json({
          success: true,
          orderNumber: result.orderNumber,
          message: 'سفارش با موفقیت ثبت شد',
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: 'اطلاعات سفارش نامعتبر است',
            details: error.issues,
          });
        }
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطا در ثبت سفارش',
        });
      }
    }),
  );

  app.get(
    '/api/admin/orders',
    withTenant(async (req, res) => {
      const admin = getAdminFromRequest(req);
      if (!admin) {
        return res.status(401).json({ success: false, error: 'دسترسی غیرمجاز' });
      }
      const limit = Number(req.query.limit || 50);
      const db = await tenantDb(req);
      const orders = await listOrders(db, limit);
      res.json({ success: true, data: orders });
    }),
  );

  app.patch(
    '/api/admin/orders',
    withTenant(async (req, res) => {
      const admin = getAdminFromRequest(req);
      if (!admin) {
        return res.status(401).json({ success: false, error: 'دسترسی غیرمجاز' });
      }
      try {
        const { orderNumber, status } = patchOrderSchema.parse(req.body);
        const db = await tenantDb(req);
        await updateOrderStatus(db, orderNumber, status);
        res.json({ success: true });
      } catch (error) {
        if (error instanceof z.ZodError) return zodError(res, error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطا در بروزرسانی سفارش',
        });
      }
    }),
  );

  app.get(
    '/api/admin/stats',
    withTenant(async (req, res) => {
      const admin = getAdminFromRequest(req);
      if (!admin) {
        return res.status(401).json({ success: false, error: 'دسترسی غیرمجاز' });
      }
      const db = await tenantDb(req);
      const [stats, chart, productCount, lowStock] = await Promise.all([
        getOrderStats(db),
        getSalesChartData(db),
        countProducts(db),
        getLowStockProducts(db),
      ]);
      res.json({ success: true, data: { stats, chart, productCount, lowStock } });
    }),
  );

  app.post(
    '/api/auth/admin/login',
    withTenant(async (req, res) => {
      try {
        const { email, password } = loginSchema.parse(req.body);
        const db = await tenantDb(req);
        const admin = await findAdminByEmail(db, email);
        if (!admin) {
          return res.status(401).json({ success: false, error: 'ایمیل یا رمز عبور اشتباه است' });
        }

        const adminDoc = admin as { _id: ObjectId; email: string; passwordHash: string; name?: string };
        const valid = await verifyPassword(password, adminDoc.passwordHash);
        if (!valid) {
          return res.status(401).json({ success: false, error: 'ایمیل یا رمز عبور اشتباه است' });
        }

        const token = signAdminToken({
          sub: adminDoc._id.toString(),
          email: adminDoc.email,
          role: 'admin',
        });

        setAdminCookie(res, token);
        res.json({
          success: true,
          admin: { name: adminDoc.name ?? 'مدیر', email: adminDoc.email },
        });
      } catch (error) {
        if (error instanceof z.ZodError) return zodError(res, error, 'داده‌های ورودی نامعتبر است');
        res.status(500).json({ success: false, error: 'خطا در ورود' });
      }
    }),
  );

  app.get(
    '/api/auth/admin/login',
    withTenant(async (req, res) => {
      const admin = getAdminFromRequest(req);
      if (!admin) {
        return res.status(401).json({ success: false, authenticated: false });
      }
      res.json({ success: true, authenticated: true, admin });
    }),
  );

  app.delete(
    '/api/auth/admin/login',
    withTenant(async (_req, res) => {
      clearAdminCookie(res);
      res.json({ success: true });
    }),
  );
}

export { SHOP_STARTER_SLUG };

export const shopStarterTemplate = {
  slug: SHOP_STARTER_SLUG,
  registerRoutes: registerShopStarterAll,
};

export function registerShopStarterAll(app: Express): void {
  registerShopStarterStatic(app);
  registerShopStarterApi(app);
  registerShopStarterUi(app);
}
