import type { Express, Response } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { connectHubDb } from '@core-shared';
import { withHub, withHubUser } from '../middleware';
import { listHubProducts, getHubProductById } from '../services/products';
import { getHubCartItems, addHubCartItem, clearHubCart } from '../services/cart';
import { listHubOrdersForUser, createHubOrder } from '../services/orders';

const CART_SESSION_COOKIE = 'cart_session';

function cartCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

function resolveSessionId(req: import('express').Request): string {
  return (req.cookies?.[CART_SESSION_COOKIE] as string) || randomUUID();
}

function zodError(res: Response, error: z.ZodError) {
  res.status(400).json({ success: false, error: 'داده‌های ورودی نامعتبر', details: error.issues });
}

const addCartSchema = z
  .object({
    productId: z.string().min(1),
    quantity: z.coerce.number().int().min(1),
    size: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    userId: z.string().optional().nullable(),
    sessionId: z.string().optional().nullable(),
  })
  .refine((d) => d.userId || d.sessionId, { message: 'userId یا sessionId الزامی است' });

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        price: z.number().positive(),
      }),
    )
    .min(1),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(10),
    address: z.string().min(10),
    city: z.string().min(2),
    postalCode: z.string().min(5),
  }),
  shippingAmount: z.number().min(0).optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export function registerHubShopRoutes(app: Express): void {
  app.get(
    '/api/products',
    withHub(async (req, res) => {
      try {
        const db = await connectHubDb();
        const result = await listHubProducts(db, {
          page: Number(req.query.page) || 1,
          limit: Number(req.query.limit) || 10,
          search: typeof req.query.search === 'string' ? req.query.search : undefined,
          categoryId: typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined,
          active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
          featured: req.query.featured === 'true' ? true : undefined,
          sortBy: typeof req.query.sortBy === 'string' ? req.query.sortBy : 'createdAt',
          sortOrder: req.query.sortOrder === 'asc' ? 'asc' : 'desc',
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطا در دریافت محصولات',
        });
      }
    }),
  );

  app.get(
    '/api/products/:id',
    withHub(async (req, res) => {
      try {
        const db = await connectHubDb();
        const product = await getHubProductById(db, req.params.id);
        if (!product) {
          return res.status(404).json({ success: false, error: 'محصول یافت نشد' });
        }
        res.json({ success: true, data: product });
      } catch {
        res.status(500).json({ success: false, error: 'خطا در دریافت محصول' });
      }
    }),
  );

  app.get(
    '/api/cart',
    withHub(async (req, res) => {
      try {
        const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
        const sessionId =
          (typeof req.query.sessionId === 'string' ? req.query.sessionId : null) ||
          (req.cookies?.[CART_SESSION_COOKIE] as string) ||
          null;
        if (!userId && !sessionId) {
          return res.status(400).json({ success: false, error: 'User ID یا Session ID الزامی است' });
        }
        const db = await connectHubDb();
        const data = await getHubCartItems(db, userId, sessionId);
        res.json({ success: true, data, message: 'سبد خرید با موفقیت دریافت شد' });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطا در دریافت سبد خرید',
        });
      }
    }),
  );

  app.post(
    '/api/cart',
    withHub(async (req, res) => {
      try {
        const data = addCartSchema.parse(req.body);
        const sessionId = data.sessionId || resolveSessionId(req);
        const db = await connectHubDb();
        await addHubCartItem(db, { ...data, sessionId });
        if (!data.userId && !req.cookies?.[CART_SESSION_COOKIE]) {
          res.cookie(CART_SESSION_COOKIE, sessionId, cartCookieOptions());
        }
        res.json({ success: true, message: 'محصول به سبد خرید اضافه شد' });
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
    withHub(async (req, res) => {
      try {
        const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
        const sessionId =
          (typeof req.query.sessionId === 'string' ? req.query.sessionId : null) ||
          (req.cookies?.[CART_SESSION_COOKIE] as string) ||
          null;
        const db = await connectHubDb();
        await clearHubCart(db, userId, sessionId);
        res.json({ success: true, message: 'سبد خرید پاک شد' });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطا',
        });
      }
    }),
  );

  app.get(
    '/api/orders',
    withHub(async (req, res) => {
      try {
        const userId = typeof req.query.userId === 'string' ? req.query.userId : '';
        if (!userId) {
          return res.status(400).json({ success: false, error: 'userId الزامی است' });
        }
        const db = await connectHubDb();
        const result = await listHubOrdersForUser(
          db,
          userId,
          Number(req.query.page) || 1,
          Number(req.query.limit) || 10,
        );
        res.json(result);
      } catch {
        res.status(500).json({ success: false, error: 'خطا در دریافت سفارشات' });
      }
    }),
  );

  app.post(
    '/api/orders',
    withHubUser(async (req, res) => {
      try {
        const data = createOrderSchema.parse(req.body);
        const db = await connectHubDb();
        const result = await createHubOrder(db, req.user.id, data);
        res.json({ success: true, data: result, message: 'سفارش ثبت شد' });
      } catch (error) {
        if (error instanceof z.ZodError) return zodError(res, error);
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطا در ثبت سفارش',
        });
      }
    }),
  );
}
