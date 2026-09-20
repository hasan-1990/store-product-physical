import type { Express, Request, Response, NextFunction } from 'express';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { coreConfig } from '@core-shared';
import { requireShopStarterTenant } from './middleware';

function templatePublicDir(templateSlug: string): string {
  return path.join(coreConfig.templatesRoot, templateSlug, 'public');
}

/** assetهای مشترک قالب: /images, /template-assets */
export function registerShopStarterStatic(app: Express): void {
  const serveTemplatePublic =
    (subPath: string) =>
    (req: Request, res: Response, next: NextFunction) => {
      if (!requireShopStarterTenant(req, res)) return;
      const root = path.join(templatePublicDir(req.ctx!.templateSlug), subPath);
      if (!fs.existsSync(root)) {
        return res.status(404).type('text/plain').send('Not found');
      }
      express.static(root, { fallthrough: false, index: false })(req, res, next);
    };

  app.use('/images', serveTemplatePublic('images'));
  app.use('/template-assets', serveTemplatePublic('assets'));
}
