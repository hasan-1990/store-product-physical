import { Router } from 'express';
import { getTenantDb } from '@core-shared';
import { requireTenant } from '../middleware/require-context';
import { mountTemplateRoutes } from '../templates/loader';

export const tenantRouter = Router();

tenantRouter.use(requireTenant);

tenantRouter.get('/api/tenant/info', async (req, res) => {
  const db = await getTenantDb(req.ctx!.databaseName);
  const productCount = await db.collection('products').countDocuments({ active: { $ne: false } });

  res.json({
    success: true,
    type: 'tenant',
    host: req.ctx.host,
    slug: req.ctx.instance.slug,
    templateSlug: req.ctx.templateSlug,
    databaseName: req.ctx.databaseName,
    productCount,
  });
});

export function mountTenantTemplateRoutes(router: Router): void {
  mountTemplateRoutes(router);
}
