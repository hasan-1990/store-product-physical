import type { Express, Response } from 'express';
import { z } from 'zod';
import { connectHubDb } from '@core-shared';
import { withHub, withHubAdmin } from '../middleware';
import {
  listHubCategories,
  getHubCategoryBySlug,
  getHubCategoryById,
  listHubHomepageCategories,
  listHubAdminCategories,
  createHubCategory,
  updateHubCategory,
  deleteHubCategory,
} from '../services/categories';
import {
  buildPublicMegaMenu,
  getAdminMegaMenuSettings,
  updateAdminMegaMenuSettings,
} from '../services/mega-menu';

function zodError(res: Response, error: z.ZodError) {
  res.status(400).json({ success: false, error: 'داده‌های ورودی نامعتبر', details: error.issues });
}

function categoryError(res: Response, error: unknown) {
  const code = error instanceof Error ? error.message : '';
  const map: Record<string, { status: number; message: string }> = {
    INVALID_ID: { status: 400, message: 'شناسه نامعتبر است' },
    INVALID_PARENT: { status: 400, message: 'شناسه دسته والد نامعتبر است' },
    PARENT_NOT_FOUND: { status: 400, message: 'دسته والد یافت نشد' },
    MAX_LEVEL: { status: 400, message: 'حداکثر سطح دسته‌بندی 3 است' },
    SLUG_EXISTS: { status: 400, message: 'این شناسه یکتا قبلاً استفاده شده است' },
    NAME_SLUG_REQUIRED: { status: 400, message: 'نام و شناسه یکتا الزامی است' },
    NOT_FOUND: { status: 404, message: 'دسته‌بندی یافت نشد' },
    HAS_CHILDREN: {
      status: 400,
      message: 'این دسته‌بندی دارای زیرمجموعه است. ابتدا زیرمجموعه‌ها را حذف کنید',
    },
    HAS_PRODUCTS: {
      status: 400,
      message: 'این دسته‌بندی دارای محصول است. ابتدا محصولات را منتقل کنید',
    },
  };
  const mapped = map[code];
  if (mapped) {
    return res.status(mapped.status).json({ success: false, error: mapped.message });
  }
  res.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : 'خطای سرور',
  });
}

export function registerHubCatalogRoutes(app: Express): void {
  app.get(
    '/api/categories',
    withHub(async (req, res) => {
      try {
        const db = await connectHubDb();
        const activeParam = typeof req.query.active === 'string' ? req.query.active : undefined;
        const levelParam = typeof req.query.level === 'string' ? req.query.level : undefined;
        const result = await listHubCategories(db, {
          page: Number(req.query.page) || 1,
          limit: Number(req.query.limit) || 10,
          search: typeof req.query.search === 'string' ? req.query.search : undefined,
          active: activeParam === 'true' ? true : activeParam === 'false' ? false : undefined,
          level: levelParam !== undefined ? Number(levelParam) : undefined,
          parentId: typeof req.query.parentId === 'string' ? req.query.parentId : undefined,
        });
        res.json(result);
      } catch {
        res.status(500).json({ success: false, error: 'خطا در دریافت دسته‌بندی‌ها' });
      }
    }),
  );

  app.post(
    '/api/categories',
    withHubAdmin(async (req, res) => {
      try {
        const db = await connectHubDb();
        const data = await createHubCategory(db, req.body);
        res.json({ success: true, data, message: 'دسته‌بندی با موفقیت ایجاد شد' });
      } catch (error) {
        if (error instanceof z.ZodError) return zodError(res, error);
        categoryError(res, error);
      }
    }),
  );

  app.get(
    '/api/categories/by-id/:id',
    withHub(async (req, res) => {
      try {
        const db = await connectHubDb();
        const category = await getHubCategoryById(db, req.params.id);
        if (!category) {
          return res.status(404).json({ success: false, error: 'دسته‌بندی یافت نشد' });
        }
        res.json({ success: true, data: category });
      } catch (error) {
        categoryError(res, error);
      }
    }),
  );

  app.put(
    '/api/categories/by-id/:id',
    withHubAdmin(async (req, res) => {
      try {
        const db = await connectHubDb();
        const data = await updateHubCategory(db, req.params.id, req.body);
        res.json({ success: true, data, message: 'دسته‌بندی با موفقیت بروزرسانی شد' });
      } catch (error) {
        categoryError(res, error);
      }
    }),
  );

  app.delete(
    '/api/categories/by-id/:id',
    withHubAdmin(async (req, res) => {
      try {
        const db = await connectHubDb();
        await deleteHubCategory(db, req.params.id);
        res.json({ success: true, message: 'دسته‌بندی با موفقیت حذف شد' });
      } catch (error) {
        categoryError(res, error);
      }
    }),
  );

  app.get(
    '/api/categories/:slug',
    withHub(async (req, res) => {
      try {
        const db = await connectHubDb();
        const category = await getHubCategoryBySlug(db, req.params.slug);
        if (!category) {
          return res.status(404).json({ success: false, error: 'دسته‌بندی یافت نشد' });
        }
        res.json({ success: true, data: category });
      } catch {
        res.status(500).json({ success: false, error: 'خطا در دریافت دسته‌بندی' });
      }
    }),
  );

  app.get(
    '/api/homepage/categories',
    withHub(async (req, res) => {
      try {
        const db = await connectHubDb();
        const result = await listHubHomepageCategories(db, {
          limit: Number(req.query.limit) || 8,
          sortBy: typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined,
          selectedIds: typeof req.query.selectedIds === 'string' ? req.query.selectedIds : undefined,
        });
        res.json(result);
      } catch {
        res.status(500).json({ error: 'Internal server error' });
      }
    }),
  );

  app.get(
    '/api/mega-menu',
    withHub(async (_req, res) => {
      try {
        const db = await connectHubDb();
        const result = await buildPublicMegaMenu(db);
        res.json(result);
      } catch {
        res.status(500).json({ success: false, error: 'خطا در دریافت مگامنو' });
      }
    }),
  );

  app.get(
    '/api/admin/categories',
    withHubAdmin(async (_req, res) => {
      try {
        const db = await connectHubDb();
        const data = await listHubAdminCategories(db);
        res.json({ success: true, data, source: 'database' });
      } catch {
        res.status(500).json({ success: false, error: 'خطا در دریافت دسته‌بندی‌ها' });
      }
    }),
  );

  app.get(
    '/api/admin/mega-menu-settings',
    withHubAdmin(async (_req, res) => {
      try {
        const db = await connectHubDb();
        const data = await getAdminMegaMenuSettings(db);
        res.json({ success: true, data });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطا',
        });
      }
    }),
  );

  app.put(
    '/api/admin/mega-menu-settings',
    withHubAdmin(async (req, res) => {
      try {
        const db = await connectHubDb();
        const data = await updateAdminMegaMenuSettings(db, req.body);
        res.json({ success: true, data });
      } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_BODY') {
          return res
            .status(400)
            .json({ success: false, error: 'داده نامعتبر است - categories آرایه نیست' });
        }
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطا',
        });
      }
    }),
  );
}
