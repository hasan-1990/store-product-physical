import type { Express, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { coreConfig } from '@core-shared';
import { connectHubDb } from '@core-shared';
import { withHub, withHubUser } from '../middleware';
import {
  updateUserProfile,
  changeUserPassword,
  listUserDigitalProducts,
  generateDownloadToken,
  verifyDownloadToken,
} from '../services/user-account';

function accountError(res: Response, error: unknown) {
  const code = error instanceof Error ? error.message : '';
  const map: Record<string, { status: number; message: string }> = {
    NOT_FOUND: { status: 404, message: 'کاربر یافت نشد' },
    WRONG_PASSWORD: { status: 400, message: 'رمز عبور فعلی صحیح نیست' },
    WEAK_PASSWORD: { status: 400, message: 'رمز عبور جدید ضعیف است' },
    INVALID_ID: { status: 400, message: 'شناسه نامعتبر' },
    PRODUCT_NOT_FOUND: { status: 404, message: 'محصول یافت نشد' },
    NOT_DIGITAL: { status: 400, message: 'محصول دیجیتال نیست' },
    NOT_PURCHASED: { status: 403, message: 'این محصول را خریداری نکرده‌اید' },
    LIMIT_REACHED: { status: 403, message: 'حد مجاز دانلود تمام شده' },
  };
  const m = map[code];
  if (m) return res.status(m.status).json({ success: false, error: m.message });
  res.status(500).json({ success: false, error: code || 'خطا' });
}

export function registerHubAccountRoutes(app: Express): void {
  app.put(
    '/api/user/profile',
    withHubUser(async (req, res) => {
      try {
        const db = await connectHubDb();
        const user = await updateUserProfile(db, req.user.id, req.body);
        res.json({ success: true, user });
      } catch (error) {
        accountError(res, error);
      }
    }),
  );

  app.put(
    '/api/user/change-password',
    withHubUser(async (req, res) => {
      try {
        const { currentPassword, newPassword } = req.body ?? {};
        const db = await connectHubDb();
        await changeUserPassword(db, req.user.id, currentPassword, newPassword);
        res.json({ success: true, message: 'رمز عبور با موفقیت تغییر یافت' });
      } catch (error) {
        accountError(res, error);
      }
    }),
  );

  app.get(
    '/api/user/digital-products',
    withHubUser(async (req, res) => {
      const db = await connectHubDb();
      const products = await listUserDigitalProducts(db, req.user.id);
      res.json({ success: true, products });
    }),
  );

  app.post(
    '/api/download/generate',
    withHubUser(async (req, res) => {
      try {
        const { productId } = req.body ?? {};
        if (!productId) return res.status(400).json({ error: 'شناسه محصول الزامی است' });
        const db = await connectHubDb();
        const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
        const result = await generateDownloadToken(db, req.user.id, productId, ip);
        res.json({ success: true, ...result });
      } catch (error) {
        accountError(res, error);
      }
    }),
  );

  app.get(
    '/api/download/file',
    withHub(async (req, res) => {
      const token = typeof req.query.token === 'string' ? req.query.token : '';
      if (!token) return res.status(400).json({ error: 'توکن الزامی است' });

      const payload = verifyDownloadToken(token);
      if (!payload?.downloadUrl) return res.status(403).json({ error: 'توکن نامعتبر' });

      const filePath = path.join(coreConfig.storeAppRoot, 'public', payload.downloadUrl.replace(/^\//, ''));
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'فایل یافت نشد' });
      }
      res.download(filePath);
    }),
  );
}
