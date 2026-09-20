import type { Express } from 'express';
import { coreConfig, connectHubDb, pingMongo } from '@core-shared';
import { withHub } from './middleware';
import {
  registerHubPublicRoutes,
  registerHubUserRoutes,
  registerHubAdminManagedRoutes,
} from './routes/managed-sites';
import { registerHubAuthRoutes } from './routes/auth';
import { registerHubShopRoutes } from './routes/shop';
import { registerHubPaymentRoutes } from './routes/payment';
import { registerHubCatalogRoutes } from './routes/catalog';
import { registerHubCheckoutRoutes } from './routes/checkout';
import { registerHubAdminShopRoutes } from './routes/admin-shop';
import { registerHubAccountRoutes } from './routes/account';
import { registerHubCronRoutes } from './routes/cron';
import { registerHubStatic } from './static';

function hubFrontendUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    'http://localhost:3000';
  return url.replace(/\/$/, '');
}

export function registerHubRoutes(app: Express): void {
  app.get(
    '/api/hub/info',
    withHub((req, res) => {
      res.json({
        success: true,
        type: 'hub',
        host: req.ctx.host,
        mode: 'api-only',
        frontend: hubFrontendUrl(),
        apiPort: coreConfig.port,
        message: 'Hub API — UI روی Next.js (npm run dev)',
      });
    }),
  );

  app.get(
    '/api/health/hub',
    withHub(async (_req, res) => {
      const start = Date.now();
      try {
        await pingMongo();
        const db = await connectHubDb();
        await db.collection('products').findOne({});
        res.json({
          status: 'healthy',
          service: 'core-server-hub',
          timestamp: new Date().toISOString(),
          uptime: Math.floor(process.uptime()),
          responseTime: `${Date.now() - start}ms`,
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          service: 'core-server-hub',
          error: error instanceof Error ? error.message : 'Hub health check failed',
        });
      }
    }),
  );

  registerHubPublicRoutes(app);
  registerHubAuthRoutes(app);
  registerHubShopRoutes(app);
  registerHubPaymentRoutes(app);
  registerHubCatalogRoutes(app);
  registerHubCheckoutRoutes(app);
  registerHubAdminShopRoutes(app);
  registerHubAccountRoutes(app);
  registerHubCronRoutes(app);
  registerHubUserRoutes(app);
  registerHubAdminManagedRoutes(app);
  registerHubStatic(app);
}
