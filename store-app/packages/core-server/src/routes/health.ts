import { Router, type Express, type Request, type Response, type NextFunction } from 'express';
import { pingMongo } from '@core-shared';

export const healthRouter = Router();

export async function sendCoreHealth(res: Response): Promise<void> {
  try {
    await pingMongo();
    res.json({
      success: true,
      service: 'core-server',
      mongo: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'core-server',
      mongo: 'error',
      error: error instanceof Error ? error.message : 'MongoDB unavailable',
    });
  }
}

healthRouter.get('/api/health', async (_req, res) => {
  await sendCoreHealth(res);
});

healthRouter.get('/health', (_req, res) => {
  res.redirect(307, '/api/health');
});

/** هاب: / همان پاسخ /api/health — بدون متن یا قالب جداگانه */
export function registerHubRootHealth(app: Express): void {
  app.get('/', async (req: Request, res: Response, next: NextFunction) => {
    if (req.ctx?.type !== 'hub') return next();
    await sendCoreHealth(res);
  });
}

/** هاب: مسیرهای غیر-API → JSON 404 */
export function registerHubPageBlocker(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.ctx?.type !== 'hub') return next();
    if (res.headersSent) return next();
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (
      req.path === '/' ||
      req.path.startsWith('/api/') ||
      req.path.startsWith('/uploads/') ||
      req.path.startsWith('/images/') ||
      req.path.startsWith('/fonts/')
    ) {
      return next();
    }
    res.status(404).json({ success: false, error: 'Not found' });
  });
}
