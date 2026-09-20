import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import {
  isHubHost,
  parseHubDomains,
  resolveSiteInstance,
  coreConfig,
  type RequestContext,
} from '@core-shared';

declare global {
  namespace Express {
    interface Request {
      ctx?: RequestContext;
    }
  }
}

const hubDomains = parseHubDomains(coreConfig.hubDomains);

const PUBLIC_PATHS = new Set(['/api/health', '/health']);

export async function contextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (PUBLIC_PATHS.has(req.path)) {
    return next();
  }

  const host = req.hostname;

  if (isHubHost(host, hubDomains)) {
    req.ctx = { type: 'hub', host };
    return next();
  }

  const instance = await resolveSiteInstance(host);

  if (!instance) {
    res.status(404).type('html').send(`<!DOCTYPE html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>سایت یافت نشد</title></head>
<body style="font-family:tahoma;text-align:center;padding:40px">
<h1>سایت یافت نشد</h1>
<p>دامنه <strong>${host}</strong> ثبت نشده یا هنوز فعال نشده است.</p>
</body></html>`);
    return;
  }

  const uploadsDir = path.join(
    coreConfig.provisionedRoot,
    instance.slug,
    'uploads',
  );

  req.ctx = {
    type: 'tenant',
    host,
    instance,
    databaseName: instance.databaseName,
    templateSlug: instance.templateSlug,
    uploadsDir,
  };

  next();
}
