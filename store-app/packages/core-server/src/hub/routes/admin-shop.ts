import type { Express, Response } from 'express';
import { z } from 'zod';
import { connectHubDb } from '@core-shared';
import { withHub, withHubAdmin } from '../middleware';
import {
  listAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from '../services/admin-products';

function productError(res: Response, error: unknown) {
  const code = error instanceof Error ? error.message : '';
  const map: Record<string, { status: number; message: string }> = {
    INVALID_ID: { status: 400, message: 'شناسه نامعتبر' },
    NOT_FOUND: { status: 404, message: 'محصول یافت نشد' },
    SLUG_EXISTS: { status: 400, message: 'این slug قبلاً استفاده شده' },
  };
  const m = map[code];
  if (m) return res.status(m.status).json({ success: false, error: m.message });
  if (error instanceof z.ZodError) {
    return res.status(400).json({ success: false, error: 'داده نامعتبر', details: error.issues });
  }
  res.status(500).json({ success: false, error: code || 'خطا' });
}

export function registerHubAdminShopRoutes(app: Express): void {
  app.get(
    '/api/admin/products',
    withHubAdmin(async (_req, res) => {
      const db = await connectHubDb();
      const data = await listAdminProducts(db);
      res.json({ success: true, data });
    }),
  );

  app.post(
    '/api/products',
    withHubAdmin(async (req, res) => {
      try {
        const db = await connectHubDb();
        const data = await createAdminProduct(db, req.body);
        res.json({ success: true, data, message: 'محصول ایجاد شد' });
      } catch (error) {
        productError(res, error);
      }
    }),
  );

  app.put(
    '/api/products/:id',
    withHubAdmin(async (req, res) => {
      try {
        const db = await connectHubDb();
        const data = await updateAdminProduct(db, req.params.id, req.body);
        res.json({ success: true, data });
      } catch (error) {
        productError(res, error);
      }
    }),
  );

  app.delete(
    '/api/products/:id',
    withHubAdmin(async (req, res) => {
      try {
        const db = await connectHubDb();
        const result = await deleteAdminProduct(db, req.params.id);
        res.json({ success: true, ...result });
      } catch (error) {
        productError(res, error);
      }
    }),
  );
}
