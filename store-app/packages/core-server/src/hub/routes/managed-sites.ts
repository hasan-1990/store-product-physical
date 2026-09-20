import type { Express } from 'express';
import { z } from 'zod';
import { connectHubDb } from '@core-shared';
import { withHub, withHubUser, withHubAdmin } from '../middleware';
import { getPublicSettings } from '../services/public-settings';
import { checkAndUpdateInstanceDns, verifyInstanceLicense } from '../services/site-instances';

const createTemplateSchema = z.object({
  slug: z.string().min(2),
  name: z.string().min(2),
  folderPath: z.string().min(1),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  version: z.string().optional(),
  demoUrl: z.string().optional(),
  active: z.boolean().optional(),
  basePrice: z.number().optional(),
  linkedProductId: z.string().optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.string().optional(),
      ogImage: z.string().optional(),
      canonicalUrl: z.string().optional(),
    })
    .optional(),
});

export function registerHubPublicRoutes(app: Express): void {
  app.get(
    '/api/public-settings',
    withHub(async (_req, res) => {
      try {
        const db = await connectHubDb();
        const data = await getPublicSettings(db);
        res.json({ success: true, data });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطا در دریافت تنظیمات',
        });
      }
    }),
  );

  app.get(
    '/api/site-templates',
    withHub(async (_req, res) => {
      try {
        const db = await connectHubDb();
        const templates = await db
          .collection('siteTemplates')
          .find({ active: true })
          .sort({ createdAt: -1 })
          .toArray();
        res.json({ success: true, templates });
      } catch {
        res.status(500).json({ success: false, error: 'خطا' });
      }
    }),
  );

  app.get(
    '/api/site-templates/:slug',
    withHub(async (req, res) => {
      try {
        const db = await connectHubDb();
        const template = await db.collection('siteTemplates').findOne({
          slug: req.params.slug,
          active: true,
        });
        if (!template) {
          return res.status(404).json({ success: false, error: 'قالب یافت نشد' });
        }
        res.json({ success: true, template });
      } catch {
        res.status(500).json({ success: false, error: 'خطا' });
      }
    }),
  );

  app.post(
    '/api/instances/verify',
    withHub(async (req, res) => {
      try {
        const { slug, domain, licenseKey } = req.body ?? {};
        if (!slug || !domain || !licenseKey) {
          return res.status(400).json({
            success: false,
            valid: false,
            error: 'slug, domain, licenseKey الزامی است',
          });
        }
        const db = await connectHubDb();
        const result = await verifyInstanceLicense(db, slug, domain, licenseKey);
        res.json({ success: true, ...result });
      } catch {
        res.status(500).json({ success: false, valid: false, error: 'خطای سرور' });
      }
    }),
  );
}

export function registerHubUserRoutes(app: Express): void {
  app.get(
    '/api/user/my-sites',
    withHubUser(async (req, res) => {
      try {
        const db = await connectHubDb();
        const instances = await db
          .collection('siteInstances')
          .find({ userId: req.user.id })
          .sort({ createdAt: -1 })
          .toArray();
        res.json({ success: true, instances });
      } catch {
        res.status(500).json({ success: false, error: 'خطا' });
      }
    }),
  );

  app.post(
    '/api/user/my-sites/:slug/check-dns',
    withHubUser(async (req, res) => {
      try {
        const db = await connectHubDb();
        const instance = await db.collection('siteInstances').findOne({
          slug: req.params.slug,
          userId: req.user.id,
        });
        if (!instance) {
          return res.status(404).json({ success: false, error: 'یافت نشد' });
        }
        const updated = await checkAndUpdateInstanceDns(db, req.params.slug);
        res.json({ success: true, instance: updated });
      } catch {
        res.status(500).json({ success: false, error: 'خطا' });
      }
    }),
  );
}

export function registerHubAdminManagedRoutes(app: Express): void {
  app.get(
    '/api/admin/site-instances',
    withHubAdmin(async (req, res) => {
      try {
        const db = await connectHubDb();
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const filter = status ? { status } : {};
        const instances = await db
          .collection('siteInstances')
          .find(filter)
          .sort({ createdAt: -1 })
          .toArray();
        res.json({ success: true, instances });
      } catch {
        res.status(500).json({ success: false, error: 'خطا' });
      }
    }),
  );

  app.get(
    '/api/admin/site-instances/:slug',
    withHubAdmin(async (req, res) => {
      try {
        const db = await connectHubDb();
        const instance = await db.collection('siteInstances').findOne({ slug: req.params.slug });
        if (!instance) {
          return res.status(404).json({ success: false, error: 'یافت نشد' });
        }
        res.json({ success: true, instance });
      } catch {
        res.status(500).json({ success: false, error: 'خطا' });
      }
    }),
  );

  app.patch(
    '/api/admin/site-instances/:slug',
    withHubAdmin(async (req, res) => {
      try {
        const db = await connectHubDb();
        const { action } = req.body ?? {};

        if (action === 'check-dns') {
          const instance = await checkAndUpdateInstanceDns(db, req.params.slug);
          return res.json({ success: true, instance });
        }
        if (action === 'suspend') {
          await db.collection('siteInstances').updateOne(
            { slug: req.params.slug },
            { $set: { status: 'suspended', updatedAt: new Date().toISOString() } },
          );
        }
        if (action === 'activate') {
          await db.collection('siteInstances').updateOne(
            { slug: req.params.slug },
            { $set: { status: 'active', updatedAt: new Date().toISOString() } },
          );
        }

        const instance = await db.collection('siteInstances').findOne({ slug: req.params.slug });
        res.json({ success: true, instance });
      } catch {
        res.status(500).json({ success: false, error: 'خطا' });
      }
    }),
  );

  app.get(
    '/api/admin/site-templates',
    withHubAdmin(async (req, res) => {
      try {
        const db = await connectHubDb();
        const activeOnly = req.query.active === 'true';
        const filter = activeOnly ? { active: true } : {};
        const templates = await db
          .collection('siteTemplates')
          .find(filter)
          .sort({ createdAt: -1 })
          .toArray();
        res.json({ success: true, templates });
      } catch {
        res.status(500).json({ success: false, error: 'خطا در دریافت قالب‌ها' });
      }
    }),
  );

  app.post(
    '/api/admin/site-templates',
    withHubAdmin(async (req, res) => {
      try {
        const body = createTemplateSchema.parse(req.body);
        const db = await connectHubDb();
        const existing = await db.collection('siteTemplates').findOne({ slug: body.slug });
        if (existing) {
          return res.status(409).json({ success: false, error: 'این slug قبلاً ثبت شده' });
        }

        const now = new Date().toISOString();
        const template = {
          slug: body.slug,
          name: body.name,
          folderPath: body.folderPath,
          shortDescription: body.shortDescription || '',
          description: body.description || '',
          thumbnail: body.thumbnail || '',
          gallery: body.gallery || [],
          features: body.features || [],
          version: body.version || '1.0.0',
          demoUrl: body.demoUrl || '',
          active: body.active !== false,
          seo: {
            title: body.seo?.title || body.name,
            description: body.seo?.description || body.shortDescription || '',
            keywords: body.seo?.keywords || '',
            ogImage: body.seo?.ogImage || body.thumbnail || '',
            canonicalUrl: body.seo?.canonicalUrl || `/templates/${body.slug}`,
          },
          basePrice: body.basePrice,
          linkedProductId: body.linkedProductId,
          createdAt: now,
          updatedAt: now,
        };

        const result = await db.collection('siteTemplates').insertOne(template);
        res.json({
          success: true,
          template: { ...template, _id: result.insertedId.toString() },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ success: false, error: 'داده نامعتبر', details: error.issues });
        }
        res.status(500).json({ success: false, error: 'خطا در ایجاد قالب' });
      }
    }),
  );
}
