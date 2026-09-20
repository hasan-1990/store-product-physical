import './load-env';
import express from 'express';
import cookieParser from 'cookie-parser';
import { coreConfig, closeMongoConnections } from '@core-shared';
import { contextMiddleware } from './middleware/context';
import { tenantStaticRouter } from './middleware/tenant-static';
import { healthRouter, registerHubRootHealth, registerHubPageBlocker } from './routes/health';
import { registerHubRoutes } from './hub/register';
import { registerNextApiBridge, registerApiNotFound } from './hub/legacy/register-next-api-bridge';
import { tenantRouter, mountTenantTemplateRoutes } from './routes/tenant';

const app = express();

app.disable('x-powered-by');
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(healthRouter);
app.use(contextMiddleware);
registerHubRootHealth(app);

async function bootstrap(): Promise<void> {
  registerHubRoutes(app);
  await registerNextApiBridge(app);
  registerApiNotFound(app);
  app.use(tenantStaticRouter);
  app.use(tenantRouter);
  registerHubPageBlocker(app);
  mountTenantTemplateRoutes(app);

  app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[core-server]', err);
    if (!res.headersSent && req.accepts('html') && !req.path.startsWith('/api/')) {
      res.status(500).type('html').send(
        `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>خطا</title></head>
<body style="font-family:tahoma;padding:2rem"><h1>خطای سرور</h1>
<p>اتصال به دیتابیس یا سرویس داخلی برقرار نشد. <code>MONGODB_URI</code> را در <code>.env.local</code> بررسی کنید.</p>
<a href="/">تلاش مجدد</a></body></html>`,
      );
      return;
    }
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  });

  const server = app.listen(coreConfig.port, () => {
    console.log(`[core-server] listening on http://localhost:${coreConfig.port}`);
    console.log(`[core-server] hub domains: ${coreConfig.hubDomains}`);
    console.log(`[core-server] hub API: http://localhost:${coreConfig.port}/api/health`);
    console.log(`[core-server] hub status: http://localhost:${coreConfig.port}/`);
    console.log(`[core-server] فرانت Next: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`);
  });

  async function shutdown(): Promise<void> {
    server.close();
    await closeMongoConnections();
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('[core-server] failed to start', error);
  process.exit(1);
});
