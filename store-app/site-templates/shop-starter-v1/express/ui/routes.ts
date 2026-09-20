import type { Express } from 'express';
import { withTenant } from '../middleware';
import {
  renderHome,
  renderProducts,
  renderProduct,
  renderCart,
  renderAdminLogin,
  renderAdminDashboard,
} from './pages';

/** صفحات HTML سبک tenant — جایگزین موقت Next تا فاز UI کامل */
export function registerShopStarterUi(app: Express): void {
  app.get(
    '/',
    withTenant(async (req, res) => {
      const html = await renderHome(req);
      res.type('html').send(html);
    }),
  );

  app.get(
    '/products',
    withTenant(async (req, res) => {
      const html = await renderProducts(req);
      res.type('html').send(html);
    }),
  );

  app.get(
    '/products/:slug',
    withTenant(async (req, res) => {
      const html = await renderProduct(req, req.params.slug);
      if (!html) {
        return res.status(404).type('html').send('<h1>محصول یافت نشد</h1>');
      }
      res.type('html').send(html);
    }),
  );

  app.get(
    '/cart',
    withTenant(async (req, res) => {
      const html = await renderCart(req);
      res.type('html').send(html);
    }),
  );

  app.get(
    '/admin/login',
    withTenant(async (req, res) => {
      const html = await renderAdminLogin(req);
      res.type('html').send(html);
    }),
  );

  app.get(
    '/admin',
    withTenant(async (req, res) => {
      const html = await renderAdminDashboard(req);
      if (!html) {
        return res.redirect(302, '/admin/login');
      }
      res.type('html').send(html);
    }),
  );
}
